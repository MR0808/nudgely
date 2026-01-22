'use client';

import { useState, useTransition } from 'react';
import type { Plan } from '@/generated/prisma/client';
import { Check, CreditCard, Calendar, Star, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BillingManagementDialogProps } from '@/types/company';
import { formatDollarsForDisplayNoDecimals } from '@/utils/currency';
import { DynamicIcon } from '@/components/global/DynamicIcon';
import { cn } from '@/lib/utils';

export function BillingManagementDialog({
    trigger,
    company,
    plans
}: BillingManagementDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
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

    const handlePlanSelect = async (plan: Plan) => {
        // if (planId === currentPlan) return;
        // setIsLoading(true);
        // try {
        //     // Mock upgrade/downgrade logic
        //     // Simulate API call
        //     await new Promise((resolve) => setTimeout(resolve, 1500));
        //     setOpen(false);
        //     // In real implementation, this would redirect to Stripe or update the plan
        //     alert(
        //         `Successfully ${planId === 'FREE' ? 'downgraded' : 'upgraded'} to ${planId} plan!`
        //     );
        // } catch (error) {
        //     console.error('[v0] Error updating plan:', error);
        // } finally {
        //     setIsLoading(false);
        // }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Manage Billing & Plans
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Plan Info */}
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant={company.plan.colour}>
                                    Current Plan
                                </Badge>
                                <DynamicIcon
                                    name={company.plan.icon}
                                    className={cn(
                                        'w-6 h-6',
                                        company.plan.iconClassname
                                    )}
                                />
                                <span className="font-medium">
                                    {company.plan.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">
                                    {company.companySubscription
                                        ?.billingInterval === 'MONTHLY'
                                        ? `${formatDollarsForDisplayNoDecimals(company.plan.priceMonthly)} / month`
                                        : `${formatDollarsForDisplayNoDecimals(company.plan.priceYearly)} / month`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {company.members.length} member
                                    {company.members.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
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
                                className={`px-4 py-2 rounded-md text-sm  transition-all relative ${
                                    billingInterval === 'YEARLY'
                                        ? 'bg-background text-foreground font-bold shadow-sm'
                                        : 'text-muted-foreground font-medium hover:text-foreground'
                                }`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-4 gap-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = plan.id === company.plan.id;
                            const yearlySavings = getYearlySavings(plan);

                            return (
                                <Card
                                    key={plan.id}
                                    className={`relative cursor-pointer transition-all hover:shadow-md ${
                                        selectedPlan.id === plan.id
                                            ? 'ring-2 ring-primary'
                                            : ''
                                    }`}
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

                                    <CardContent className="px-6 py-2 space-y-4 justify-between">
                                        <div className="flex flex-col justify-between space-y-4">
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
                                                        /year
                                                    </span>
                                                    {billingInterval ===
                                                        'YEARLY' &&
                                                        yearlySavings > 0 && (
                                                            <p className="text-xs text-green-600 font-medium">
                                                                {`Save ${formatDollarsForDisplayNoDecimals(yearlySavings)}/year`}
                                                            </p>
                                                        )}
                                                </div>

                                                <p className="text-sm text-muted-foreground mt-2">
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
                                                            <span>
                                                                {feature}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant={
                                                selectedPlan === plan
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="w-full"
                                            disabled={
                                                isCurrentPlan || isPending
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlanSelect(plan);
                                            }}
                                        >
                                            {isPending &&
                                            selectedPlan === plan ? (
                                                'Processing...'
                                            ) : isCurrentPlan ? (
                                                'Current Plan'
                                            ) : plan.id === 'FREE' ? (
                                                'Downgrade'
                                            ) : (
                                                <>
                                                    {/* {currentPlan === 'FREE'
                                                        ? 'Upgrade'
                                                        : 'Switch'}{' '} */}
                                                    to {plan.name}
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

