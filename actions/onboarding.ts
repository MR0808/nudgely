'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

import {
    CompanyOnboardingSchema,
    step1Schema,
    step2Schema,
    step3Schema,
    step4Schema
} from '@/schemas/onboarding';

const slugger = new GithubSlugger();

/**
 * Ensure the current user:
 *  - Is authenticated
 *  - Is a Company Admin
 *  - Belongs to an existing company
 *
 * Returns a fully typed structure:
 * {
 *    user: User
 *    company: Company
 *    companyMember: CompanyMember
 * }
 */
const requireCompanyAdmin = async () => {
    const session = await authCheckServer();
    if (!session) return false;

    const { user, company, userCompany } = session;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return false;
    }

    // Fetch full Company record to ensure non-null
    const dbCompany = await prisma.company.findUnique({
        where: { id: company.id }
    });

    if (!dbCompany) return false;

    // Fetch the CompanyMember record for type correctness
    const companyMember = await prisma.companyMember.findUnique({
        where: {
            companyId_userId: {
                companyId: dbCompany.id,
                userId: user.id
            }
        }
    });

    if (!companyMember) return false;

    return {
        user,
        company: dbCompany,
        companyMember
    };
};

/**
 * Helper to check whether a Company profile is fully complete
 */
function checkProfileComplete(data: {
    name?: string | null;
    address1?: string | null;
    city?: string | null;
    regionId?: string | null;
    postalCode?: string | null;
    countryId?: string | null;
    timezone?: string | null;
    locale?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
}) {
    return !!(
        data.name &&
        data.address1 &&
        data.city &&
        data.regionId &&
        data.postalCode &&
        data.countryId &&
        data.timezone &&
        data.locale &&
        data.contactEmail &&
        data.contactPhone
    );
}

//
// STEP 1 — Basic Info
//
export const saveBasicInfo = async (values: z.infer<typeof step1Schema>) => {
    const admin = await requireCompanyAdmin();
    if (!admin) return { data: null, error: 'Not authorized' };

    const { company, companyMember } = admin;

    try {
        const validated = step1Schema.safeParse(values);
        if (!validated.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const name = values.name.trim();

        let slug = slugger.slug(name);
        let slugExists = true;

        // Only regenerate slug if name changed
        if (company.name !== name) {
            while (slugExists) {
                const checkSlug = await prisma.company.findUnique({
                    where: { slug }
                });

                if (!checkSlug || checkSlug.id === company.id) {
                    slugExists = false;
                } else {
                    slug = slugger.slug(name);
                }
            }
        } else {
            slug = company.slug;
        }

        const updated = await prisma.company.update({
            where: { id: company.id },
            data: {
                name,
                slug,
                image: values.logo || null
            }
        });

        if (values.logo) {
            await prisma.image.update({
                where: { id: values.logo },
                data: { relatedEntity: company.id }
            });
        }

        return { data: updated, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to save basic information' };
    }
};

//
// STEP 2 — Address Info
//
export const saveAddress = async (values: z.infer<typeof step2Schema>) => {
    const admin = await requireCompanyAdmin();
    if (!admin) return { data: null, error: 'Not authorized' };

    const { company } = admin;

    try {
        const validated = step2Schema.safeParse(values);
        if (!validated.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const updated = await prisma.company.update({
            where: { id: company.id },
            data: {
                address1: values.address1,
                address2: values.address2 || null,
                city: values.city,
                regionId: values.region,
                postalCode: values.postalCode,
                countryId: values.country,
                timezone: values.timezone,
                locale: values.locale
            }
        });

        return { data: updated, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to save address information' };
    }
};

//
// STEP 3 — Contact Info
//
export const saveContact = async (values: z.infer<typeof step3Schema>) => {
    const admin = await requireCompanyAdmin();
    if (!admin) return { data: null, error: 'Not authorized' };

    const { company } = admin;

    try {
        const validated = step3Schema.safeParse(values);
        if (!validated.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const updated = await prisma.company.update({
            where: { id: company.id },
            data: {
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone
            }
        });

        return { data: updated, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to save contact information' };
    }
};

//
// STEP 4 — Additional Info
//
export const saveAdditionalInfo = async (
    values: z.infer<typeof step4Schema>
) => {
    const admin = await requireCompanyAdmin();
    if (!admin) return { data: null, error: 'Not authorized' };

    const { company } = admin;

    try {
        const validated = step4Schema.safeParse(values);
        if (!validated.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const updated = await prisma.company.update({
            where: { id: company.id },
            data: {
                website: values.website || null,
                companySizeId: values.companySize || null,
                industryId: values.industry || null
            }
        });

        const isComplete = checkProfileComplete(updated);

        if (isComplete && !updated.profileCompleted) {
            await prisma.company.update({
                where: { id: company.id },
                data: { profileCompleted: true }
            });
        }

        return { data: updated, error: null };
    } catch (err) {
        console.error(err);
        return { data: null, error: 'Failed to save additional information' };
    }
};

//
// Remove image
//
export const removeImageFromCompany = async () => {
    const admin = await requireCompanyAdmin();
    if (!admin) return { data: null, error: 'Not authorized' };

    const { company } = admin;

    try {
        const updated = await prisma.company.update({
            where: { id: company.id },
            data: { image: null }
        });

        return { data: updated, error: null };
    } catch {
        return { data: null, error: 'Failed to update company' };
    }
};
