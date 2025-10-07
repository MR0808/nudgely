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

export function NavAdmin({
    items
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
    }[];
}) {
    const { isMobile } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const [optimisticPath, setOptimisticPath] = useOptimistic(pathname);
    const [isPending, startTransition] = useTransition();

    const handleNavigation = (url: string) => {
        startTransition(() => {
            setOptimisticPath(url);
            router.push(url);
        });
    };

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent
                className="flex flex-col gap-2"
                data-pending={isPending ? '' : undefined}
            >
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive =
                            optimisticPath === item.url ||
                            (optimisticPath === '/' && item.url === '/');
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    isActive={isActive}
                                    // onClick={() => handleNavigation(item.url)}
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
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
