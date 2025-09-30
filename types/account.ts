import { Country, Region } from '@/generated/prisma';

import { SessionType } from '@/types/session';

export interface LocationProps {
    regionProp?: Region;
    countryProp?: Country;
    countries: Country[];
    regions: Region[];
    initialValueProp: boolean;
    userSession: SessionType | null;
}

export interface LocationData {
    countries: Country[] | null;
    defaultCountry: Country;
    regions: Region[] | null;
    country: Country | null;
    region: Region | null;
    initialValueProp: boolean;
}
