'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { adminNavigation } from '@/lib/admin-navigation';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen">
            <AdminSidebar className="hidden lg:flex" />

            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                                <span className="sr-only">Open admin menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <SheetHeader className="border-b p-4 text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Admin Panel
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="space-y-6 p-4">
                                {adminNavigation.map((section) => (
                                    <div key={section.title}>
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-1">
                                            {section.items.map((item) => {
                                                const isActive =
                                                    pathname === item.href ||
                                                    (item.href !== '/admin' &&
                                                        pathname.startsWith(
                                                            item.href
                                                        ));

                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className={cn(
                                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
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
                                <Link
                                    href="/"
                                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    ← Back to app
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <span className="font-semibold">Admin</span>
                </header>

                <main className="flex-1 overflow-y-auto bg-muted/30">
                    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
