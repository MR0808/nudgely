'use server';

import * as z from 'zod';
import { APIError } from 'better-auth/api';
import GithubSlugger from 'github-slugger';

import { CompanyUserRegisterSchema, RegisterSchema } from '@/schemas/register';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
    logUserRegistered,
    logEmailVerifyRequested
} from '@/actions/audit/audit-auth';
import { generateOTP } from '@/lib/otp';
import { sendVerificationEmail } from '@/lib/mail';
import { EmailCheckResult } from '@/types/register';
import { logCompanyCreated } from '@/actions/audit/audit-company';

let cachedDomains: string[] | null = null;
let lastFetched: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const slugger = new GithubSlugger();

export const registerInitial = async (
    values: z.infer<typeof RegisterSchema>
) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const { name, lastName, email, password, companyName } =
        validatedFields.data;

    try {
        const isEmailDisposable = await checkEmail(email);

        if (isEmailDisposable.error) {
            return {
                error: `Email is invalid - ${isEmailDisposable.error}`
            };
        } else {
            if (isEmailDisposable.isDisposable) {
                return {
                    error: `Email is invalid`
                };
            }
        }

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

        let slug = slugger.slug(values.companyName);
        let slugExists = true;

        while (slugExists) {
            const checkSlug = await prisma.company.findUnique({
                where: { slug }
            });
            if (!checkSlug) {
                slugExists = false;
                break;
            } else {
                slug = slugger.slug(values.companyName);
            }
        }

        const plan = await prisma.plan.findUnique({ where: { slug: 'free' } });

        if (!plan)
            return {
                error: `Plan is invalid`
            };

        const company = await prisma.company.create({
            data: {
                slug,
                name: values.companyName,
                creatorId: data.user.id,
                planId: plan.id
            }
        });

        await logCompanyCreated(data.user.id, {
            companyId: company.id,
            companyName: company.name
        });

        await prisma.companyMember.create({
            data: {
                companyId: company.id,
                userId: data.user.id,
                role: 'COMPANY_ADMIN'
            }
        });

        await prisma.verification.create({
            data: {
                identifier: `email-otp:${data.user.id}`,
                value: otp,
                expiresAt
            }
        });

        const emailSent = await sendVerificationEmail({ email, otp, name });

        if (emailSent.error) {
            return {
                error: 'Failed to send verification email'
            };
        }

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

export const checkEmail = async (email: string): Promise<EmailCheckResult> => {
    try {
        // Validate email format
        if (!email || !email.includes('@')) {
            return { isDisposable: false, error: 'Invalid email format' };
        }

        // Extract domain from email
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) {
            return { isDisposable: false, error: 'Invalid email domain' };
        }

        // Check cache
        const now = Date.now();
        if (
            !cachedDomains ||
            !lastFetched ||
            now - lastFetched > CACHE_DURATION
        ) {
            const response = await fetch(
                'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf',
                { cache: 'force-cache' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch disposable email domains');
            }

            const text = await response.text();
            cachedDomains = text
                .split('\n')
                .map((line) => line.trim().toLowerCase())
                .filter((line) => line && !line.startsWith('#'));
            lastFetched = now;
        }

        // Check if the email's domain is in the disposable list
        const isDisposable = cachedDomains.includes(domain);

        return { isDisposable, error: null };
    } catch (error) {
        console.error('Error checking email:', error);
        return { isDisposable: false, error: 'Server error occurred' };
    }
};

export const companyUserRegisterInitial = async (
    values: z.infer<typeof CompanyUserRegisterSchema>,
    companyId: string,
    inviteId: string
) => {
    const validatedFields = CompanyUserRegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const { name, lastName, email, password } = validatedFields.data;

    try {
        const isEmailDisposable = await checkEmail(email);

        if (isEmailDisposable.error) {
            return {
                error: `Email is invalid - ${isEmailDisposable.error}`
            };
        } else {
            if (isEmailDisposable.isDisposable) {
                return {
                    error: `Email is invalid`
                };
            }
        }

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

        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return { error: 'Company not found' };
        }

        await prisma.companyMember.create({
            data: {
                companyId: company.id,
                userId: data.user.id,
                role: 'COMPANY_ADMIN',
                companyInviteId: inviteId
            }
        });

        const teams = await prisma.team.findMany({ where: { companyId } });

        for (const team of teams) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: data.user.id,
                    role: 'TEAM_ADMIN'
                }
            });
        }

        await prisma.verification.create({
            data: {
                identifier: `email-otp:${data.user.id}`,
                value: otp,
                expiresAt
            }
        });

        const emailSent = await sendVerificationEmail({ email, otp, name });

        if (emailSent.error) {
            return {
                error: 'Failed to send verification email'
            };
        }

        await prisma.companyInvite.update({
            where: { id: inviteId },
            data: {
                status: 'ACCEPTED'
            }
        });

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
