import { Suspense } from 'react';
import { UserList } from '@/components/admin/users/UserList';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';

export default async function UsersPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await authCheckAdmin('/admin/users');
    const params = await searchParams;
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage all users, roles, and permissions
                    </p>
                </div>
            </div>

            <Suspense fallback={<FiltersSkeleton />}>
                <UserFilters />
            </Suspense>

            <Suspense fallback={<UserListSkeleton />}>
                <UserList searchParams={params} currentUserId={session.user.id} />
            </Suspense>
        </div>
    );
}

function FiltersSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-20" />
        </div>
    );
}

function UserListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    );
}
