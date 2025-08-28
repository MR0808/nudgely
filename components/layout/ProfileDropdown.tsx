'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth-client';
import { CircleDollarSign, LogOut, Settings, User } from 'lucide-react';
import LogoutDialog from '@/components/layout/LogoutDialog';

export function ProfileDropdown() {
    const { data: userSession } = useSession();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const initials = `${userSession?.user.name[0]}${userSession?.user.lastName[0]}`;

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={userSession?.user.image || undefined}
                                alt={`${userSession?.user.name} ${userSession?.user.lastName}`}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-sm leading-none font-medium">
                                {`${userSession?.user.name} ${userSession?.user.lastName}`}
                            </p>
                            <p className="text-muted-foreground text-xs leading-none">
                                {`${userSession?.user.email}`}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">
                                <User /> Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">
                                <CircleDollarSign />
                                Billing
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">
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
            <LogoutDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </>
    );
}
