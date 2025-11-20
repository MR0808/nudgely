'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getCompanyContext } from '@/lib/companyContext';
import { EditCompanySchema } from '@/schemas/company';
import { deleteImage } from '@/actions/supabase';
import { logCompanyUpdated } from '@/actions/audit/audit-company';
import type { CompanyCheckResult } from '@/types/company';

/* ------------------------------------------------------------------
 * 🛠️ Utilities
 * ------------------------------------------------------------------ */

/**
 * Generate a unique company slug based on name.
 * Ensures no collisions with other companies (excluding this company).
 */
async function generateUniqueCompanySlug(
    name: string,
    companyId: string
): Promise<string> {
    const localSlugger = new GithubSlugger();
    const baseSlug = localSlugger.slug(name);

    const existing = await prisma.company.findMany({
        where: {
            slug: {
                startsWith: baseSlug
            },
            NOT: {
                id: companyId
            }
        },
        select: {
            slug: true
        }
    });

    const existingSlugs = new Set(existing.map((e) => e.slug));

    if (!existingSlugs.has(baseSlug)) {
        return baseSlug;
    }

    let counter = 2;
    let candidate = baseSlug;

    while (existingSlugs.has(candidate)) {
        candidate = `${baseSlug}-${counter}`;
        counter++;
    }

    return candidate;
}

/* ------------------------------------------------------------------
 * 🔎 Company Status Check
 * ------------------------------------------------------------------ */

export const checkCompanyStatus = async () => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { userCompany } = ctx;

    // User is logged in but not a company admin (or no company membership)
    if (!userCompany || !ctx.isAdmin) {
        const data: CompanyCheckResult = {
            isCompanyAdmin: false,
            companyId: null,
            companyName: null,
            isComplete: true,
            missingFields: []
        };

        return {
            success: true,
            data,
            error: null
        };
    }

    // Fetch the latest company data from DB (session may be stale)
    const company = await prisma.company.findUnique({
        where: { id: userCompany.companyId },
        include: {
            region: true,
            country: true
        }
    });

    if (!company) {
        return {
            success: false,
            data: null,
            error: 'Company not found'
        };
    }

    const requiredFields = [
        { field: 'name', value: company.name, label: 'Company Name' },
        { field: 'address1', value: company.address1, label: 'Address' },
        { field: 'city', value: company.city, label: 'City' },
        { field: 'region', value: company.regionId, label: 'Region' },
        {
            field: 'postalCode',
            value: company.postalCode,
            label: 'Postal Code'
        },
        { field: 'country', value: company.countryId, label: 'Country' },
        { field: 'timezone', value: company.timezone, label: 'Timezone' },
        { field: 'locale', value: company.locale, label: 'Locale' },
        {
            field: 'contactEmail',
            value: company.contactEmail,
            label: 'Contact Email'
        },
        {
            field: 'contactPhone',
            value: company.contactPhone,
            label: 'Contact Phone'
        }
    ];

    const missingFields = requiredFields
        .filter(({ value }) => !value)
        .map(({ label }) => label);

    const data: CompanyCheckResult = {
        isCompanyAdmin: true,
        companyId: company.id,
        companyName: company.name ?? null,
        isComplete: missingFields.length === 0,
        missingFields
    };

    return {
        success: true,
        data,
        error: null
    };
};

/* ------------------------------------------------------------------
 * 👤 Get User's Company (just the ID)
 * ------------------------------------------------------------------ */

export const getUserCompany = async () => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { userCompany } = ctx;

    if (!userCompany) {
        return {
            success: false,
            data: null,
            error: 'Error getting company'
        };
    }

    return {
        success: true,
        data: {
            companyId: userCompany.companyId
        },
        error: null
    };
};

/* ------------------------------------------------------------------
 * 🏢 Get Full Company (dashboard use)
 * ------------------------------------------------------------------ */

export const getCompany = async () => {
    try {
        const ctx = await getCompanyContext();

        if (!ctx) {
            return {
                success: false,
                data: null,
                error: 'Not authorised'
            };
        }

        const { userCompany } = ctx;

        if (!userCompany) {
            return {
                success: false,
                data: null,
                error: 'No company membership found'
            };
        }

        const company = await prisma.company.findUnique({
            where: { id: userCompany.companyId },
            include: {
                creator: true,
                members: true,
                teams: { include: { nudges: true } },
                invites: true,
                companySize: true,
                industry: true,
                country: true,
                region: true,
                plan: true,
                companySubscription: true
            }
        });

        if (!company) {
            return {
                success: false,
                data: null,
                error: 'Error getting company'
            };
        }

        let image = null;

        if (company.image) {
            image = await prisma.image.findUnique({
                where: { id: company.image }
            });
        }

        return {
            success: true,
            data: {
                company,
                image,
                userCompany
            },
            error: null
        };
    } catch (error) {
        console.error('getCompany error:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to get company'
        };
    }
};

/* ------------------------------------------------------------------
 * 🔽 Get Company for Selector (lightweight)
 * ------------------------------------------------------------------ */

export const getCompanyForSelector = async () => {
    try {
        const ctx = await getCompanyContext();

        if (!ctx) {
            return {
                success: false,
                data: null,
                error: 'Not authorised'
            };
        }

        const { userCompany } = ctx;

        if (!userCompany) {
            return {
                success: false,
                data: null,
                error: 'No company found'
            };
        }

        const company = await prisma.company.findUnique({
            where: { id: userCompany.companyId },
            include: {
                plan: true
            }
        });

        if (!company) {
            return {
                success: false,
                data: null,
                error: 'No company found'
            };
        }

        const isCompanyTrialing = company.trialEndsAt
            ? new Date() < company.trialEndsAt
            : false;

        return {
            success: true,
            data: {
                companyName: company.name,
                companyPlan: company.plan,
                isCompanyTrialing,
                trialEndsAt: company.trialEndsAt
            },
            error: null
        };
    } catch (error) {
        console.error('getCompanyForSelector error:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to get company for selector'
        };
    }
};

/* ------------------------------------------------------------------
 * ✏️ Update Company Details
 * ------------------------------------------------------------------ */

export const updateCompany = async (
    values: z.infer<typeof EditCompanySchema>
) => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validatedFields = EditCompanySchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                success: false,
                data: null,
                error: 'Invalid fields'
            };
        }

        const data = validatedFields.data;

        const name = data.name.trim();

        // Generate a unique slug for this company
        const slug = await generateUniqueCompanySlug(
            name,
            userCompany.companyId
        );

        // Compute profile completion based on the submitted values
        const requiredFields = [
            { value: data.name, label: 'Company Name' },
            { value: data.address1, label: 'Address' },
            { value: data.city, label: 'City' },
            { value: data.region, label: 'Region' },
            { value: data.postalCode, label: 'Postal Code' },
            { value: data.country, label: 'Country' },
            { value: data.timezone, label: 'Timezone' },
            { value: data.locale, label: 'Locale' },
            { value: data.contactEmail, label: 'Contact Email' },
            { value: data.contactPhone, label: 'Contact Phone' }
        ];

        const missingFields = requiredFields
            .filter(({ value }) => !value)
            .map(({ label }) => label);

        const profileCompleted = missingFields.length === 0;

        // Audit log BEFORE the update, using the session company snapshot
        await logCompanyUpdated(user.id, {
            companyId: userCompany.companyId,
            oldCompany: company,
            name,
            slug,
            address1: data.address1,
            address2: data.address2,
            city: data.city,
            regionId: data.region,
            postalCode: data.postalCode,
            countryId: data.country,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            website: data.website,
            companySizeId: data.companySize,
            industryId: data.industry,
            timezone: data.timezone,
            locale: data.locale
        });

        const updatedCompany = await prisma.company.update({
            where: { id: userCompany.companyId },
            data: {
                name,
                slug,
                address1: data.address1,
                address2: data.address2,
                city: data.city,
                regionId: data.region,
                postalCode: data.postalCode,
                countryId: data.country,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                website: data.website,
                companySizeId: data.companySize,
                industryId: data.industry,
                timezone: data.timezone,
                locale: data.locale,
                profileCompleted
            }
        });

        revalidatePath('/company');

        return {
            success: true,
            data: {
                company: updatedCompany
            },
            error: null
        };
    } catch (error) {
        console.error('updateCompany error:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to update company'
        };
    }
};

/* ------------------------------------------------------------------
 * 🖼️ Update Company Logo
 * ------------------------------------------------------------------ */

export const updateCompanyLogo = async (imageId: string) => {
    const ctx = await getCompanyContext();

    if (!ctx) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    const { company, userCompany, isAdmin } = ctx;

    if (!isAdmin || !userCompany) {
        return {
            success: false,
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        // If there is an existing logo, clean it up
        if (company?.image) {
            const oldImage = await prisma.image.findUnique({
                where: { id: company.image }
            });

            if (oldImage) {
                await deleteImage(oldImage.image, 'images', oldImage.id);
            }
        }

        if (imageId === 'removedLogo') {
            await prisma.company.update({
                where: { id: userCompany.companyId },
                data: { image: null }
            });

            revalidatePath('/company');

            return {
                success: true,
                data: {
                    companyId: userCompany.companyId,
                    imageId: null
                },
                error: null
            };
        }

        // Set new logo + link image to this company
        await Promise.all([
            prisma.company.update({
                where: { id: userCompany.companyId },
                data: { image: imageId }
            }),
            prisma.image.update({
                where: { id: imageId },
                data: { relatedEntity: userCompany.companyId }
            })
        ]);

        revalidatePath('/company');

        return {
            success: true,
            data: {
                companyId: userCompany.companyId,
                imageId
            },
            error: null
        };
    } catch (error) {
        console.error('updateCompanyLogo error:', error);
        return {
            success: false,
            data: null,
            error: 'Failed to update company logo'
        };
    }
};
