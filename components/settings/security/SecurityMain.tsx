import SettingsContent from '@/components/settings/SettingsContent';
import { SettingsProps } from '@/types/settings';
import EmailForm from '@/components/settings/security/EmailForm';
import PasswordForm from '@/components/settings/security/PasswordForm';
import PhoneNumberForm from '@/components/settings/security/PhoneForm';

const SecurityMain = ({ userSession, location }: SettingsProps) => {
    if (!userSession) return null;
    return (
        <SettingsContent
            title="Security"
            desc="Set up your security for you account including changing your password and email, as well as setup 2FA and a phone number."
        >
            <>
                <EmailForm userSession={userSession} />
                <PasswordForm userSession={userSession} />
                <PhoneNumberForm
                    userSession={userSession}
                    defaultCountry={location.defaultCountry}
                />
            </>
        </SettingsContent>
    );
};
export default SecurityMain;
