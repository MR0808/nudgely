// /lib/companyContext.ts

'use server';

import { authCheckServer } from '@/lib/authCheck';
import { CompanyRole } from '@/generated/prisma';

export type CompanyContext = {
    user: any;
    company: any;
    userCompany: any;
    isAdmin: boolean;
};

export async function getCompanyContext(): Promise<CompanyContext | null> {
    const session = await authCheckServer();
    if (!session) return null;

    const { user, company, userCompany } = session;

    return {
        user,
        company,
        userCompany,
        isAdmin: userCompany?.role === CompanyRole.COMPANY_ADMIN
    };
}
