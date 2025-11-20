'use server';

import * as z from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { APIError } from 'better-auth/api';

import { auth, ErrorCode } from '@/lib/auth';
import { LoginSchema } from '@/schemas/auth';
import { logUserLogin } from '@/actions/audit/audit-auth';
import { prisma } from '@/lib/prisma';

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

type LoginResult = {
    error: string | null;
    emailVerified?: Date | string | boolean | null;
};

type TokenLookupResult = {
    data: string | null;
    error: boolean;
};

/* ------------------------------------------------------------------
 * Login
 * ------------------------------------------------------------------ */

export const login = async (
    values: z.infer<typeof LoginSchema>
): Promise<LoginResult> => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const { email, password, rememberMe } = validatedFields.data;

    try {
        const data = await auth.api.signInEmail({
            headers: await headers(),
            body: {
                email,
                password,
                rememberMe
            }
        });

        await logUserLogin(data.user.id, {
            loginMethod: 'email',
            rememberMe
        });

        return {
            error: null,
            emailVerified: data.user.emailVerified
        };
    } catch (err: unknown) {
        if (err instanceof APIError) {
            const body = err.body as { code?: ErrorCode } | undefined;
            const errCode: ErrorCode | 'UNKNOWN' = body?.code ?? 'UNKNOWN';

            switch (errCode) {
                case 'EMAIL_NOT_VERIFIED':
                    redirect('/auth/verify-email');
                default:
                    return { error: err.message };
            }
        }

        console.error('[login] Unexpected error:', err);
        return { error: 'Internal Server Error' };
    }
};

/* ------------------------------------------------------------------
 * Get user id from reset-password token
 * ------------------------------------------------------------------ */

export const getUserIdfromToken = async (
    token: string
): Promise<TokenLookupResult> => {
    try {
        const record = await prisma.verification.findFirst({
            where: { identifier: `reset-password:${token}` },
            select: { value: true }
        });

        if (!record) {
            return { data: null, error: true };
        }

        return { data: record.value, error: false };
    } catch (error) {
        console.error('[getUserIdfromToken] Error:', error);
        return { data: null, error: true };
    }
};
