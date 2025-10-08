'use client';

import { type LucideIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel,
    useSidebar
} from '@/components/ui/sidebar';
import { SessionType } from '@/types/session';

export function NavAdmin({
    items,
    userSession
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        admin?: boolean;
    }[];
    userSession: SessionType;
}) {
    const pathname = usePathname();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => {
                        if (
                            !item.admin ||
                            (item.admin &&
                                userSession?.userCompany.role ===
                                    'COMPANY_ADMIN')
                        ) {
                            const isActive = pathname === item.url;
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={isActive}
                                        className="cursor-pointer"
                                        asChild
                                    >
                                        <Link href={item.url}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        }
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
