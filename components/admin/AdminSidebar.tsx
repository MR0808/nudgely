'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Building2,
    Settings
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const navigation = [
    {
        title: 'Overview',
        items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }]
    },
    {
        title: 'User Management',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Companies', href: '/admin/companies', icon: Building2 }
        ]
    }
];

const comingSoon = [
    'Teams',
    'Subscriptions',
    'Plans',
    'Reference Data',
    'Templates',
    'Nudges',
    'Cron Jobs',
    'Audit Logs'
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
            <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">Admin Panel</h2>
                        <Badge variant="secondary" className="text-xs">
                            Super Admin
                        </Badge>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Coming Soon
                        </h3>
                        <div className="space-y-1">
                            {comingSoon.map((name) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed"
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    </div>
                </nav>
            </ScrollArea>
        </aside>
    );
}
