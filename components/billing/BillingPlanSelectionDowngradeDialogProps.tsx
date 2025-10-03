'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { BillingPlanSelectionDowngradeDialogProps } from '@/types/billing';

const BillingPlanSelectionDowngradeDialog = ({
    company,
    plan,
    open,
    setOpen
}: BillingPlanSelectionDowngradeDialogProps) => {
    const nudgeCount = company.teams.reduce((total, team) => {
        return total + team.nudges.length;
    }, 0);

    const overages = [
        {
            key: 'members',
            label: 'Members',
            current: company.members.length,
            limit: plan.maxUsers
        },
        {
            key: 'teams',
            label: 'Teams',
            current: company.teams.length,
            limit: plan.maxTeams
        },
        {
            key: 'nudges',
            label: 'Nudges',
            current: nudgeCount,
            limit: plan.maxNudges
        }
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Confirm downgrade to {plan.name}
                    </DialogTitle>
                    <DialogDescription>
                        Before you proceed — your current usage may exceed the
                        limits for <strong>{plan.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Your account will be downgraded at the end of your
                            current billing period. After this you will have
                            <strong>7 days</strong> to reduce your usage. After
                            that, extra items will be softly locked
                            (read-only/archived) until you either remove them or
                            upgrade again. You will be notified of this.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                            Current stats:
                        </h4>
                        <ul className="space-y-2">
                            {overages.map((o) => {
                                const over = Math.max(0, o.current - o.limit);
                                return (
                                    <li
                                        key={o.key}
                                        className="flex items-center justify-between p-3 rounded-md border border-border bg-background"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-foreground">
                                                {o.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Current: {o.current} • Limit:{' '}
                                                {o.limit === 0
                                                    ? 'Unlimited'
                                                    : o.limit}
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-destructive">
                                            +{over}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BillingPlanSelectionDowngradeDialog;
