'use client';

import {
    Gauge,
    Database,
    FileText,
    CircleQuestionMark,
    ClipboardList,
    Search,
    Settings,
    Sparkles
} from 'lucide-react';

import { NavDocuments } from '@/components/layout/NavDocuments';
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
// import { ChatMaxingIconColoured } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

const data = {
    navMain: [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: Gauge
        },
        {
            title: 'Payment gated',
            url: '/dashboard/payment-gated',
            icon: Sparkles
        }
    ],
    navSecondary: [
        {
            title: 'Get Help',
            url: '#',
            icon: CircleQuestionMark
        }
    ],
    documents: [
        {
            name: 'Data Library',
            url: '#',
            icon: Database
        },
        {
            name: 'Reports',
            url: '#',
            icon: ClipboardList
        },
        {
            name: 'Word Assistant',
            url: '#',
            icon: FileText
        }
    ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <NavDocuments items={data.documents} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
