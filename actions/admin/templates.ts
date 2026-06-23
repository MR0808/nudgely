'use server';

import {
    TemplateCategory,
    TemplateTier
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/admin-audit';
import { requireSiteAdmin } from '@/lib/require-site-admin';

export async function getTemplates(searchParams: {
    [key: string]: string | string[] | undefined;
}) {
    await requireSiteAdmin();

    const page = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);
    const search = searchParams.search as string | undefined;
    const tier = searchParams.tier as string | undefined;
    const active = searchParams.active as string | undefined;

    const where = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
            ]
        }),
        ...(tier && tier !== 'all' && { tier: tier as TemplateTier }),
        ...(active === 'true' && { isActive: true }),
        ...(active === 'false' && { isActive: false })
    };

    const [templates, totalCount] = await Promise.all([
        prisma.globalTemplate.findMany({
            where,
            orderBy: { name: 'asc' },
            ...(pageSize !== -1 && {
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        }),
        prisma.globalTemplate.count({ where })
    ]);

    return { templates, totalCount };
}

export async function updateTemplate(
    templateId: string,
    data: {
        name?: string;
        description?: string;
        category?: TemplateCategory;
        tier?: TemplateTier;
        isActive?: boolean;
    }
) {
    const session = await requireSiteAdmin();

    const template = await prisma.globalTemplate.findUnique({
        where: { id: templateId }
    });
    if (!template) throw new Error('Template not found');

    await prisma.globalTemplate.update({
        where: { id: templateId },
        data
    });

    await logAdminAction(
        session.user.id,
        'admin.template_updated',
        `Updated template ${template.name}`,
        { templateId, changes: data }
    );

    return { success: true };
}

export async function toggleTemplateActive(templateId: string) {
    const session = await requireSiteAdmin();
    const template = await prisma.globalTemplate.findUnique({
        where: { id: templateId }
    });
    if (!template) throw new Error('Template not found');

    await prisma.globalTemplate.update({
        where: { id: templateId },
        data: { isActive: !template.isActive }
    });

    await logAdminAction(
        session.user.id,
        'admin.template_updated',
        `${template.isActive ? 'Deactivated' : 'Activated'} template ${template.name}`,
        { templateId, isActive: !template.isActive }
    );

    return { success: true };
}
