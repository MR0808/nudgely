import { getPlans } from '@/actions/admin/plans';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanEditDialog } from '@/components/admin/plans/PlanEditDialog';

function formatPrice(cents: number) {
    return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

export async function PlanList() {
    const plans = await getPlans();

    return (
        <div className="space-y-4">
            {plans.map((plan) => (
                <Card key={plan.id} className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold">
                                    {plan.name}
                                </h3>
                                <Badge variant="secondary">{plan.slug}</Badge>
                                {plan.popular && (
                                    <Badge variant="default">Popular</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {plan.headline}
                            </p>
                            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                <span>
                                    Monthly: {formatPrice(plan.priceMonthly)}
                                </span>
                                <span>
                                    Yearly: {formatPrice(plan.priceYearly)}
                                </span>
                                <span>Users: {plan.maxUsers}</span>
                                <span>Teams: {plan.maxTeams}</span>
                                <span>Nudges: {plan.maxNudges || '∞'}</span>
                                <span>
                                    Companies: {plan._count.companies}
                                </span>
                            </div>
                        </div>
                        <PlanEditDialog plan={plan} />
                    </div>
                </Card>
            ))}
        </div>
    );
}
