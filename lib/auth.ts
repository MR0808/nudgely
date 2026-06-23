import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { SiteRole, Gender, UserStatus } from '@/generated/prisma/client';
import { admin, customSession, openAPI } from 'better-auth/plugins';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/argon2';
import { sendVerificationEmail, sendResetEmail } from '@/lib/mail';
import { ac, roles } from '@/lib/permissions';
import { logPasswordResetRequested } from '@/actions/audit/audit-auth';
import { isUserAccessBlocked } from '@/lib/user-access';
import {
    checkForgotPasswordRateLimits,
    getClientIpFromHeaders,
    recordForgotPasswordAttempt
} from '@/lib/auth-ratelimit';

const isProduction = process.env.NODE_ENV === 'production';

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

const trustedOrigins = [
  baseURL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BETTER_AUTH_URL,
  ...(isProduction
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000']),
]
  .filter(Boolean)
  .map((origin) => origin!.replace(/\/$/, ''));

const options = {
  baseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),
  // Google OAuth disabled until ban/disabled checks are enforced on social sign-in.
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID as string,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  //   },
  // },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetEmail({
        email: user.email,
        link: url,
        name: user.name,
      });
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email =
          typeof ctx.body?.email === 'string' ? ctx.body.email : undefined;

        if (email) {
          const user = await prisma.user.findUnique({ where: { email } });

          if (user && isUserAccessBlocked(user)) {
            throw new APIError('FORBIDDEN', {
              message: 'This account is not active. Contact support if you need help.'
            });
          }
        }
      }

      if (ctx.path === '/forget-password') {
        const email =
          typeof ctx.body?.email === 'string' ? ctx.body.email : undefined;
        const ip = getClientIpFromHeaders(ctx.headers ?? {});

        if (email) {
          const rateLimitMessage = await checkForgotPasswordRateLimits(
            email,
            ip
          );
          if (rateLimitMessage) {
            throw new APIError('TOO_MANY_REQUESTS', {
              message: rateLimitMessage
            });
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/forget-password') {
        const email =
          typeof ctx.body?.email === 'string' ? ctx.body.email : undefined;
        const ip = getClientIpFromHeaders(ctx.headers ?? {});

        if (email) {
          await recordForgotPasswordAttempt(email, ip);
        }

        await logPasswordResetRequested(ctx.body.email);
      }
    }),
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, token }) => {
        await sendVerificationEmail({
          email: newEmail,
          otp: token,
          name: user.name,
        });
      },
    },
    additionalFields: {
      lastName: {
        type: 'string',
        required: true,
      },
      role: {
        type: ['USER', 'SITE_ADMIN'] as Array<SiteRole>,
        required: false,
      },
      gender: {
        type: ['MALE', 'FEMALE', 'OTHER', 'NOTSAY'] as Array<Gender>,
        required: false,
      },
      dateOfBirth: {
        type: 'date',
        required: false,
      },
      countryId: {
        type: 'string',
        required: false,
      },
      regionId: {
        type: 'string',
        required: false,
      },
      phoneNumber: {
        type: 'string',
        required: false,
      },
      phoneVerified: {
        type: 'boolean',
        required: false,
      },
      emailVerified: {
        type: 'boolean',
        required: false,
      },
      timezone: {
        type: 'string',
        required: false,
      },
      locale: {
        type: 'string',
        required: false,
      },
      jobTitle: {
        type: 'string',
        required: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      status: {
        type: ['ACTIVE', 'DISABLED', 'BANNED'] as Array<UserStatus>,
        required: false,
      },
    },
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60,
    cookieCache: {
      // Short cache so bans/disabled status and company changes take effect quickly.
      enabled: !isProduction,
      maxAge: isProduction ? 0 : 5 * 60,
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  plugins: [
    admin({
      defaultRole: SiteRole.USER,
      adminRoles: [SiteRole.SITE_ADMIN],
      ac,
      roles,
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
      });
      const userCompany = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });
      const company = userCompany
        ? await prisma.company.findUnique({
            where: { id: userCompany.companyId },
            include: {
              plan: { select: { slug: true, level: true } },
            },
          })
        : null;
      return {
        session,
        user,
        accounts,
        company,
        userCompany,
      };
    }, options),
    ...(isProduction ? [] : [openAPI()]),
    nextCookies(),
  ],
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | 'UNKNOWN';
