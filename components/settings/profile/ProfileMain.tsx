import SettingsContent from '@/components/settings/SettingsContent';
import { SettingsProps } from '@/types/settings';
import ProfilePictureForm from '@/components/settings/profile/ProfilePictureForm';
import JobTitleForm from '@/components/settings/profile/JobTitleForm';
import BioForm from '@/components/settings/profile/BioForm';
import DateOfBirthForm from '@/components/settings/profile/DateOfBirthForm';
import GenderForm from '@/components/settings/profile/GenderForm';

const ProfileMain = ({ userSession, location }: SettingsProps) => {
    if (!userSession) return null;
    const user = userSession.user;

    const hasGoogleAccount = userSession.accounts.some(
        (account) => account.providerId === 'google'
    );

    return (
        <SettingsContent
            title="Profile"
            desc="Set up your profile for others to see you on here. We don't ever share your personal details."
        >
            <>
                <ProfilePictureForm userSession={userSession} />
                <JobTitleForm userSession={userSession} />
                <BioForm userSession={userSession} />
                <DateOfBirthForm
                    dateOfBirthProp={user.dateOfBirth || undefined}
                    userSession={userSession}
                />
                <GenderForm
                    genderProp={user.gender || undefined}
                    userSession={userSession}
                />
            </>
        </SettingsContent>
    );
};
export default ProfileMain;
