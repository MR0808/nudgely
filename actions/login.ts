'use server';

import * as z from 'zod';
import { auth, ErrorCode } from '@/lib/auth';
import { headers } from 'next/headers';
import { APIError } from 'better-auth/api';
import { redirect } from 'next/navigation';

import { LoginSchema } from '@/schemas/auth';
import { logUserLogin } from '@/actions/audit/audit-auth';
import { prisma } from '@/lib/prisma';

export const login = async (values: z.infer<typeof LoginSchema>) => {
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
    } catch (err: any) {
        if (err instanceof APIError) {
            const errCode = err.body ? (err.body.code as ErrorCode) : 'UNKNOWN';

            switch (errCode) {
                case 'EMAIL_NOT_VERIFIED':
                    redirect('/auth/verify-email');
                default:
                    return { error: err.message };
            }
        }
        return { error: 'Internal Server Error' };
    }
};

export const getUserIdfromToken = async (token: string) => {
    try {
        const data = await prisma.verification.findFirst({
            where: { identifier: `reset-password:${token}` }
        });

        if (!data) {
            return { data: null, error: true };
        }

        return { data: data.value, error: false };
    } catch (error) {
        return { data: null, error: true };
    }
};
