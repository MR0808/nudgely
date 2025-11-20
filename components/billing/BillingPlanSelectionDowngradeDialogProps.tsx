'use client';

import { useTransition } from 'react';
import { loadStripe } from '@stripe/stripe-js';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { BillingPlanSelectionDowngradeDialogProps } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/actions/subscriptions';

const BillingPlanSelectionDowngradeDialog = ({
    company,
    plan,
    open,
    setOpen
}: BillingPlanSelectionDowngradeDialogProps) => {
    const [isPending, startTransition] = useTransition();

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

    const stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );

    const handlePlanSelect = async () => {
        startTransition(async () => {
            const stripe = await stripePromise;

            if (!stripe) {
                console.error('Stripe failed to load');
                return;
            }

            if (company.companySubscription && company.stripeCustomerId) {
                const response = await createPortalSession(
                    company.stripeCustomerId,
                    company.companySubscription.stripeSubscriptionId
                );

                if (!response.success) {
                    const errorData = response.message;
                    console.error('API Error:', errorData);
                    return;
                }

                if (response.data.url) {
                    // Redirect to the Stripe Customer Portal
                    window.location.href = response.data.url;
                }
            }
        });
    };

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
                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Your account will be downgraded at the end of your
                            current billing period. After that, all items that
                            are over the limit will be disabled, and you will
                            need to reenable the items you want. It is suggested
                            that you start bringing your items down under the
                            limit before then.
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
                    <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                        <strong>
                            What happens until the end of your billing period:
                        </strong>
                        <ul className="list-disc list-inside mt-2">
                            <li>All existing users/teams remain active.</li>
                            <li>
                                We&apos;ll send a reminder email the day before.
                            </li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex justify-between gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={handlePlanSelect}
                        >
                            {isPending
                                ? 'Processing…'
                                : 'Proceed and Downgrade'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BillingPlanSelectionDowngradeDialog;
