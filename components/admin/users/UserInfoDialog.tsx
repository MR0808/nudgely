'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Info, Loader2 } from 'lucide-react';
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
import {
    getUserDetails,
    getUserStats,
    getUserAuditLogs
} from '@/actions/admin/users';
import { toast } from 'sonner';

type BasicUser = {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
};

type UserDetails = {
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

export function UserInfoDialog({ user }: { user: BasicUser }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        if (open && !userDetails) {
            loadUserData();
        }
    }, [open]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const [details, statsData, logs] = await Promise.all([
                getUserDetails(user.id),
                getUserStats(user.id),
                getUserAuditLogs(user.id)
            ]);
            setUserDetails(details);
            setStats(statsData);
            setAuditLogs(logs);
        } catch (error) {
            toast.error('Failed to load user details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : userDetails && stats ? (
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
                                                src={
                                                    userDetails.image ||
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback className="text-lg">
                                                {userDetails.name?.charAt(0)}
                                                {userDetails.lastName?.charAt(
                                                    0
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-lg font-semibold">
                                                {userDetails.name}{' '}
                                                {userDetails.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {userDetails.email}
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
                                                    userDetails.role ===
                                                    'SITE_ADMIN'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {userDetails.role}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Status
                                            </p>
                                            <Badge
                                                variant={
                                                    userDetails.status ===
                                                    'ACTIVE'
                                                        ? 'outline'
                                                        : userDetails.status ===
                                                            'DISABLED'
                                                          ? 'secondary'
                                                          : 'destructive'
                                                }
                                            >
                                                {userDetails.status}
                                            </Badge>
                                        </div>
                                        {userDetails.phoneNumber && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Phone
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.phoneNumber}
                                                </p>
                                            </div>
                                        )}
                                        {userDetails.jobTitle && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Job Title
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.jobTitle}
                                                </p>
                                            </div>
                                        )}
                                        {userDetails.country && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Country
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.country.name}
                                                </p>
                                            </div>
                                        )}
                                        {userDetails.region && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Region
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.region.name}
                                                </p>
                                            </div>
                                        )}
                                        {userDetails.timezone && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Timezone
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.timezone}
                                                </p>
                                            </div>
                                        )}
                                        {userDetails.locale && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Locale
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.locale}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {userDetails.bio && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                                    Bio
                                                </p>
                                                <p className="text-sm">
                                                    {userDetails.bio}
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
                                                {userDetails.emailVerified
                                                    ? 'Yes'
                                                    : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                Phone Verified
                                            </p>
                                            <p>
                                                {userDetails.phoneVerified
                                                    ? 'Yes'
                                                    : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                Joined
                                            </p>
                                            <p>
                                                {new Date(
                                                    userDetails.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">
                                                Last Updated
                                            </p>
                                            <p>
                                                {new Date(
                                                    userDetails.updatedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {userDetails.banned && (
                                        <>
                                            <Separator />
                                            <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                                                <p className="font-semibold text-destructive">
                                                    User is Banned
                                                </p>
                                                {userDetails.banReason && (
                                                    <p className="text-sm">
                                                        <span className="font-medium">
                                                            Reason:
                                                        </span>{' '}
                                                        {userDetails.banReason}
                                                    </p>
                                                )}
                                                {userDetails.banExpires && (
                                                    <p className="text-sm">
                                                        <span className="font-medium">
                                                            Expires:
                                                        </span>{' '}
                                                        {new Date(
                                                            userDetails.banExpires
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
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
