'use server';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

export const getUserCompany = async (userId: string) => {
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
