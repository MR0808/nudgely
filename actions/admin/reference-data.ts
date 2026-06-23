'use server';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/require-site-admin';

export async function getReferenceDataSummary() {
    await requireSiteAdmin();

    const [
        countries,
        regions,
        industries,
        companySizes,
        currencies,
        continents,
        plans
    ] = await Promise.all([
        prisma.country.count(),
        prisma.region.count(),
        prisma.industry.count(),
        prisma.companySize.count(),
        prisma.currency.count(),
        prisma.continent.count(),
        prisma.plan.count()
    ]);

    return {
        countries,
        regions,
        industries,
        companySizes,
        currencies,
        continents,
        plans
    };
}

export async function getIndustries() {
    await requireSiteAdmin();
    const industriesRaw = await prisma.industry.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { companies: true } } }
    });
    return industriesRaw as unknown as Prisma.IndustryGetPayload<{
        include: { _count: { select: { companies: true } } };
    }>[];
}

export async function getCompanySizes() {
    await requireSiteAdmin();
    const sizesRaw = await prisma.companySize.findMany({
        orderBy: { order: 'asc' },
        include: { _count: { select: { companies: true } } }
    });
    return sizesRaw as unknown as Prisma.CompanySizeGetPayload<{
        include: { _count: { select: { companies: true } } };
    }>[];
}

export async function getCountries(limit = 50) {
    await requireSiteAdmin();
    const countriesRaw = await prisma.country.findMany({
        orderBy: { name: 'asc' },
        take: limit,
        include: { _count: { select: { companies: true } } }
    });
    return countriesRaw as unknown as Prisma.CountryGetPayload<{
        include: { _count: { select: { companies: true } } };
    }>[];
}

export async function updateIndustry(industryId: string, name: string) {
    await requireSiteAdmin();
    await prisma.industry.update({
        where: { id: industryId },
        data: { name }
    });
    return { success: true };
}

export async function updateCompanySize(
    companySizeId: string,
    name: string
) {
    await requireSiteAdmin();
    await prisma.companySize.update({
        where: { id: companySizeId },
        data: { name }
    });
    return { success: true };
}
