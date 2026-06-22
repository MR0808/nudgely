// /lib/companyContext.ts

'use server';

import { authCheckServerWithCompany } from '@/lib/authCheck';
import { CompanyRole } from '@/generated/prisma/client';

export type CompanyContext = {
    user: any;
    company: any;
    userCompany: any;
    isAdmin: boolean;
};

export async function getCompanyContext(): Promise<CompanyContext | null> {
    const session = await authCheckServerWithCompany();
    if (!session) return null;

    const { user, company, userCompany } = session;

    return {
        user,
        company,
        userCompany,
        isAdmin: userCompany?.role === CompanyRole.COMPANY_ADMIN
    };
}

