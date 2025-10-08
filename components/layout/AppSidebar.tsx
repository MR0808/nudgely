'use client';

import {
    Gauge,
    FileText,
    CircleQuestionMark,
    Settings,
    SquareCheckBig,
    ChartColumn,
    UsersRound
} from 'lucide-react';

import { NavAdmin } from '@/components/layout/NavAdmin';
import { NavMain } from '@/components/layout/NavMain';
import { NavSecondary } from '@/components/layout/NavSecondary';
import { NavUser } from '@/components/layout/NavUser';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { SessionType } from '@/types/session';

const data = {
    navMain: [
        {
            title: 'Dashboard',
            url: '/',
            icon: Gauge
        },
        {
            title: 'Tasks',
            url: '/tasks',
            icon: SquareCheckBig
        },
        {
            title: 'Templates',
            url: '/Templates',
            icon: FileText
        }
    ],
    navSecondary: [
        {
            title: 'Get Help',
            url: '#',
            icon: CircleQuestionMark
        }
    ],
    admin: [
        {
            title: 'Analytics',
            url: '/analytics',
            icon: ChartColumn
        },
        {
            title: 'Teams and Users',
            url: '/team',
            icon: UsersRound
        },
        {
            title: 'Company Settings',
            url: '/company',
            icon: Settings,
            admin: true
        }
    ]
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userSession: SessionType;
}

export function AppSidebar({ userSession, ...props }: AppSidebarProps) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5 no-hover"
                        >
                            <Link href="/" className="hover:bg-none">
                                <Image
                                    src="/images/logo/logo.png"
                                    alt="Nudgely"
                                    width={100}
                                    height={100}
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavAdmin items={data.admin} userSession={userSession} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
