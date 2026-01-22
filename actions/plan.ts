'use server';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { ActionResult } from '@/types/global';
import { Plan } from '@/generated/prisma/client';

//
// ---------------------------------------------------------
// GET CURRENT COMPANY PLAN
// ---------------------------------------------------------
//
export const getPlan = async (): Promise<ActionResult<{ plan: Plan }>> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            message: 'Not authorised'
        };
    }

    const { company } = userSession;

    try {
        const plan = await prisma.plan.findUnique({
            where: { id: company.planId }
        });

        if (!plan) {
            return {
                success: false,
                message: 'Failed to fetch plan'
            };
        }

        return {
            success: true,
            message: 'Plan retrieved successfully',
            data: { plan }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to get plan - ${String(error)}`
        };
    }
};

//
// ---------------------------------------------------------
// GET ALL PLANS
// ---------------------------------------------------------
//
export const getPlans = async (): Promise<ActionResult<{ plans: Plan[] }>> => {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { priceMonthly: 'asc' }
        });

        return {
            success: true,
            message: 'Plans retrieved successfully',
            data: { plans }
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to get plans - ${String(error)}`
        };
    }
};

