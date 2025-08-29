'use server';

import * as z from 'zod';

import { ActionResult } from '@/types/global';
import {
    ChangeEmailSchema,
    VerifyEmailChangeOTPSchema
} from '@/schemas/security';
import { authCheckServer } from '@/lib/authCheck';
import { calculateCooldownSeconds, getRateLimits } from '@/utils/ratelimit';
import { generateOTP } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { logEmailVerifyRequested } from '@/actions/audit/audit-auth';

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

export const sendEmailChangeOTP = async (
    values: z.infer<typeof ChangeEmailSchema>
): Promise<ActionResult> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            message: 'Not authorised'
        };
    }

    try {
        const validatedFields = ChangeEmailSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                success: false,
                message: 'Invalid fields'
            };
        }

        const { currentEmail, newEmail } = validatedFields.data;

        if (currentEmail === newEmail) {
            return {
                success: false,
                message: 'New email must be different from current email'
            };
        }

        // Find user by current email
        const user = await prisma.user.findUnique({
            where: { email: currentEmail }
        });
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Check if new email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });
        if (existingUser) {
            return {
                success: false,
                message: 'Email address is already in use'
            };
        }

        // Rate limiting
        const rateLimitKey = `email_change:${user.id}`;
        const rateLimit = await getRateLimits(rateLimitKey);

        if (rateLimit && rateLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
            const cooldownTime = calculateCooldownSeconds(rateLimit.resetTime);
            return {
                success: false,
                message: 'Too many attempts. Please try again later.',
                cooldownTime
            };
        }

        // Increment rate limit
        await prisma.rateLimit.upsert({
            where: { key: rateLimitKey },
            update: {
                count: {
                    increment: 1
                }
            },
            create: {
                key: rateLimitKey,
                count: 1,
                resetTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
        });

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY);

        // Clean up old OTP records
        await prisma.emailChangeRecord.deleteMany({
            where: {
                expiresAt: {
                    lte: new Date()
                }
            }
        });
        await prisma.emailChangeRecord.deleteMany({
            where: { userId: user.id }
        });

        // Create new OTP record
        await prisma.emailChangeRecord.create({
            data: {
                userId: user.id,
                email: currentEmail,
                newEmail,
                otp,
                expiresAt
            }
        });

        const emailSent = await sendVerificationEmail({
            email: newEmail,
            otp,
            name: user.name
        });

        if (emailSent.error) {
            return {
                success: false,
                message: 'Failed to send verification email'
            };
        }

        // Audit log
        await logEmailVerifyRequested(user.id, user.email);

        return {
            success: true,
            message: 'Verification code sent successfully! Check your email.',
            data: {
                expiresIn: OTP_EXPIRY / 1000,
                maskedEmail: newEmail // Will be masked in the component
            }
        };
    } catch (error) {
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};

export async function verifyEmailChangeOTP(
    values: z.infer<typeof VerifyEmailChangeOTPSchema>
): Promise<ActionResult> {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            message: 'Not authorised'
        };
    }

    try {
        const validatedFields = VerifyEmailChangeOTPSchema.safeParse(values);

        if (!validatedFields.success) {
            return {
                success: false,
                message: 'Invalid fields'
            };
        }

        const { currentEmail, newEmail, otp } = validatedFields.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: currentEmail }
        });
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Find valid OTP record
        const emailChangeRecord = await prisma.emailChangeRecord.findFirst({
            where: {
                userId: user.id,
                newEmail,
                expiresAt: {
                    gt: new Date()
                },
                attempts: {
                    lt: 3
                }
            }
        });

        if (!emailChangeRecord) {
            return {
                success: false,
                message: 'Invalid or expired verification code'
            };
        }

        // Verify OTP
        if (emailChangeRecord.otp !== otp) {
            // Increment attempts
            await prisma.emailChangeRecord.update({
                where: { id: emailChangeRecord.id },
                data: {
                    attempts: {
                        increment: 1
                    }
                }
            });

            const remainingAttempts = 3 - (emailChangeRecord.attempts + 1);

            // Audit log for failed attempt

            if (remainingAttempts <= 0) {
                await prisma.emailChangeRecord.deleteMany({
                    where: { userId: user.id }
                });
                return {
                    success: false,
                    message:
                        'Too many failed attempts. Please request a new code.'
                };
            }

            return {
                success: false,
                message: `Invalid code. ${remainingAttempts} attempts remaining.`
            };
        }

        // Check if new email is still available
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });
        if (existingUser && existingUser.id !== user.id) {
            return {
                success: false,
                message: 'Email address is no longer available'
            };
        }

        // Update user email
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail }
        });

        if (!updatedUser) {
            return {
                success: false,
                message: 'Failed to update email'
            };
        }

        // Clean up OTP record
        await prisma.emailChangeRecord.deleteMany({
            where: { userId: user.id }
        });

        // Audit log for successful change

        return {
            success: true,
            message: 'Email address updated successfully!',
            data: {
                newEmail
            }
        };
    } catch (error) {
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}
