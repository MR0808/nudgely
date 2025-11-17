import {
    getUsers,
    getUserDetails,
    getUserStats,
    getUserAuditLogs
} from '@/actions/admin/users';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban } from 'lucide-react';
import { Pagination } from '@/components/admin/Pagination';
import { UserActions } from '@/components/admin/users/UserActions';
import { UserInfoDialog } from '@/components/admin/users/UserInfoDialog';

export async function UserList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { users, totalCount } = await getUsers(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    // TODO: Replace with actual auth - get current user from session/JWT
    const currentUser = { role: 'SITE_ADMIN' }; // Placeholder

    if (users.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No users found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {users.map(async (user) => {
                    const canModify = !(
                        currentUser.role === 'SITE_ADMIN' &&
                        user.role === 'SITE_ADMIN'
                    );

                    const [userDetails, stats, auditLogs] = await Promise.all([
                        getUserDetails(user.id),
                        getUserStats(user.id),
                        getUserAuditLogs(user.id)
                    ]);

                    return (
                        <Card key={user.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage
                                            src={user.image || undefined}
                                        />
                                        <AvatarFallback>
                                            {user.name?.charAt(0)}
                                            {user.lastName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium truncate">
                                                {user.name} {user.lastName}
                                            </p>
                                            <Badge
                                                variant={
                                                    user.role === 'SITE_ADMIN'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="shrink-0"
                                            >
                                                {user.role}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    user.status === 'ACTIVE'
                                                        ? 'outline'
                                                        : user.status ===
                                                            'DISABLED'
                                                          ? 'secondary'
                                                          : 'destructive'
                                                }
                                                className="shrink-0"
                                            >
                                                {user.status}
                                            </Badge>
                                            {user.banned && (
                                                <Badge
                                                    variant="destructive"
                                                    className="shrink-0"
                                                >
                                                    <Ban className="h-3 w-3 mr-1" />
                                                    Banned
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="truncate">
                                                {user.email}
                                            </span>
                                            {user.phoneNumber && (
                                                <span className="shrink-0">
                                                    {user.phoneNumber}
                                                </span>
                                            )}
                                            <span className="shrink-0">
                                                Joined{' '}
                                                {new Date(
                                                    user.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <UserInfoDialog
                                        user={userDetails}
                                        stats={stats}
                                        auditLogs={auditLogs}
                                    />
                                    <UserActions
                                        user={user}
                                        canModify={canModify}
                                    />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
            />
        </div>
    );
}
