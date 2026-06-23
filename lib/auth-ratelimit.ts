import { headers } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { calculateCooldownSeconds, getRateLimits } from '@/utils/ratelimit';

const WINDOW_MS = 15 * 60 * 1000;

const LIMITS = {
    loginEmail: 10,
    loginIp: 30,
    registerIp: 10,
    forgotPasswordEmail: 5,
    forgotPasswordIp: 15
} as const;

export async function getClientIp(): Promise<string> {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    return headerList.get('x-real-ip') || 'unknown';
}

export function getClientIpFromHeaders(
    headerList: Headers | Record<string, string | undefined>
): string {
    const get = (name: string) =>
        headerList instanceof Headers
            ? headerList.get(name)
            : headerList[name];

    const forwarded = get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    return get('x-real-ip') || 'unknown';
}

async function checkRateLimit(
    key: string,
    maxAttempts: number
): Promise<string | null> {
    const record = await getRateLimits(key);

    if (record && record.count >= maxAttempts) {
        const seconds = calculateCooldownSeconds(record.resetTime);
        return `Too many attempts. Try again in ${Math.ceil(seconds / 60)} minutes.`;
    }

    return null;
}

async function recordRateLimitAttempt(key: string) {
    const resetTime = new Date(Date.now() + WINDOW_MS);

    await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetTime },
        update: { count: { increment: 1 }, resetTime }
    });
}

export async function clearRateLimit(key: string) {
    await prisma.rateLimit.deleteMany({ where: { key } });
}

export async function checkLoginRateLimits(email: string, ip: string) {
    return (
        (await checkRateLimit(`login:email:${email.toLowerCase()}`, LIMITS.loginEmail)) ||
        (await checkRateLimit(`login:ip:${ip}`, LIMITS.loginIp))
    );
}

export async function recordFailedLoginAttempt(email: string, ip: string) {
    await Promise.all([
        recordRateLimitAttempt(`login:email:${email.toLowerCase()}`),
        recordRateLimitAttempt(`login:ip:${ip}`)
    ]);
}

export async function clearLoginRateLimit(email: string) {
    await clearRateLimit(`login:email:${email.toLowerCase()}`);
}

export async function checkRegisterRateLimit(ip: string) {
    return checkRateLimit(`register:ip:${ip}`, LIMITS.registerIp);
}

export async function recordRegisterAttempt(ip: string) {
    await recordRateLimitAttempt(`register:ip:${ip}`);
}

export async function checkForgotPasswordRateLimits(email: string, ip: string) {
    return (
        (await checkRateLimit(
            `forgot-password:email:${email.toLowerCase()}`,
            LIMITS.forgotPasswordEmail
        )) ||
        (await checkRateLimit(`forgot-password:ip:${ip}`, LIMITS.forgotPasswordIp))
    );
}

export async function recordForgotPasswordAttempt(email: string, ip: string) {
    await Promise.all([
        recordRateLimitAttempt(`forgot-password:email:${email.toLowerCase()}`),
        recordRateLimitAttempt(`forgot-password:ip:${ip}`)
    ]);
}
