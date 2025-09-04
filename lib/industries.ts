'use server';

import { prisma } from '@/lib/prisma';

export const getAllIndustries = async () => {
    try {
        const industries = await prisma.industry.findMany({
            orderBy: {
                name: 'asc' // Sort alphabetically by name
            }
        });

        // Separate "Other" (case-insensitive) and other industries
        const otherIndustry = industries.find(
            (industry) => industry.name.toLowerCase() === 'other'
        );
        const otherIndustries = industries.filter(
            (industry) => industry.name.toLowerCase() !== 'other'
        );

        // Combine the arrays, placing "Other" at the end
        const sortedIndustries = [
            ...otherIndustries,
            ...(otherIndustry ? [otherIndustry] : [])
        ];

        return sortedIndustries;
    } catch {
        return null;
    }
};
