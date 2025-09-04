'use server';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

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
                region: true
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
            include: { company: true }
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
