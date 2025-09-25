'use server';

import * as z from 'zod';
import GithubSlugger from 'github-slugger';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';

const slugger = new GithubSlugger();

export const getCompanyNudgeCount = async () => {
    const userSession = await authCheckServer();

    if (!userSession) {
        throw new Error('Not authorised');
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        throw new Error('Not authorised');
    }
    try {
        const companyWithNudges = await prisma.company.findUnique({
            where: {
                id: company.id
            },
            include: {
                teams: {
                    include: {
                        nudges: true
                    }
                }
            }
        });

        if (!companyWithNudges) {
            throw new Error('Company not found');
        }

        // Sum the number of nudges across all teams
        const nudgeCount = companyWithNudges.teams.reduce((total, team) => {
            return total + team.nudges.length;
        }, 0);

        return nudgeCount;
    } catch (error) {
        console.error('Error fetching nudge count:', error);
        throw error;
    }
};
