import { CompanySize, Country, Industry, Region } from '@/generated/prisma';

import { auth } from '@/lib/auth';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface CompanyOnboardingWizardProps {
    countryProp?: Country;
    countries: Country[];
    regions: Region[];
    companySizes: CompanySize[];
    industries: Industry[];
    userSession: SessionType | null;
}

export interface LocationProps {
    countries: Country[];
    regions: Region[];
}
