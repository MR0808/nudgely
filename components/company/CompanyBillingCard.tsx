import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CreditCard,
    Crown,
    TrendingUp,
    Calendar,
    DollarSign
} from 'lucide-react';
import { CompanyBillingCardProps } from '@/types/company';
import { formatDollarsForDisplayNoDecimals } from '@/utils/currency';

const CompanyBillingCard = ({
    company,
    nudgeCount
}: CompanyBillingCardProps) => {
    const { plan } = company;
    // Mock billing data
    const billing = {
        plan: 'PRO' as const,
        isTrialing: true,
        trialDaysLeft: 8,
        memberCount: 12,
        monthlyAmount: 120, // $10 per member
        nextBillingDate: new Date('2024-03-15'),
        paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025
        },
        usage: {
            teams: { current: 3, limit: 'unlimited' },
            tasks: { current: 42, limit: 'unlimited' },
            members: { current: 12, limit: 'unlimited' }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Billing & Usage
                    </CardTitle>
                    <CardDescription>
                        Manage your subscription and view usage
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/billing">Manage Billing</Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Crown className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                    {plan.name} Plan
                                </h3>
                            </div>
                        </div>
                    </div>
                    {company.companySubscription && (
                        <div className="text-right">
                            <p className="text-2xl font-bold">
                                {company.companySubscription.billingInterval ===
                                'MONTHLY'
                                    ? formatDollarsForDisplayNoDecimals(
                                          plan.priceMonthly
                                      )
                                    : formatDollarsForDisplayNoDecimals(
                                          plan.priceYearly
                                      )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                per{' '}
                                {company.companySubscription.billingInterval ===
                                'MONTHLY'
                                    ? 'month'
                                    : 'year'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Usage Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 w-1/2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Teams</span>
                            <span className="font-medium">
                                {company.teams.length}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {plan.maxTeams === 0
                                ? `Unlimited on ${plan.name} plan`
                                : `${plan.maxTeams} available on ${plan.name} plan`}
                        </div>
                    </div>

                    <div className="space-y-2 w-1/2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Active Nudges
                            </span>
                            <span className="font-medium">{nudgeCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {plan.maxNudges === 0
                                ? `Unlimited on ${plan.name} plan`
                                : `${plan.maxNudges} available on ${plan.name} plan`}
                        </div>
                    </div>

                    <div className="space-y-2 w-1/2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Members
                            </span>
                            <span className="font-medium">
                                {company.members.length}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {plan.maxUsers === 0
                                ? `Unlimited on ${plan.name} plan`
                                : `${plan.maxUsers} available on ${plan.name} plan`}
                        </div>
                    </div>
                </div>

                {/* Payment Method & Next Billing */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Method
                        </h4>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    •••• •••• •••• {billing.paymentMethod.last4}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Expires {billing.paymentMethod.expiryMonth}/
                                    {billing.paymentMethod.expiryYear}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Next Billing
                        </h4>
                        <div className="p-3 border rounded-lg">
                            <p className="text-sm font-medium">
                                {billing.nextBillingDate.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                ${billing.monthlyAmount} for{' '}
                                {billing.memberCount} members
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CompanyBillingCard;
