'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async ({
    email,
    link
}: {
    email: string;
    link: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Buxmate - Confirm your email',
        html: `<p>Click <a href="${link}">here</a> to confirm email.</p>`
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
