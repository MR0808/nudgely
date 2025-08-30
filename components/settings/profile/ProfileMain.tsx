import SettingsContent from '@/components/settings/SettingsContent';
import { SettingsProps } from '@/types/settings';
import ProfilePictureForm from '@/components/settings/profile/ProfilePictureForm';
import JobTitleForm from '@/components/settings/profile/JobTitleForm';
import BioForm from '@/components/settings/profile/BioForm';

const ProfileMain = ({ userSession, location }: SettingsProps) => {
    if (!userSession) return null;
    return (
        <SettingsContent
            title="Profile"
            desc="Set up your profile for others to see you on here. We don't ever share your personal details."
        >
            <>
                <ProfilePictureForm userSession={userSession} />
                <JobTitleForm userSession={userSession} />
                <BioForm userSession={userSession} />
            </>
        </SettingsContent>
    );
};
export default ProfileMain;
