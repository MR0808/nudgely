'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { adminNavigation } from '@/lib/admin-navigation';

export function AdminSidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'flex w-64 flex-col border-r bg-card',
                className
            )}
        >
            <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">Admin Panel</h2>
                        <Badge variant="secondary" className="text-xs">
                            Site Admin
                        </Badge>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-6">
                    {adminNavigation.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== '/admin' &&
                                            pathname.startsWith(item.href));

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
                </nav>
            </ScrollArea>

            <div className="border-t p-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to app
                </Link>
            </div>
        </aside>
    );
}
