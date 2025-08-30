'use client';

import { EllipsisVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    CircleDollarSign,
    LogOut,
    Settings,
    User,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/lib/auth-client';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import LogoutDialog from '@/components/layout/LogoutDialog';

export function NavUser() {
    const { isMobile } = useSidebar();
    const { data: userSession } = useSession();
    const [initials, setInitials] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (userSession && userSession.user) {
            setInitials(
                `${userSession.user.name[0]}${userSession.user.lastName[0]}`
            );
            setFullName(
                `${userSession.user.name} ${userSession.user.lastName}`
            );
            setEmail(userSession.user.email);
        }
    }, [userSession]);

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={userSession?.user.image || undefined}
                                    alt={`${userSession?.user.name} ${userSession?.user.lastName}`}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {fullName}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {email}
                                </span>
                            </div>
                            <EllipsisVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                                <Avatar className="h-8 w-8 rounded-lg grayscale">
                                    <AvatarImage
                                        src={
                                            userSession?.user.image || undefined
                                        }
                                        alt={`${userSession?.user.name} ${userSession?.user.lastName}`}
                                    />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {`${userSession?.user.name} ${userSession?.user.lastName}`}
                                    </span>
                                    <span className="truncate text-xs">
                                        {userSession?.user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                <Sparkles />
                                Upgrade to Pro
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings"
                                    className="cursor-pointer"
                                >
                                    <User /> Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings"
                                    className="cursor-pointer"
                                >
                                    <CircleDollarSign />
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings"
                                    className="cursor-pointer"
                                >
                                    <Settings /> Settings
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setIsDialogOpen(true)}
                            className="cursor-pointer"
                        >
                            <LogOut />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <LogoutDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
