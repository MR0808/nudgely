import { getUsers } from '@/actions/admin/users';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MoreVertical,
    Ban,
    CheckCircle,
    Shield,
    DollarSign
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/admin/Pagination';

export async function UserList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { users, totalCount } = await getUsers(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

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
                {users.map((user) => (
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
                                                    : user.status === 'DISABLED'
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

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem>
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Grant Free Access
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.status === 'ACTIVE' ? (
                                        <DropdownMenuItem className="text-orange-600">
                                            Disable Account
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem className="text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Enable Account
                                        </DropdownMenuItem>
                                    )}
                                    {user.banned ? (
                                        <DropdownMenuItem className="text-green-600">
                                            Unban User
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem className="text-destructive">
                                            <Ban className="h-4 w-4 mr-2" />
                                            Ban User
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                        Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Card>
                ))}
            </div>

            <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
            />
        </div>
    );
}
