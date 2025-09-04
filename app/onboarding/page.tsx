import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import siteMetadata from '@/utils/siteMetaData';
import { authCheckOnboarding } from '@/lib/authCheck';
import CompanyOnboardingWizard from '@/components/onboarding/CompanyOnboardingWizard';
import {
    getAllCountries,
    getCountryByName,
    getRegionsByCountry,
    getCountryById
} from '@/lib/location';

export async function generateMetadata(): Promise<Metadata> {
    const title = 'Onboarding';
    const description = 'Set up your company';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/company`,
            siteName: siteMetadata.title,
            locale: 'en_AU',
            type: 'article',
            publishedTime: '2024-08-15 13:00:00',
            modifiedTime: '2024-08-15 13:00:00',
            images,
            authors: [siteMetadata.author]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images
        }
    };
}

const OnboardingPage = async () => {
    const userSession = await authCheckOnboarding();
    const countries = await getAllCountries();
    const defaultCountry = await getCountryByName('Australia');
    if (!defaultCountry) return redirect('/');
    const regions = await getRegionsByCountry(defaultCountry.id);
    const country = await getCountryById(defaultCountry.id);

    return (
        <div className="min-h-screen bg-background pt-10">
            <CompanyOnboardingWizard
                countryProp={country || defaultCountry!}
                countries={countries!}
                regions={regions!}
                userSession={userSession}
            />
        </div>
    );
};
export default OnboardingPage;
