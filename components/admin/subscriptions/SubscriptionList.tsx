import { getSubscriptions } from '@/actions/admin/subscriptions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';

export async function SubscriptionList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { subscriptions, totalCount } =
        await getSubscriptions(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    if (subscriptions.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No subscriptions found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {subscriptions.map((sub) => (
                    <Card key={sub.id} className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold">
                                    {sub.company?.name ?? 'Unknown company'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {sub.company?.plan.name} ·{' '}
                                    {sub.billingInterval.toLowerCase()}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono mt-1">
                                    {sub.stripeSubscriptionId}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant={
                                        sub.status === 'active'
                                            ? 'default'
                                            : sub.status === 'trialing'
                                              ? 'secondary'
                                              : 'destructive'
                                    }
                                >
                                    {sub.status ?? 'unknown'}
                                </Badge>
                                {sub.cancelAtPeriodEnd && (
                                    <Badge variant="outline">
                                        Cancels at period end
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {sub.nextBillingDate && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Next billing:{' '}
                                {new Date(
                                    sub.nextBillingDate
                                ).toLocaleDateString()}
                            </p>
                        )}
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
