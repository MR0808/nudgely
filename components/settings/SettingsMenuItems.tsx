import { Bell, UserCog, LockKeyhole, Settings2, Cog } from 'lucide-react';
import { MenuOption } from '@/types/settings';

export const sidebarNavItems = [
    {
        title: 'Account',
        option: MenuOption.Account,
        icon: Cog
    },
    {
        title: 'Security',
        option: MenuOption.Security,
        icon: LockKeyhole
    },
    {
        title: 'Profile',
        option: MenuOption.Profile,
        icon: UserCog
    },
    {
        title: 'Preferences',
        option: MenuOption.Preferences,
        icon: Settings2
    },
    {
        title: 'Notifications',
        option: MenuOption.Notifications,
        icon: Bell
    }
];
