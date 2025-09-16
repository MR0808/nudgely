'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { EditCompanySchema } from '@/schemas/company';
import { deleteImage } from '@/actions/supabase';

const slugger = new GithubSlugger();

export const getUserCompany = async () => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return { data: null, error: 'Not authorised' };
        }

        const { user } = userSession;

        const company = await prisma.companyMember.findFirst({
            where: { userId: user.id }
        });

        if (!company) {
            return { data: null, error: 'Error getting company' };
        }

        return { data: company?.companyId, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const getCompany = async () => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return {
                company: null,
                image: null,
                userCompany: null,
                error: 'Not authorised'
            };
        }

        const { user } = userSession;

        const userCompany = await prisma.companyMember.findFirst({
            where: { userId: user.id }
        });

        if (!userCompany) {
            return {
                company: null,
                image: null,
                userCompany: null,
                error: 'Error getting company'
            };
        }

        const company = await prisma.company.findUnique({
            where: { id: userCompany.companyId },
            include: {
                creator: true,
                members: true,
                teams: true,
                invites: true,
                companySize: true,
                industry: true,
                country: true,
                region: true,
                plan: true
            }
        });

        if (!company)
            return {
                company: null,
                image: null,
                userCompany: null,
                error: 'Error getting company'
            };

        const image = await prisma.image.findFirst({
            where: { relatedEntity: company.id }
        });

        return { company, image, userCompany, error: null };
    } catch (error) {
        return { company: null, image: null, userCompany: null, error };
    }
};

export const getCompanyForSelector = async () => {
    try {
        const userSession = await authCheckServer();

        if (!userSession) {
            return { company: null, error: 'Not authorised' };
        }

        const { user } = userSession;

        const company = await prisma.companyMember.findFirst({
            where: { userId: user.id },
            include: { company: { include: { plan: true } } }
        });

        if (!company) {
            return { company: null, error: 'No company found' };
        }

        return {
            company: {
                companyName: company.company.name,
                companyPlan: company.company.plan,
                isCompanyTrialing: company.company.trialEndsAt
                    ? new Date() < company.company.trialEndsAt
                    : false,
                trialEndsAt: company.company.trialEndsAt
            },
            error: null
        };
    } catch (error) {
        return { company: null, error };
    }
};

export const updateCompany = async (
    values: z.infer<typeof EditCompanySchema>
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    try {
        // Validate input
        const validatedFields = EditCompanySchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                data: null,
                message: 'Invalid fields'
            };
        }

        const name = values.name.trim();

        let slug = slugger.slug(name);
        let slugExists = true;

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

        // Create the team
        const companyDb = await prisma.company.update({
            where: { id: company.id },
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
                website: values.website,
                companySizeId: values.companySize,
                industryId: values.industry,
                timezone: values.timezone,
                locale: values.locale
            }
        });

        if (!companyDb) {
            return {
                data: null,
                error: 'An error occurred creating your company. Please try again.'
            };
        }

        revalidatePath('/company');

        return { data: companyDb, error: null };
    } catch (error) {
        return { data: null, error: 'Failed to create company' };
    }
};

export const updateCompanyLogo = async (imageId: string) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        if (company.image) {
            const oldImage = await prisma.image.findUnique({
                where: { id: company.image }
            });

            if (!oldImage) {
                return {
                    data: null,
                    error: 'Original image not found.'
                };
            }

            await deleteImage(oldImage?.image, 'images', oldImage.id);
        }

        if (imageId === 'removedLogo') {
            await prisma.company.update({
                where: { id: company.id },
                data: { image: null }
            });

            revalidatePath('/company');

            return {
                data: company,
                error: null
            };
        }

        await prisma.company.update({
            where: { id: company.id },
            data: { image: imageId }
        });

        await prisma.image.update({
            where: { id: imageId },
            data: { relatedEntity: company.id }
        });

        revalidatePath('/company');

        return {
            data: company,
            error: null
        };
    } catch (error) {
        return { data: null, error: 'Failed to create company' };
    }
};
