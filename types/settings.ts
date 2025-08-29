import { Dispatch, SetStateAction } from 'react';

import { auth } from '@/lib/auth';
import { LocationData } from '@/types/account';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

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
