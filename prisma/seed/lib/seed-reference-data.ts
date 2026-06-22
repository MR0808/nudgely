import { readFileSync } from 'node:fs';

import type {
    BadgeColour,
    Support,
    TemplateCategory,
    TemplateTier
} from '@/generated/prisma/client';
import type { DirectPrismaClient } from '@/lib/create-prisma-client';

import {
    parseBool,
    parseOptionalDate,
    parseOptionalInt,
    parseRequiredDate,
    readCsv
} from './csv';
import { seedDataPath } from './paths';

async function createManyInChunks<T extends object>(
    createMany: (data: T[]) => Promise<unknown>,
    data: T[],
    label: string,
    chunkSize = 500
) {
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await createMany(chunk);
    }

    console.log(`  ✓ ${label} (${data.length})`);
}

export async function seedReferenceData(prisma: DirectPrismaClient) {
    console.log('📦 Seeding reference data...');

    const currencies = readCsv(seedDataPath('currencies.csv')).map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        symbol: row.symbol || null,
        decimals: parseOptionalInt(row.decimals),
        demonym: row.demonym || null,
        majorSingle: row.majorSingle || null,
        majorPlural: row.majorPlural || null,
        ISOnum: parseOptionalInt(row.ISOnum),
        symbolNative: row.symbolNative,
        minorSingle: row.minorSingle || null,
        minorPlural: row.minorPlural || null,
        ISOdigits: parseOptionalInt(row.ISOdigits),
        numToBasic: parseOptionalInt(row.numToBasic)
    }));

    await createManyInChunks(
        (data) => prisma.currency.createMany({ data }),
        currencies,
        'currencies'
    );

    const continents = readCsv(seedDataPath('continents.csv')).map((row) => ({
        id: row.id,
        name: row.name
    }));

    await createManyInChunks(
        (data) => prisma.continent.createMany({ data }),
        continents,
        'continents'
    );

    const countries = readCsv(seedDataPath('countries.csv')).map((row) => ({
        id: row.id,
        isoCode: row.isoCode,
        isoCode3: row.isoCode3,
        name: row.name,
        flag: row.flag,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        currencyId: row.currencyId,
        continentId: row.continentId,
        phonePrefix: row.phonePrefix || null,
        createdAt: parseRequiredDate(row.createdAt),
        updatedAt: parseRequiredDate(row.updatedAt)
    }));

    await createManyInChunks(
        (data) => prisma.country.createMany({ data }),
        countries,
        'countries'
    );

    const regions = readCsv(seedDataPath('regions.csv')).map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        countryId: row.countryId,
        createdAt: parseRequiredDate(row.createdAt),
        updatedAt: parseRequiredDate(row.updatedAt)
    }));

    await createManyInChunks(
        (data) => prisma.region.createMany({ data }),
        regions,
        'regions'
    );

    const industries = readCsv(seedDataPath('industries.csv')).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        createdAt: parseOptionalDate(row.createdAt),
        updatedAt: parseOptionalDate(row.updatedAt)
    }));

    await createManyInChunks(
        (data) => prisma.industry.createMany({ data }),
        industries,
        'industries'
    );

    const companySizes = readCsv(seedDataPath('companySizes.csv')).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        size: row.size,
        order: Number(row.order),
        createdAt: parseOptionalDate(row.createdAt),
        updatedAt: parseOptionalDate(row.updatedAt)
    }));

    await createManyInChunks(
        (data) => prisma.companySize.createMany({ data }),
        companySizes,
        'companySizes'
    );

    const plans = readCsv(seedDataPath('plans.csv')).map((row) => ({
        id: row.id,
        createdAt: parseRequiredDate(row.createdAt),
        updatedAt: parseRequiredDate(row.updatedAt),
        name: row.name,
        slug: row.slug,
        level: Number(row.level),
        description: row.description,
        icon: row.icon,
        iconClassname: row.iconClassname || null,
        features: row.features
            .split(',')
            .map((feature) => feature.trim())
            .filter(Boolean),
        headline: row.headline,
        popular: parseBool(row.popular),
        priceMonthly: Number(row.priceMonthly),
        priceYearly: Number(row.priceYearly),
        maxAdmin: Number(row.maxAdmin),
        maxUsers: Number(row.maxUsers),
        maxTeams: Number(row.maxTeams),
        maxNudges: Number(row.maxNudges),
        maxRecipients: Number(row.maxRecipients),
        allTemplates: parseBool(row.allTemplates),
        customTemplates: parseBool(row.customTemplates),
        nudgeHistory: Number(row.nudgeHistory),
        stats: parseBool(row.stats),
        dataExport: parseBool(row.dataExport),
        branding: parseBool(row.branding),
        stripeMonthlyId: row.stripeMonthlyId,
        stripeMonthlyLookup: row.stripeMonthlyLookup,
        stripeYearlyId: row.stripeYearlyId,
        stripeYearlyLookup: row.stripeYearlyLookup,
        support: row.support as Support,
        colour: row.colour as BadgeColour
    }));

    await createManyInChunks(
        (data) => prisma.plan.createMany({ data }),
        plans,
        'plans'
    );

    const globalTemplates = JSON.parse(
        readFileSync(seedDataPath('global_templates.json'), 'utf8')
    ) as Array<{
        id: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        description: string;
        category: TemplateCategory;
        tier: TemplateTier;
        isActive: boolean;
    }>;

    await createManyInChunks(
        (data) =>
            prisma.globalTemplate.createMany({
                data: data.map((template) => ({
                    ...template,
                    createdAt: new Date(template.createdAt),
                    updatedAt: new Date(template.updatedAt)
                }))
            }),
        globalTemplates,
        'global_templates'
    );
}
