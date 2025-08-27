import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { UserRole, Gender } from '@/generated/prisma';
import { admin, customSession, openAPI } from 'better-auth/plugins';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/argon2';
import { sendVerificationEmail, sendResetEmail } from '@/lib/mail';
import { ac, roles } from '@/lib/permissions';
import { logPasswordResetRequested } from '@/actions/audit/audit-auth';

const options = {
    database: prismaAdapter(prisma, {
        provider: 'postgresql' // or "mysql", "postgresql", ...etc
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
        }
    },
    emailAndPassword: {
        enabled: true,
        password: {
            hash: hashPassword,
            verify: verifyPassword
        },
        autoSignIn: false,
        requireEmailVerification: false,
        sendResetPassword: async ({ user, url }) => {
            await sendResetEmail({
                email: user.email,
                link: url,
                name: user.name
            });
        }
    },
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            // const newSession = ctx.context.newSession;
            if (ctx.path === '/forget-password') {
                await logPasswordResetRequested(ctx.body.email);
            }
        })
    },
    advanced: {
        database: {
            generateId: false
        }
    },
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async (
                { user, newEmail, url, token },
                request
            ) => {
                await sendVerificationEmail({ email: newEmail, link: url });
            }
        },
        additionalFields: {
            lastName: {
                type: 'string',
                required: true
            },
            role: {
                type: ['USER', 'ADMIN'] as Array<UserRole>
            },
            gender: {
                type: ['MALE', 'FEMALE', 'OTHER', 'NOTSAY'] as Array<Gender>,
                required: false
            },
            dateOfBirth: {
                type: 'date',
                required: false
            },
            countryId: {
                type: 'string',
                required: false
            },
            stateId: {
                type: 'string',
                required: false
            },
            phoneNumber: {
                type: 'string',
                required: false
            },
            phoneVerified: {
                type: 'boolean',
                required: false
            },
            emailVerified: {
                type: 'boolean',
                required: false
            }
        }
    },
    session: {
        expiresIn: 30 * 24 * 60 * 60,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    account: {
        accountLinking: {
            enabled: false
        }
    },
    plugins: [
        nextCookies(),
        admin({
            defaultRole: UserRole.USER,
            adminRoles: [UserRole.ADMIN],
            ac,
            roles
        })
    ]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
    ...options,
    plugins: [
        ...(options.plugins ?? []),
        customSession(async ({ user, session }) => {
            const accounts = await prisma.account.findMany({
                where: { id: user.id }
            });
            return {
                session,
                user: {
                    ...user
                },
                accounts
            };
        }, options),
        openAPI()
    ]
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | 'UNKNOWN';
