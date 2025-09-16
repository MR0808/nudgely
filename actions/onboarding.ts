'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { CompanyOnboardingSchema } from '@/schemas/onboarding';

const slugger = new GithubSlugger();

export const updateCompany = async (
    values: z.infer<typeof CompanyOnboardingSchema>
) => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (company.creatorId !== user.id) {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            message: 'Not authorised'
        };
    }

    try {
        // Validate input
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

        if (values.logo) {
            await prisma.image.update({
                where: { id: values.logo },
                data: { relatedEntity: companyDb.id }
            });
        }

        return { data: companyDb, error: null };
    } catch (error) {
        return { data: null, error: 'Failed to create company' };
    }
};
