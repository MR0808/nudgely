import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Users,
    Building2,
    Users2,
    CreditCard,
    Layers,
    Database,
    FileText,
    Clock,
    ScrollText,
    Bell
} from 'lucide-react';

export type AdminNavItem = {
    name: string;
    href: string;
    icon: LucideIcon;
};

export type AdminNavSection = {
    title: string;
    items: AdminNavItem[];
};

export const adminNavigation: AdminNavSection[] = [
    {
        title: 'Overview',
        items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }]
    },
    {
        title: 'User Management',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Companies', href: '/admin/companies', icon: Building2 },
            { name: 'Teams', href: '/admin/teams', icon: Users2 }
        ]
    },
    {
        title: 'Billing',
        items: [
            { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
            { name: 'Plans', href: '/admin/plans', icon: Layers }
        ]
    },
    {
        title: 'Content',
        items: [
            { name: 'Templates', href: '/admin/templates', icon: FileText },
            { name: 'Nudges', href: '/admin/nudges', icon: Bell },
            { name: 'Reference Data', href: '/admin/reference-data', icon: Database }
        ]
    },
    {
        title: 'Operations',
        items: [
            { name: 'Cron Jobs', href: '/admin/cron', icon: Clock },
            { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText }
        ]
    }
];
