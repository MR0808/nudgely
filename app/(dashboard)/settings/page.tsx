import type { Metadata } from 'next';

import SettingsMain from '@/components/settings/SettingsMain';
import { Separator } from '@/components/ui/separator';
import {
    getAllCountries,
    getCountryByName,
    getRegionsByCountry,
    getRegionById,
    getCountryById
} from '@/lib/location';
import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';

export function generateMetadata(): Metadata {
    const title = 'Settings';
    const description =
        'Edit your personal details, as well as your security settings and other preferences.';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/settings`,
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

const SettingsPage = async () => {
    const userSession = await authCheck('/settings');
    const { user } = userSession;

    const countries = await getAllCountries();
    const defaultCountry = await getCountryByName('Australia');
    if (!defaultCountry) return null;
    const initialValueProp = user?.countryId ? true : false;
    const regions = user?.countryId
        ? await getRegionsByCountry(user.countryId)
        : await getRegionsByCountry(defaultCountry.id);
    const country = user?.countryId
        ? await getCountryById(user.countryId)
        : await getCountryById(defaultCountry.id);
    const region = user?.countryId
        ? await getRegionById(user.regionId || '')
        : await getRegionById(defaultCountry.id);

    const location = {
        countries,
        defaultCountry,
        regions,
        country,
        region,
        initialValueProp
    };
    return (
        <div className="px-4 py-6 flex grow flex-col overflow-hidden mx-auto w-3/4 ">
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-4 lg:my-6" />
            <SettingsMain userSession={userSession} location={location} />
        </div>
    );
};
export default SettingsPage;
