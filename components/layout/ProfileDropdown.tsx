'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
import { SessionType } from '@/types/session';

export function ProfileDropdown({
    initialSession
}: {
    initialSession: SessionType;
}) {
    const { data: liveSession } = useSession();
    const session = liveSession ?? initialSession;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [initials, setInitials] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (session?.user) {
            const name = session.user.name ?? '';
            const last = session.user.lastName ?? '';

            setInitials(`${name[0] ?? ''}${last[0] ?? ''}`);
            setFullName(`${name} ${last}`);
            setEmail(session.user.email);
        }
    }, [session]);

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full cursor-pointer"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={session?.user.image || undefined}
                                alt={fullName}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1.5 ">
                            <p className="text-sm leading-none font-medium">
                                {fullName}
                            </p>
                            <p className="text-muted-foreground text-xs leading-none">
                                {email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <User /> Profile
                            </Link>
                        </DropdownMenuItem>
                        {session?.userCompany.role === 'COMPANY_ADMIN' && (
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/billing"
                                    className="cursor-pointer"
                                >
                                    <CircleDollarSign />
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
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
