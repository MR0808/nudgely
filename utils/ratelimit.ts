import { prisma } from '@/lib/prisma';
import type { RateLimit } from '@/generated/prisma/client';

export const calculateCooldownSeconds = (resetTime: Date): number => {
    return Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

export const getRateLimits = async (key: string): Promise<RateLimit | null> => {
    const record = await prisma.rateLimit.findUnique({
        where: { key }
    });

    if (record && record.resetTime <= new Date()) {
        // Reset expired rate limit
        return await prisma.rateLimit.update({
            where: { key },
            data: {
                count: 0,
                resetTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
        });
    }

    return record;
};

