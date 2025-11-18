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

const checkCompanyAdminUser = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return false;
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return false;
    }

    return { user, companyMember: userCompany };
};

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

export const saveBasicInfo = async (values: z.infer<typeof step1Schema>) => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const validatedFields = step1Schema.safeParse(values);

        if (!validatedFields.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const name = values.name.trim();
        let slug = slugger.slug(name);
        let slugExists = true;

        // Only regenerate slug if name changed
        if (companyMember.company.name !== name) {
            while (slugExists) {
                const checkSlug = await prisma.company.findUnique({
                    where: { slug }
                });
                if (!checkSlug || checkSlug.id === companyMember.companyId) {
                    slugExists = false;
                    break;
                } else {
                    slug = slugger.slug(name);
                }
            }
        } else {
            slug = companyMember.company.slug;
        }

        const updatedCompany = await prisma.company.update({
            where: { id: companyMember.companyId },
            data: {
                name,
                slug,
                image: values.logo || null
            }
        });

        if (values.logo) {
            await prisma.image.update({
                where: { id: values.logo },
                data: { relatedEntity: companyMember.companyId }
            });
        }

        return { data: updatedCompany, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: 'Failed to save basic information' };
    }
};

export const saveAddress = async (values: z.infer<typeof step2Schema>) => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const validatedFields = step2Schema.safeParse(values);

        if (!validatedFields.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const updatedCompany = await prisma.company.update({
            where: { id: companyMember.companyId },
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

        return { data: updatedCompany, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: 'Failed to save address information' };
    }
};

export const saveContact = async (values: z.infer<typeof step3Schema>) => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const validatedFields = step3Schema.safeParse(values);

        if (!validatedFields.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const updatedCompany = await prisma.company.update({
            where: { id: companyMember.companyId },
            data: {
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone
            }
        });

        return { data: updatedCompany, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: 'Failed to save contact information' };
    }
};

export const saveAdditionalInfo = async (
    values: z.infer<typeof step4Schema>
) => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const validatedFields = step4Schema.safeParse(values);

        if (!validatedFields.success) {
            return { data: null, error: 'Invalid fields' };
        }

        const website = values.website || null;
        const companySizeId = values.companySize || null;
        const industryId = values.industry || null;

        const updatedCompany = await prisma.company.update({
            where: { id: companyMember.companyId },
            data: {
                website,
                companySizeId,
                industryId
            }
        });

        // This happens only after the final step
        const isComplete = checkProfileComplete(updatedCompany);

        if (isComplete && !updatedCompany.profileCompleted) {
            await prisma.company.update({
                where: { id: companyMember.companyId },
                data: { profileCompleted: true }
            });
        }

        return { data: updatedCompany, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: 'Failed to save additional information' };
    }
};

// Keep the original updateCompany for backward compatibility or final submission
export const updateCompany = async (
    values: z.infer<typeof CompanyOnboardingSchema>
) => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const validatedFields = CompanyOnboardingSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const name = values.name.trim();

        let slug = slugger.slug(name);
        let slugExists = true;

        const website = values.website || undefined;
        const companySizeId = values.companySize || undefined;
        const industryId = values.industry || undefined;

        while (slugExists) {
            const checkSlug = await prisma.company.findUnique({
                where: { slug }
            });
            if (!checkSlug) {
                slugExists = false;
                break;
            } else {
                slug = slugger.slug(name);
            }
        }

        const companyDb = await prisma.company.update({
            where: { id: companyMember.companyId },
            data: {
                name,
                slug,
                address1: values.address1,
                address2: values.address2,
                city: values.city,
                regionId: values.region,
                postalCode: values.postalCode,
                countryId: values.country,
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone,
                website,
                companySizeId,
                industryId,
                timezone: values.timezone,
                locale: values.locale,
                image: values.logo,
                profileCompleted: true
            }
        });

        if (!companyDb) {
            return {
                data: null,
                error: 'An error occurred creating your company. Please try again.'
            };
        }

        return { data: companyDb, error: null };
    } catch (error) {
        console.log(error);
        return { data: null, error: 'Failed to create company' };
    }
};

export const removeImageFromCompany = async () => {
    const checkCompanyUser = await checkCompanyAdminUser();

    if (!checkCompanyUser) {
        return { data: null, error: 'Not authorized' };
    }

    const { user, companyMember } = checkCompanyUser;

    try {
        const companyDb = await prisma.company.update({
            where: { id: companyMember.companyId },
            data: { image: null }
        });

        if (!companyDb) {
            return {
                data: null,
                error: 'An error occurred updating your company. Please try again.'
            };
        }

        return { data: companyDb, error: null };
    } catch (error) {
        return { data: null, error: 'Failed to create company' };
    }
};
