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
import { createCheckoutSessions } from '@/actions/subscriptions';

const BillingPlanSelection = ({
    company,
    plans
}: BillingPlanSelectionProps) => {
    const [isPending, startTransition] = useTransition();
    const [selectedPlan, setSelectedPlan] = useState(company.plan);
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
        startTransition(async () => {
            const stripe = await stripePromise;

            if (!stripe) {
                console.error('Stripe failed to load');
                return;
            }

            const planId =
                billingInterval === 'YEARLY'
                    ? plan.stripeYearlyId
                    : plan.stripeMonthlyId;

            const response = await createCheckoutSessions(planId, company.id);

            if (response.error) {
                const errorData = response.error;
                console.error('API Error:', errorData);
                return;
            }

            if (response.sessionId) {
                const sessionId = response.sessionId;
                const result = await stripe.redirectToCheckout({
                    sessionId
                });
                if (result.error) {
                    console.error('Stripe redirect error:', result.error);
                }
            }

            console.error('No session ID returned from API');
            return;
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
                <div className="flex items-center justify-center">
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setBillingInterval('MONTHLY')}
                            className={`px-4 py-2 rounded-md text-sm transition-all ${
                                billingInterval === 'MONTHLY'
                                    ? 'bg-background text-foreground font-bold shadow-sm'
                                    : 'text-muted-foreground font-medium hover:text-foreground'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingInterval('YEARLY')}
                            className={`px-4 py-2 rounded-md text-sm transition-all relative ${
                                billingInterval === 'YEARLY'
                                    ? 'bg-background text-foreground font-bold shadow-sm'
                                    : 'text-muted-foreground font-medium hover:text-foreground'
                            }`}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.id === company.plan.id;
                        const yearlySavings = getYearlySavings(plan);

                        return (
                            <Card
                                key={plan.id}
                                className={`relative cursor-pointer transition-all hover:shadow-md flex flex-col ${
                                    selectedPlan.id === plan.id
                                        ? 'ring-2 ring-primary'
                                        : ''
                                } ${plan.popular ? 'border-primary' : ''}`}
                                onClick={() => setSelectedPlan(plan)}
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
                                        variant={
                                            selectedPlan.id === plan.id
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className="w-full mt-4 cursor-pointer"
                                        disabled={isCurrentPlan || isPending}
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
            </CardContent>
        </Card>
    );
};

export default BillingPlanSelection;
