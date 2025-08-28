'use server';

import { prisma } from '@/lib/prisma';
import { generateOTP, sendEmailOTP } from '@/lib/otp';
import { logEmailVerified } from '@/actions/audit/audit-auth';

export const verifyEmailOTP = async (userId: string, otp: string) => {
    try {
        // Find the OTP verification record
        const verification = await prisma.verification.findFirst({
            where: {
                identifier: `email-otp:${userId}`,
                value: otp,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!verification) {
            return { error: 'Invalid or expired verification code.' };
        }

        // Update user as email verified
        const user = await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true }
        });

        // Clean up the verification record
        await prisma.verification.delete({
            where: { id: verification.id }
        });

        await logEmailVerified(userId, user.email);

        return { success: true };
    } catch (error) {
        console.error('Email verification error:', error);
        return { error: 'Failed to verify email. Please try again.' };
    }
};

export const resendEmailOTP = async (userId: string) => {
    try {
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { error: 'User not found.' };
        }

        // Delete any existing OTP
        await prisma.verification.deleteMany({
            where: {
                identifier: `email-otp:${userId}`
            }
        });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store new OTP
        await prisma.verification.create({
            data: {
                identifier: `email-otp:${userId}`,
                value: otp,
                expiresAt
            }
        });

        // Send new OTP email
        await sendEmailOTP(user.email, otp, user.name);

        return { success: true };
    } catch (error) {
        console.error('Resend email OTP error:', error);
        return {
            error: 'Failed to resend verification code. Please try again.'
        };
    }
};
