'use server';

import * as z from 'zod';
import { auth } from '@/lib/auth';
import { APIError } from 'better-auth/api';
import { InvitationStatus } from '@/generated/prisma';

import { RegisterSchema } from '@/schemas/register';
import { prisma } from '@/lib/prisma';
import {
    logUserRegistered,
    logEmailVerifyRequested
} from '@/actions/audit/audit-auth';
import { generateOTP, sendEmailOTP } from '@/lib/otp';

export const registerInitial = async (
    values: z.infer<typeof RegisterSchema>
) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const { name, lastName, email, password } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: 'An account with this email already exists.' };
        }

        const data = await auth.api.signUpEmail({
            body: {
                name,
                lastName,
                email,
                password,
                role: 'USER'
            }
        });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.verification.create({
            data: {
                identifier: `email-otp:${data.user.id}`,
                value: otp,
                expiresAt
            }
        });

        await sendEmailOTP(email, otp, name);

        await logUserRegistered(data.user.id, {
            registrationMethod: 'email',
            emailVerified: false
        });

        await logEmailVerifyRequested(data.user.id, data.user.email);

        return { userId: data.user.id, error: null };
    } catch (err) {
        if (err instanceof APIError) {
            return { error: err.message };
        }

        return { error: 'Internal Server Error' };
    }
};
