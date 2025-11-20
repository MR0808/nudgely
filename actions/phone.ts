'use server';

import * as z from 'zod';
import {
    ChangePhoneSchema,
    VerifyPhoneChangeOTPSchema
} from '@/schemas/security';

import { ActionResult } from '@/types/global';
import { authCheckServer } from '@/lib/authCheck';
import { prisma } from '@/lib/prisma';

import { calculateCooldownSeconds, getRateLimits } from '@/utils/ratelimit';
import { generateOTP } from '@/lib/otp';
import { SMSMessage } from '@/types/smsglobal';
// import { sendSingleSMSAction } from '@/actions/smsglobal';

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * Fully typed helper to resolve the target user for phone change
 */
const resolveTargetUser = async (
    currentPhoneNumber: string | null,
    sessionUserId: string
) => {
    if (currentPhoneNumber) {
        const user = await prisma.user.findUnique({
            where: { phoneNumber: currentPhoneNumber }
        });
        return user;
    }

    // Fallback: use session user
    const user = await prisma.user.findUnique({
        where: { id: sessionUserId }
    });
    return user;
};

//
// ---------------------------------------------------------
// SEND PHONE CHANGE OTP
// ---------------------------------------------------------
//
export const sendPhoneChangeOTP = async (
    values: z.infer<typeof ChangePhoneSchema>
): Promise<ActionResult> => {
    const userSession = await authCheckServer();
    if (!userSession) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        const parsed = ChangePhoneSchema.safeParse(values);
        if (!parsed.success) {
            return { success: false, message: 'Invalid fields' };
        }

        const { currentPhoneNumber, newPhoneNumber } = parsed.data;

        if (currentPhoneNumber === newPhoneNumber) {
            return {
                success: false,
                message:
                    'New phone number must be different from current number'
            };
        }

        // Resolve the correct user
        const user = await resolveTargetUser(
            currentPhoneNumber ?? null,
            userSession.user.id
        );

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Check if new phone number is already used
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: newPhoneNumber }
        });

        if (existingUser) {
            return {
                success: false,
                message: 'Phone number is already in use'
            };
        }

        // -----------------------------------
        // RATE LIMITING
        // -----------------------------------
        const rateLimitKey = `phone_change:${user.id}`;
        const rateLimit = await getRateLimits(rateLimitKey);

        if (rateLimit && rateLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
            const cooldownTime = calculateCooldownSeconds(rateLimit.resetTime);
            return {
                success: false,
                message: 'Too many attempts. Please try again later.',
                cooldownTime
            };
        }

        // increment rate limit
        await prisma.rateLimit.upsert({
            where: { key: rateLimitKey },
            update: { count: { increment: 1 } },
            create: {
                key: rateLimitKey,
                count: 1,
                resetTime: new Date(Date.now() + 15 * 60 * 1000)
            }
        });

        // -----------------------------------
        // OTP CREATION
        // -----------------------------------
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY);

        // cleanup expired & existing OTPs
        await prisma.phoneChangeRecord.deleteMany({
            where: {
                OR: [{ expiresAt: { lte: new Date() } }, { userId: user.id }]
            }
        });

        // create new record
        await prisma.phoneChangeRecord.create({
            data: {
                userId: user.id,
                phoneNumber: currentPhoneNumber ?? 'New number',
                newPhoneNumber,
                otp,
                expiresAt
            }
        });

        // -----------------------------------
        // SEND SMS
        // -----------------------------------
        const sms: SMSMessage = {
            destination: newPhoneNumber,
            message: `Your Nudgely verification code is: ${otp}. This code expires in 10 minutes.`
        };

        console.log('SMS to send:', sms);

        // const response = await sendSingleSMSAction(sms);
        // if (!response.messages) {
        //     return {
        //         success: false,
        //         message: 'Failed to send verification message'
        //     };
        // }

        return {
            success: true,
            message: 'Verification code sent successfully!',
            data: { expiresIn: OTP_EXPIRY / 1000 }
        };
    } catch (error) {
        console.error('Error sending phone OTP:', error);
        return {
            success: false,
            message: 'An error occurred while sending verification code'
        };
    }
};

//
// ---------------------------------------------------------
// VERIFY PHONE CHANGE OTP
// ---------------------------------------------------------
//
export const verifyPhoneChangeOTP = async (
    values: z.infer<typeof VerifyPhoneChangeOTPSchema>
): Promise<ActionResult> => {
    const userSession = await authCheckServer();
    if (!userSession) {
        return { success: false, message: 'Not authorised' };
    }

    try {
        const parsed = VerifyPhoneChangeOTPSchema.safeParse(values);
        if (!parsed.success) {
            return { success: false, message: 'Invalid fields' };
        }

        const { currentPhoneNumber, newPhoneNumber, otp } = parsed.data;

        // Resolve correct user
        const user = await resolveTargetUser(
            currentPhoneNumber ?? null,
            userSession.user.id
        );
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // -----------------------------------
        // GET OTP RECORD
        // -----------------------------------
        const record = await prisma.phoneChangeRecord.findFirst({
            where: {
                userId: user.id,
                newPhoneNumber,
                expiresAt: { gt: new Date() },
                attempts: { lt: 3 }
            }
        });

        if (!record) {
            return {
                success: false,
                message: 'Invalid or expired verification code'
            };
        }

        // -----------------------------------
        // WRONG OTP
        // -----------------------------------
        if (record.otp !== otp) {
            await prisma.phoneChangeRecord.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } }
            });

            const remaining = 3 - (record.attempts + 1);
            if (remaining <= 0) {
                await prisma.phoneChangeRecord.deleteMany({
                    where: { userId: user.id }
                });
                return {
                    success: false,
                    message: 'Too many failed attempts. Request a new code.'
                };
            }

            return {
                success: false,
                message: `Invalid code. ${remaining} attempts remaining.`
            };
        }

        // -----------------------------------
        // ENSURE NEW NUMBER IS STILL FREE
        // -----------------------------------
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: newPhoneNumber }
        });

        if (existingUser && existingUser.id !== user.id) {
            return {
                success: false,
                message: 'Phone number is no longer available'
            };
        }

        // -----------------------------------
        // UPDATE PHONE NUMBER
        // -----------------------------------
        await prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber: newPhoneNumber }
        });

        // cleanup OTP
        await prisma.phoneChangeRecord.deleteMany({
            where: { userId: user.id }
        });

        return {
            success: true,
            message: 'Phone number updated successfully!',
            data: { newPhoneNumber }
        };
    } catch (error) {
        console.error('Verify Phone OTP Error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
};
