import SettingsContent from '@/components/settings/SettingsContent';
import { SettingsProps } from '@/types/settings';
import NameForm from '@/components/settings/account/NameForm';
import LocationForm from '@/components/settings/account/LocationForm';
import TimezoneForm from '@/components/settings/account/TimezoneForm';
import LocaleForm from '@/components/settings/account/LocaleForm';

const AccountMain = ({ userSession, location }: SettingsProps) => {
    return (
        <SettingsContent
            title="Account"
            desc="Update your account settings. Set your preferred language and
          timezone."
        >
            <>
                <NameForm userSession={userSession} />
                <LocationForm
                    countryProp={location.country || location.defaultCountry!}
                    regionProp={location.region || undefined}
                    countries={location.countries!}
                    regions={location.regions!}
                    initialValueProp={location.initialValueProp}
                    userSession={userSession}
                />
                <TimezoneForm userSession={userSession} />
                <LocaleForm userSession={userSession} />
            </>
        </SettingsContent>
    );
};

export default AccountMain;
