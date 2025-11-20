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

/* ------------------------------------------------------------------
 * Send OTP for email change
 * ------------------------------------------------------------------ */

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

    const { user } = userSession;

    try {
        const validated = ChangeEmailSchema.safeParse(values);

        if (!validated.success) {
            return {
                success: false,
                message: 'Invalid fields'
            };
        }

        const { currentEmail, newEmail } = validated.data;

        // Extra safety: ensure the current email matches the logged-in user
        if (currentEmail !== user.email) {
            return {
                success: false,
                message: 'Current email does not match your account'
            };
        }

        if (currentEmail === newEmail) {
            return {
                success: false,
                message: 'New email must be different from current email'
            };
        }

        // Check if new email is already taken
        const [existingUser, rateLimit] = await Promise.all([
            prisma.user.findUnique({
                where: { email: newEmail },
                select: { id: true }
            }),
            getRateLimits(`email_change:${user.id}`)
        ]);

        if (existingUser) {
            return {
                success: false,
                message: 'Email address is already in use'
            };
        }

        // Rate limiting
        if (rateLimit && rateLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
            const cooldownTime = calculateCooldownSeconds(rateLimit.resetTime);
            return {
                success: false,
                message: 'Too many attempts. Please try again later.',
                cooldownTime
            };
        }

        // Increment / create rate limit record
        const rateLimitKey = `email_change:${user.id}`;
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

        // Clean up old / stale records for this user
        await prisma.emailChangeRecord.deleteMany({
            where: {
                OR: [
                    { userId: user.id },
                    {
                        expiresAt: {
                            lte: new Date()
                        }
                    }
                ]
            }
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
                // You can visually mask this in the UI; here we just return it
                maskedEmail: newEmail
            }
        };
    } catch (error) {
        console.error('[sendEmailChangeOTP] Error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};

/* ------------------------------------------------------------------
 * Verify OTP and complete email change
 * ------------------------------------------------------------------ */

export const verifyEmailChangeOTP = async (
    values: z.infer<typeof VerifyEmailChangeOTPSchema>
): Promise<ActionResult> => {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            success: false,
            message: 'Not authorised'
        };
    }

    const { user } = userSession;

    try {
        const validated = VerifyEmailChangeOTPSchema.safeParse(values);

        if (!validated.success) {
            return {
                success: false,
                message: 'Invalid fields'
            };
        }

        const { currentEmail, newEmail, otp } = validated.data;

        // Double-check the current email matches the logged in user
        if (currentEmail !== user.email) {
            return {
                success: false,
                message: 'Current email does not match your account'
            };
        }

        // Find valid OTP record for this user + new email
        const emailChangeRecord = await prisma.emailChangeRecord.findFirst({
            where: {
                userId: user.id,
                newEmail,
                expiresAt: {
                    gt: new Date()
                },
                attempts: {
                    lt: RATE_LIMIT_MAX_ATTEMPTS
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
            const updatedRecord = await prisma.emailChangeRecord.update({
                where: { id: emailChangeRecord.id },
                data: {
                    attempts: {
                        increment: 1
                    }
                }
            });

            const remainingAttempts =
                RATE_LIMIT_MAX_ATTEMPTS - updatedRecord.attempts;

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

        // Check if new email is still available (race-condition safe)
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail },
            select: { id: true }
        });

        if (existingUser && existingUser.id !== user.id) {
            return {
                success: false,
                message: 'Email address is no longer available'
            };
        }

        // Update user email
        await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail }
        });

        // Clean up OTP records for this user
        await prisma.emailChangeRecord.deleteMany({
            where: { userId: user.id }
        });

        // (Optional) You could add an audit log here:
        // await logEmailChanged(user.id, { oldEmail: currentEmail, newEmail });

        return {
            success: true,
            message: 'Email address updated successfully!',
            data: {
                newEmail
            }
        };
    } catch (error) {
        console.error('[verifyEmailChangeOTP] Error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};
