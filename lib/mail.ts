'use server';

import { Resend } from 'resend';

import EmailOTPEmailTemplate from '@/emails/email-otp';
import WelcomeEmailTemplate from '@/emails/welcome-email';
import ResetPasswordEmailTemplate from '@/emails/reset-password';
import PasswordResetConfirmationEmailTemplate from '@/emails/password-reset-confirmation';
import CompanyAddedAdminEmailTemplate from '@/emails/company-added-admin';
import CompanyInviteAdminEmailTemplate from '@/emails/company-invite-admin';
import { TeamRole } from '@/generated/prisma';
import TeamAddedEmailTemplate from '@/emails/team-added';
import TeamInviteEmailTemplate from '@/emails/team-invite';
import UpgradeEmailTemplate from '@/emails/upgrade-email';
import DowngradeEmailTemplate from '@/emails/downgrade-email';
import DowngradeWarningEmailTemplate from '@/emails/downgrade-warning';
import CancelSubscriptionEmailTemplate from '@/emails/cancel-subscription';

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
        subject: 'Nudgely - You are now an admin',
        react: CompanyAddedAdminEmailTemplate({ name, companyName })
    });
};

export const sendCompanyInviteAdminEmail = async ({
    email,
    link,
    companyName,
    name,
    expiresAt
}: {
    email: string;
    link: string;
    companyName: string;
    name: string;
    expiresAt: Date;
}) => {
    await resend.emails.send({
        from: fromNudgely,
        to: email,
        subject: 'Nudgely - Invite to be an admin',
        react: CompanyInviteAdminEmailTemplate({
            link,
            companyName,
            name,
            expiresAt
        })
    });
};

export const sendTeamAddedEmail = async ({
    email,
    name,
    companyName,
    teamName,
    role
}: {
    email: string;
    name: string;
    companyName: string;
    teamName: string;
    role: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - You have been added to a team',
        react: TeamAddedEmailTemplate({ name, companyName, teamName, role })
    });
};

export const sendTeamInviteEmail = async ({
    email,
    link,
    companyName,
    name,
    expiresAt,
    role,
    teamName
}: {
    email: string;
    link: string;
    companyName: string;
    name: string;
    expiresAt: Date;
    role: string;
    teamName: string;
}) => {
    await resend.emails.send({
        from: fromNudgely,
        to: email,
        subject: 'Nudgely - Invite to be a part of a team',
        react: TeamInviteEmailTemplate({
            link,
            companyName,
            name,
            expiresAt,
            role,
            teamName
        })
    });
};

export const sendUpgradeEmail = async ({
    email,
    name,
    plan
}: {
    email: string;
    name: string;
    plan: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your plan has been upgraded',
        react: UpgradeEmailTemplate({ name, plan })
    });
};

export const sendDowngradeEmail = async ({
    email,
    name,
    plan
}: {
    email: string;
    name: string;
    plan: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your plan has been downgraded',
        react: DowngradeEmailTemplate({ name, plan })
    });
};

export const sendDowngradeWarningEmail = async ({
    email,
    name,
    plan
}: {
    email: string;
    name: string;
    plan: string;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your plan is about to be downgraded',
        react: DowngradeWarningEmailTemplate({ name, plan })
    });
};

export const sendCancellationEmail = async ({
    email,
    name,
    endDate
}: {
    email: string;
    name: string;
    endDate: Date;
}) => {
    await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: 'Nudgely - Your plan has been cancelled',
        react: CancelSubscriptionEmailTemplate({ name, endDate })
    });
};
