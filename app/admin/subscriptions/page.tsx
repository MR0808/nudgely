import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';
import { SubscriptionList } from '@/components/admin/subscriptions/SubscriptionList';

export default async function AdminSubscriptionsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/subscriptions');
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Subscriptions
                </h1>
                <p className="text-muted-foreground mt-2">
                    Stripe subscriptions across all companies
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <SubscriptionList searchParams={params} />
            </Suspense>
        </div>
    );
}
