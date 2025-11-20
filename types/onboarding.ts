import { getCompany } from '@/actions/company';
import { CompanySize, Country, Industry, Region } from '@/generated/prisma';

import { SessionType } from '@/types/session';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type CompanyDataData = NonNullable<
    CompanyData extends { data: infer T } ? T : never
>;

export type Company = NonNullable<
    CompanyDataData extends { company: infer T } ? T : never
>;

export type Image = NonNullable<
    CompanyDataData extends { image: infer T } ? T : never
>;

export interface CompanyOnboardingWizardProps {
    countryProp?: Country;
    countries: Country[];
    regions: Region[];
    companySizes: CompanySize[];
    industries: Industry[];
    userSession: SessionType | null;
    company: Company;
    image: Image | null;
}

export interface BasicInfoStepProps {
    image: Image | null;
}

export interface LocationProps {
    countries: Country[];
    regions: Region[];
}
