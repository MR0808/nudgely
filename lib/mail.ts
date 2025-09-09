'use server';

import { Resend } from 'resend';

import EmailOTPEmailTemplate from '@/emails/email-otp';
import WelcomeEmailTemplate from '@/emails/welcome-email';
import ResetPasswordEmailTemplate from '@/emails/reset-password';
import PasswordResetConfirmationEmailTemplate from '@/emails/password-reset-confirmation';
import CompanyAddedAdminEmailTemplate from '@/emails/company-added-admin';
import CompanyInviteAdminEmailTemplate from '@/emails/company-invite-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromPerson = `${process.env.NEXT_PUBLIC_APP_NAME as string} <${process.env.NEXT_PUBLIC_APP_EMAIL as string}>`;
const fromNudgely = `Nudgely Support <${process.env.NEXT_PUBLIC_APP_EMAIL_SUPPORT as string}>`;

export const sendVerificationEmail = async ({
    email,
    otp,
    name
}: {
    email: string;
    otp: string;
    name: string;
}) => {
    const sent = await resend.emails.send({
        from: fromNudgely,
        to: email,
        subject: 'Nudgely - Confirm your email',
        react: EmailOTPEmailTemplate({ name, otp })
    });

    return sent;
};

export const sendWelcomeEmail = async ({
    email,
    name
}: {
    email: string;
    name: string;
}) => {
    await resend.emails.send({
        from: fromPerson,
        to: email,
        subject: `🎉 Welcome to Nudgely, ${name}!`,
        react: WelcomeEmailTemplate({ name })
    });
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
        from: fromNudgely,
        to: email,
        subject: 'Nudgely - Reset password',
        react: ResetPasswordEmailTemplate({ name, link })
    });
};

export const sendPasswordResetNotificationEmail = async ({
    email,
    name
}: {
    email: string;
    name: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your password has been reset',
        react: PasswordResetConfirmationEmailTemplate({ name })
    });
};

export const sendCompanyAddedAdminEmail = async ({
    email,
    name,
    companyName
}: {
    email: string;
    name: string;
    companyName: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your are now an admin',
        react: CompanyAddedAdminEmailTemplate({ name, companyName })
    });
};

export const sendCompanyInviteAdminEmail = async ({
    email,
    link,
    companyName,
    name
}: {
    email: string;
    link: string;
    companyName: string;
    name: string;
}) => {
    await resend.emails.send({
        from: fromNudgely,
        to: email,
        subject: 'Nudgely - Invite to be an admin',
        react: CompanyInviteAdminEmailTemplate({ link, companyName, name })
    });
};
