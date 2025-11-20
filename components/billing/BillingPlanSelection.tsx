'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, Calendar, Check, Star } from 'lucide-react';
import { Plan } from '@/generated/prisma';
import { loadStripe } from '@stripe/stripe-js';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { BillingPlanSelectionProps } from '@/types/billing';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/global/DynamicIcon';
import { cn } from '@/lib/utils';
import { formatDollarsForDisplayNoDecimals } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import {
    createCheckoutSessions,
    createPortalSession
} from '@/actions/subscriptions';
import BillingPlanSelectionDowngradeDialog from '@/components/billing/BillingPlanSelectionDowngradeDialogProps';
import Link from 'next/link';

const BillingPlanSelection = ({
    company,
    plans,
    isComplete
}: BillingPlanSelectionProps) => {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [plan, setPlan] = useState(plans[0]);
    const [billingInterval, setBillingInterval] = useState<
        'MONTHLY' | 'YEARLY'
    >('YEARLY');

    const getYearlySavings = (plan: (typeof plans)[0]) => {
        if (plan.priceMonthly === 0) return 0;
        const monthlyTotal = plan.priceMonthly * 12;
        const yearlyTotal = plan.priceYearly * 12;
        return monthlyTotal - yearlyTotal;
    };

    const stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );

    const handlePlanSelect = async (plan: Plan) => {
        if (company.plan.level > plan.level) {
            setPlan(plan);
            setOpen(true);
            return;
        }
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

                if (!response.success || !response.data) {
                    const errorData = response.message;
                    console.error('API Error:', errorData);
                    return;
                }

                if (response.data.url) {
                    // Redirect to the Stripe Customer Portal
                    window.location.href = response.data.url;
                }
            } else {
                const planId =
                    billingInterval === 'YEARLY'
                        ? plan.stripeYearlyId
                        : plan.stripeMonthlyId;
                const response = await createCheckoutSessions(
                    planId,
                    company.id
                );

                if (!response.success || !response.data) {
                    const errorData = response.message;
                    console.error('API Error:', errorData);
                    return;
                }

                if (response.data.url) {
                    window.location.href = response.data.url;
                }
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>
                    Select the perfect plan for your team
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center max-w-[16rem] m-auto mb-8 lg:mb-16">
                    <div className="relative flex w-full p-1 bg-muted  rounded-full">
                        <span
                            className="absolute inset-0 m-1 pointer-events-none"
                            aria-hidden="true"
                        >
                            <span
                                className={`absolute inset-0 w-1/2 bg-background rounded-full shadow-sm shadow-indigo-950/10 transform transition-transform duration-150 ease-in-out ${billingInterval === 'YEARLY' ? 'translate-x-0' : 'translate-x-full'}`}
                            ></span>
                        </span>
                        <button
                            className={`relative flex-1 h-10 text-lg rounded-full focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150 ease-in-out ${billingInterval === 'YEARLY' ? 'text-foreground font-bold' : 'text-muted-foreground font-medium hover:text-foreground cursor-pointer '}`}
                            onClick={() => setBillingInterval('YEARLY')}
                            aria-pressed={billingInterval === 'YEARLY'}
                        >
                            Yearly
                        </button>
                        <button
                            className={`relative flex-1 h-10 text-lg  rounded-full focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150 ease-in-out ${billingInterval === 'MONTHLY' ? 'text-foreground font-bold' : 'text-muted-foreground font-medium hover:text-foreground cursor-pointer '}`}
                            onClick={() => setBillingInterval('MONTHLY')}
                            aria-pressed={billingInterval === 'MONTHLY'}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
                {!isComplete && (
                    <div>
                        <p className="text-sm text-muted-foreground h-16">
                            You cannot upgrade until you complete your company
                            profile. Click{' '}
                            <Link
                                className="underline text-blue-700"
                                href="/onboarding"
                            >
                                here
                            </Link>{' '}
                            to continue the wizard or head to settings.
                        </p>
                    </div>
                )}

                <div className="grid md:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.id === company.plan.id;
                        const yearlySavings = getYearlySavings(plan);

                        return (
                            <Card
                                key={plan.id}
                                className={`relative transition-all hover:shadow-md flex flex-col ${plan.popular ? 'border-primary' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground">
                                            <Star className="h-3 w-3 mr-1" />
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardContent className="px-6 py-2 flex flex-col h-full">
                                    <div className="flex-1 space-y-4">
                                        <div className="text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 mb-2">
                                                <DynamicIcon
                                                    name={plan.icon}
                                                    className={cn(
                                                        'w-6 h-6',
                                                        plan.iconClassname
                                                    )}
                                                />
                                                <h3 className="text-lg font-semibold">
                                                    {plan.name}
                                                </h3>
                                            </div>

                                            <div className="mb-2">
                                                <span className="text-3xl font-bold">
                                                    {formatDollarsForDisplayNoDecimals(
                                                        billingInterval ===
                                                            'YEARLY'
                                                            ? plan.priceYearly
                                                            : plan.priceMonthly
                                                    )}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    /month
                                                </span>
                                                {billingInterval ===
                                                    'YEARLY' && (
                                                    <>
                                                        {yearlySavings > 0 ? (
                                                            <p className="text-xs text-green-600 font-medium pt-2">
                                                                Save{' '}
                                                                {formatDollarsForDisplayNoDecimals(
                                                                    yearlySavings *
                                                                        company
                                                                            .members
                                                                            .length
                                                                )}
                                                                /year
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs pt-2">
                                                                &nbsp;
                                                            </p>
                                                        )}
                                                        {plan.priceMonthly >
                                                        0 ? (
                                                            <p className="text-xs text-muted-foreground">
                                                                Billed{' '}
                                                                {formatDollarsForDisplayNoDecimals(
                                                                    plan.priceYearly *
                                                                        12
                                                                )}{' '}
                                                                yearly
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs">
                                                                &nbsp;
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground h-16">
                                                {plan.description}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            {plan.features.map(
                                                (feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                        <span>{feature}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full mt-4 cursor-pointer"
                                        disabled={
                                            !isComplete ||
                                            isCurrentPlan ||
                                            isPending
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlanSelect(plan);
                                        }}
                                    >
                                        {isPending ? (
                                            'Processing...'
                                        ) : isCurrentPlan ? (
                                            'Current Plan'
                                        ) : plan.id === 'FREE' ? (
                                            'Downgrade'
                                        ) : (
                                            <>
                                                Switch to {plan.name}
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">
                                Billing Information
                            </p>
                            <p className="text-sm text-blue-700">
                                • Changes take effect immediately when
                                upgrading, and next billing period when
                                downgrading
                            </p>
                            <p className="text-sm text-blue-700">
                                • If downgrading, all your items that are
                                limited will be disabled, and you will need to
                                re-enable those you wish to keep
                            </p>
                            <p className="text-sm text-blue-700">
                                • On a monthly plan, cancel anytime with no
                                long-term commitments
                            </p>
                            <p className="text-sm text-blue-700">
                                • Yearly plans are billed annually
                            </p>
                        </div>
                    </div>
                </div>
                <BillingPlanSelectionDowngradeDialog
                    plan={plan}
                    company={company}
                    open={open}
                    setOpen={setOpen}
                />
            </CardContent>
        </Card>
    );
};

export default BillingPlanSelection;
