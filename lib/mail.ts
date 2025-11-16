'use server';

import { Resend } from 'resend';
import { render } from '@react-email/components';

import EmailOTPEmailTemplate from '@/emails/email-otp';
import WelcomeEmailTemplate from '@/emails/welcome-email';
import ResetPasswordEmailTemplate from '@/emails/reset-password';
import PasswordResetConfirmationEmailTemplate from '@/emails/password-reset-confirmation';
import CompanyAddedAdminEmailTemplate from '@/emails/company-added-admin';
import CompanyInviteAdminEmailTemplate from '@/emails/company-invite-admin';
import TeamAddedEmailTemplate from '@/emails/team-added';
import TeamInviteEmailTemplate from '@/emails/team-invite';
import UpgradeEmailTemplate from '@/emails/upgrade-email';
import DowngradeEmailTemplate from '@/emails/downgrade-email';
import DowngradeWarningEmailTemplate from '@/emails/downgrade-warning';
import CancelSubscriptionEmailTemplate from '@/emails/cancel-subscription';
import NudgeReminderTemplate from '@/emails/nudge-reminder';
import { SendCompletionNotificationProps } from '@/types/complete';
import NudgeCompletionNotificationEmail from '@/emails/nudge-completion-notification';
import DailyNudgeSummaryEmail from '@/emails/daily-nudge-summary';
import { SendDailySummaryEmailOptions } from '@/types/email';

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

export const sendNudgeEmail = async ({
    email,
    name,
    nudgeName,
    nudgeDescription,
    completionUrl,
    scheduleInfo
}: {
    email: string;
    name: string;
    nudgeName: string;
    nudgeDescription?: string | null;
    completionUrl: string;
    scheduleInfo?: string;
}) => {
    const { error } = await resend.emails.send({
        from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
        to: email,
        subject: `Nudgely - Reminder: ${nudgeName}`,
        react: NudgeReminderTemplate({
            name,
            nudgeName,
            nudgeDescription: nudgeDescription || undefined,
            completionUrl,
            scheduleInfo
        })
    });

    if (error) {
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }

    return { success: true, error: null };
};

export const sendCompletionNotificationEmail = async ({
    email,
    name,
    nudgeName,
    nudgeDescription,
    completedBy,
    completedAt,
    comments,
    isCreator
}: SendCompletionNotificationProps) => {
    try {
        const { error } = await resend.emails.send({
            from: process.env.NEXT_PUBLIC_APP_EMAIL as string,
            to: email,
            subject: `✓ Completed: ${nudgeName}`,
            react: NudgeCompletionNotificationEmail({
                name,
                nudgeName,
                nudgeDescription: nudgeDescription || undefined,
                completedBy,
                completedAt,
                comments: comments || undefined,
                isCreator
            })
        });

        if (error) {
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }

        return { success: true, error: null };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export async function sendDailySummaryEmail(
    options: SendDailySummaryEmailOptions
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const {
            adminEmail,
            date,
            totalNudgesSent,
            totalEmailsSent,
            totalEmailsFailed,
            totalCompletions,
            totalActiveNudges,
            totalFinishedNudges,
            teamStats
        } = options;

        // For preview/development without Resend API key
        if (!process.env.RESEND_API_KEY) {
            console.log('[v0] Daily summary email (mock mode):');
            console.log(`  To: ${adminEmail}`);
            console.log(`  Date: ${date}`);
            console.log(`  Nudges sent: ${totalNudgesSent}`);
            console.log(`  Emails sent: ${totalEmailsSent}`);
            console.log(`  Emails failed: ${totalEmailsFailed}`);
            console.log(`  Completions: ${totalCompletions}`);
            console.log(`  Teams: ${teamStats.length}`);

            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { success: true };
        }

        // Render the email template
        const emailHtml = await render(
            DailyNudgeSummaryEmail({
                date,
                totalNudgesSent,
                totalEmailsSent,
                totalEmailsFailed,
                totalCompletions,
                totalActiveNudges,
                totalFinishedNudges,
                teamStats
            })
        );

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: fromNudgely,
            to: adminEmail,
            subject: `Daily Nudge Summary - ${date}`,
            html: emailHtml
        });

        if (error) {
            console.error('[v0] Daily summary email error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }

        console.log(`[v0] Daily summary sent to ${adminEmail}`, data);
        return { success: true };
    } catch (error) {
        console.error('[v0] Daily summary email exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
