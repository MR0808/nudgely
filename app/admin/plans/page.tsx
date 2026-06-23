import { authCheckAdmin } from '@/lib/authCheck';
import { PlanList } from '@/components/admin/plans/PlanList';

export default async function AdminPlansPage() {
    await authCheckAdmin('/admin/plans');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
                <p className="text-muted-foreground mt-2">
                    Edit plan limits and pricing. Stripe price IDs are managed
                    separately in seed data.
                </p>
            </div>
            <PlanList />
        </div>
    );
}
