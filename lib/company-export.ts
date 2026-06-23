import { prisma } from '@/lib/prisma';

export async function buildCompanyExportData(companyId: string) {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            id: true,
            name: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
            website: true,
            timezone: true,
            locale: true,
            createdAt: true,
            plan: { select: { name: true, slug: true } },
            members: {
                select: {
                    role: true,
                    user: {
                        select: {
                            email: true,
                            name: true,
                            lastName: true,
                            status: true
                        }
                    }
                }
            },
            teams: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    nudges: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            status: true,
                            frequency: true,
                            interval: true,
                            timeOfDay: true,
                            timezone: true,
                            startDate: true,
                            endType: true,
                            endDate: true,
                            createdAt: true,
                            recipients: {
                                select: { name: true, email: true }
                            },
                            _count: {
                                select: {
                                    instances: true,
                                    completions: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!company) {
        return null;
    }

    const exportedAt = new Date().toISOString();

    return {
        exportedAt,
        company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            website: company.website,
            timezone: company.timezone,
            locale: company.locale,
            createdAt: company.createdAt,
            plan: company.plan
        },
        members: company.members.map((m) => ({
            role: m.role,
            email: m.user.email,
            name: m.user.name,
            lastName: m.user.lastName,
            status: m.user.status
        })),
        teams: company.teams.map((team) => ({
            id: team.id,
            name: team.name,
            slug: team.slug,
            nudges: team.nudges.map((nudge) => ({
                id: nudge.id,
                name: nudge.name,
                slug: nudge.slug,
                status: nudge.status,
                frequency: nudge.frequency,
                interval: nudge.interval,
                timeOfDay: nudge.timeOfDay,
                timezone: nudge.timezone,
                startDate: nudge.startDate,
                endType: nudge.endType,
                endDate: nudge.endDate,
                createdAt: nudge.createdAt,
                recipientCount: nudge.recipients.length,
                recipients: nudge.recipients,
                instanceCount: nudge._count.instances,
                completionCount: nudge._count.completions
            }))
        }))
    };
}
