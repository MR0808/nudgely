import { CompanySize, Country, Industry, Region } from '@/generated/prisma';

import { SessionType } from '@/types/session';

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
