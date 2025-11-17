'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type User = {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
    phoneNumber?: string | null;
    role: string;
    status: string;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    image?: string | null;
    gender?: string | null;
    dateOfBirth?: Date | null;
    jobTitle?: string | null;
    bio?: string | null;
    timezone?: string | null;
    locale?: string | null;
    country?: { name: string } | null;
    region?: { name: string } | null;
};

type AuditLog = {
    id: string;
    action: string;
    category: string;
    description: string | null;
    ipAddress: string | null;
    createdAt: Date;
};

type UserStats = {
    totalCompanies: number;
    totalTeams: number;
    totalNudgesCreated: number;
    totalNudgesCompleted: number;
    lastLoginAt: Date | null;
};

export function UserInfoDialog({
    user,
    stats,
    auditLogs
}: {
    user: User;
    stats: UserStats;
    auditLogs: AuditLog[];
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>User Information</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="audit">Audit Log</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* User Profile Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage
                                            src={user.image || undefined}
                                        />
                                        <AvatarFallback className="text-lg">
                                            {user.name?.charAt(0)}
                                            {user.lastName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {user.name} {user.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Role
                                        </p>
                                        <Badge
                                            variant={
                                                user.role === 'SITE_ADMIN'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Status
                                        </p>
                                        <Badge
                                            variant={
                                                user.status === 'ACTIVE'
                                                    ? 'outline'
                                                    : user.status === 'DISABLED'
                                                      ? 'secondary'
                                                      : 'destructive'
                                            }
                                        >
                                            {user.status}
                                        </Badge>
                                    </div>
                                    {user.phoneNumber && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Phone
                                            </p>
                                            <p className="text-sm">
                                                {user.phoneNumber}
                                            </p>
                                        </div>
                                    )}
                                    {user.jobTitle && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Job Title
                                            </p>
                                            <p className="text-sm">
                                                {user.jobTitle}
                                            </p>
                                        </div>
                                    )}
                                    {user.country && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Country
                                            </p>
                                            <p className="text-sm">
                                                {user.country.name}
                                            </p>
                                        </div>
                                    )}
                                    {user.region && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Region
                                            </p>
                                            <p className="text-sm">
                                                {user.region.name}
                                            </p>
                                        </div>
                                    )}
                                    {user.timezone && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Timezone
                                            </p>
                                            <p className="text-sm">
                                                {user.timezone}
                                            </p>
                                        </div>
                                    )}
                                    {user.locale && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Locale
                                            </p>
                                            <p className="text-sm">
                                                {user.locale}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {user.bio && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                Bio
                                            </p>
                                            <p className="text-sm">
                                                {user.bio}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Separator />

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">
                                            Email Verified
                                        </p>
                                        <p>
                                            {user.emailVerified ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">
                                            Phone Verified
                                        </p>
                                        <p>
                                            {user.phoneVerified ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">
                                            Joined
                                        </p>
                                        <p>
                                            {new Date(
                                                user.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">
                                            Last Updated
                                        </p>
                                        <p>
                                            {new Date(
                                                user.updatedAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {user.banned && (
                                    <>
                                        <Separator />
                                        <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                                            <p className="font-semibold text-destructive">
                                                User is Banned
                                            </p>
                                            {user.banReason && (
                                                <p className="text-sm">
                                                    <span className="font-medium">
                                                        Reason:
                                                    </span>{' '}
                                                    {user.banReason}
                                                </p>
                                            )}
                                            {user.banExpires && (
                                                <p className="text-sm">
                                                    <span className="font-medium">
                                                        Expires:
                                                    </span>{' '}
                                                    {new Date(
                                                        user.banExpires
                                                    ).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stats Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistics</CardTitle>
                                <CardDescription>
                                    User activity and engagement metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold">
                                            {stats.totalCompanies}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Companies
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold">
                                            {stats.totalTeams}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Teams
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold">
                                            {stats.totalNudgesCreated}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Nudges Created
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold">
                                            {stats.totalNudgesCompleted}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Nudges Completed
                                        </p>
                                    </div>
                                </div>
                                {stats.lastLoginAt && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            Last Login:{' '}
                                            <span className="font-medium text-foreground">
                                                {new Date(
                                                    stats.lastLoginAt
                                                ).toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Log</CardTitle>
                                <CardDescription>
                                    User activity history
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {auditLogs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No audit logs found for this user
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {auditLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="border-l-2 border-muted pl-4 py-2"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-xs"
                                                        >
                                                            {log.action}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {log.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            log.createdAt
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                                {log.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {log.description}
                                                    </p>
                                                )}
                                                {log.ipAddress && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        IP: {log.ipAddress}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
