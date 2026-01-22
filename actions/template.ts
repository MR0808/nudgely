'use server';

import GithubSlugger from 'github-slugger';
import { Plan, TemplateCategory } from '@/generated/prisma/client';

import { authCheckServer } from '@/lib/authCheck';
import { prisma } from '@/lib/prisma';
import {
    CombinedTemplate,
    GlobalTemplate,
    TeamTemplate
} from '@/types/template';

const slugger = new GithubSlugger();

export const getGlobalTemplates = async (
    userTier?: string
): Promise<GlobalTemplate[]> => {
    try {
        const templates = await prisma.globalTemplate.findMany({
            where: {
                isActive: true,
                ...(userTier === 'FREE' ? { tier: 'FREE' } : {})
            },
            orderBy: { name: 'asc' }
        });
        return templates;
    } catch (error) {
        return [];
    }
};

export const getTeamTemplates = async (
    teamId: string,
    hasPro: boolean
): Promise<TeamTemplate[]> => {
    if (!hasPro) {
        return [];
    }

    try {
        const templates = await prisma.teamTemplate.findMany({
            where: {
                teamId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });
        return templates.map((t) => ({
            ...t,
            description: t.description || ''
        }));
    } catch (error) {
        return [];
    }
};

export const getAllTemplates = async ({
    teamId,
    plan
}: {
    teamId?: string;
    plan: Plan;
}): Promise<{
    templates: CombinedTemplate[];
    categories: string[];
}> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            templates: [],
            categories: []
        };
    }

    try {
        const hasPro = plan.priceMonthly !== 0;
        const userTier = plan.priceMonthly === 0 ? 'FREE' : 'PRO';

        const [globalTemplates, teamTemplates] = await Promise.all([
            getGlobalTemplates(userTier),
            teamId ? getTeamTemplates(teamId, hasPro) : Promise.resolve([])
        ]);

        // Combine templates
        const combinedTemplates: CombinedTemplate[] = [
            ...globalTemplates.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                isTeam: false
            })),
            ...teamTemplates.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                isTeam: true
            }))
        ];

        // Get unique categories
        const categories = Array.from(
            new Set(combinedTemplates.map((t) => t.category))
        ).sort();

        return {
            templates: combinedTemplates,
            categories
        };
    } catch (error) {
        return {
            templates: [],
            categories: []
        };
    }
};

export const createTeamTemplate = async (data: {
    name: string;
    description: string;
    category: TemplateCategory;
    isActive: boolean;
    teamId: string;
}): Promise<{ success: boolean; error?: string; template?: TeamTemplate }> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return { success: false, error: 'Not authorised' };
    }

    try {
        let slug = slugger.slug(data.name);
        let slugExists = true;

        while (slugExists) {
            const checkSlug = await prisma.teamTemplate.findUnique({
                where: { slug }
            });
            if (!checkSlug) {
                slugExists = false;
                break;
            } else {
                slug = slugger.slug(data.name);
            }
        }
        const template = await prisma.teamTemplate.create({
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                isActive: data.isActive,
                teamId: data.teamId,
                slug
            },
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                isActive: true
            }
        });

        return { success: true, template };
    } catch (error) {
        return { success: false, error: 'Failed to create template' };
    }
};

export async function updateTeamTemplate(
    id: string,
    data: {
        name: string;
        description: string;
        category: TemplateCategory;
        isActive: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    const userSession = await authCheckServer();

    if (!userSession) {
        return { success: false, error: 'Not authorised' };
    }
    try {
        const currentTemplate = await prisma.teamTemplate.findUnique({
            where: { id }
        });

        if (!currentTemplate) {
            return { success: false, error: 'No template found' };
        }
        const teamId = currentTemplate.teamId;

        const existingTemplate = await prisma.teamTemplate.findFirst({
            where: {
                teamId,
                name: data.name
            }
        });

        if (existingTemplate && existingTemplate.id !== id) {
            return {
                success: false,
                error: 'A team with this name already exists'
            };
        }

        let slug = currentTemplate.slug;

        if (data.name !== currentTemplate.name) {
            slug = slugger.slug(data.name);
            let slugExists = true;

            while (slugExists) {
                const checkSlug = await prisma.teamTemplate.findUnique({
                    where: { slug }
                });
                if (!checkSlug) {
                    slugExists = false;
                    break;
                } else {
                    slug = slugger.slug(data.name);
                }
            }
        }
        await prisma.teamTemplate.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                isActive: data.isActive
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating team template:', error);
        return { success: false, error: 'Failed to update template' };
    }
}

export const deleteTeamTemplate = async (
    id: string
): Promise<{ success: boolean; error?: string }> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return { success: false, error: 'Not authorised' };
    }

    try {
        await prisma.teamTemplate.delete({
            where: { id }
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete template' };
    }
};

