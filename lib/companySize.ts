'use server';

import { prisma } from '@/lib/prisma';

export const getAllCompanySizes = async () => {
    try {
        const companySizes = await prisma.companySize.findMany({
            orderBy: { order: 'asc' }
        });

        return companySizes;
    } catch {
        return null;
    }
};
