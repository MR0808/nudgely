import { Dispatch, SetStateAction } from 'react';

import { LocationData } from '@/types/account';
import { SessionType } from '@/types/session';

export enum MenuOption {
    Account = 'account',
    Security = 'security',
    Profile = 'profile',
    Preferences = 'preferences',
    Notifications = 'notifications'
}

export type SettingsProps = {
    userSession: SessionType | null;
    location: LocationData;
};

export interface SettingsSidebarNavProps {
    selectedOption: MenuOption;
    setSelectedOption: Dispatch<SetStateAction<MenuOption>>;
}

export interface SettingsContentProps {
    selectedOption: MenuOption;
}
