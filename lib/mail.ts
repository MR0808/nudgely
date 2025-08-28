'use server';

import { Resend } from 'resend';

import { EmailOTPEmailTemplate } from '@/emails/email-otp';
import WelcomeEmailTemplate from '@/emails/welcome-email';

const resend = new Resend(process.env.RESEND_API_KEY);

const from = `${process.env.NEXT_PUBLIC_APP_NAME as string} <${process.env.NEXT_PUBLIC_APP_EMAIL as string}>`;

export const sendVerificationEmail = async ({
    email,
    otp,
    name
}: {
    email: string;
    otp: string;
    name: string;
}) => {
    await resend.emails.send({
        from,
        to: email,
        subject: 'Nudgely - Confirm your email',
        react: EmailOTPEmailTemplate({ name, otp })
    });
};

export const sendWelcomeEmail = async ({
    email,
    name
}: {
    email: string;
    name: string;
}) => {
    await resend.emails.send({
        from,
        to: email,
        subject: `🎉 Welcome to Nudgely, ${name}!`,
        react: WelcomeEmailTemplate({ name })
    });
};

export const sendEmailVerificationOtpEmail = async ({
    email,
    otp
}: {
    email: string;
    otp: string;
}) => {
    const sent = await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: `Buxmate - Email Verification - ${otp}`,
        html: `<p>Your email verification code is ${otp}.</p>`
    });

    return sent;
};

export const sendResetEmail = async ({
    email,
    link,
    name
}: {
    email: string;
    link: string;
    name: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Buxmate - Reset password',
        html: `<p>Click <a href="${link}">here</a> to reset password.</p>`
    });
};

export const sendPasswordResetNotificationEmail = async ({
    email
}: {
    email: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Buxmate - Your password has been reset',
        html: `<p>Your password has been reset</p>`
    });
};
