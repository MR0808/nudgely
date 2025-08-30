'use client';

import { useState } from 'react';

import SettingsSidebarNav from '@/components/settings/SettingsSidebarNav';
import { MenuOption } from '@/types/settings';
import AccountMain from '@/components/settings/account/AccountMain';
import { SettingsProps } from '@/types/settings';
import SecurityMain from '@/components/settings/security/SecurityMain';
import ProfileMain from '@/components/settings/profile/ProfileMain';

const SettingsMain = ({ userSession, location }: SettingsProps) => {
    const [selectedOption, setSelectedOption] = useState<MenuOption>(
        MenuOption.Account
    );

    return (
        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
            <aside className="top-0 lg:sticky lg:w-1/5">
                <SettingsSidebarNav
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                />
            </aside>
            <div className="flex w-full overflow-y-hidden p-1">
                {selectedOption === MenuOption.Account && (
                    <AccountMain
                        userSession={userSession}
                        location={location}
                    />
                )}
                {selectedOption === MenuOption.Security && (
                    <SecurityMain
                        userSession={userSession}
                        location={location}
                    />
                )}
                {selectedOption === MenuOption.Profile && (
                    <ProfileMain
                        userSession={userSession}
                        location={location}
                    />
                )}
            </div>
        </div>
    );
};
export default SettingsMain;
