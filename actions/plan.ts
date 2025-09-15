'use server';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

export const getPlan = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            plan: null,
            error: 'Not authorised'
        };
    }

    const { company } = userSession;

    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) return { plan: null, error: 'Failed to get plan' };

        return { plan, error: null };
    } catch (error) {
        return { plan: null, error: `Failed to get plan - ${error}` };
    }
};
