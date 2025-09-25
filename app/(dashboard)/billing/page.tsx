import { CreditCard, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCompany } from '@/actions/company';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDollarsForDisplayNoDecimals } from '@/utils/currency';
import { DynamicIcon } from '@/components/global/DynamicIcon';
import { cn } from '@/lib/utils';
import { getPlans } from '@/actions/plan';
import BillingPlanSelection from '@/components/billing/BillingPlanSelection';
import { getCustomerPaymentInformation } from '@/actions/subscriptions';
import BillingPaymentMethod from '@/components/billing/BillingPaymentMethod';

const mockInvoices = [
    {
        id: 'inv_1',
        date: new Date('2024-01-01'),
        amount: 96,
        status: 'paid' as const,
        downloadUrl: '#'
    },
    {
        id: 'inv_2',
        date: new Date('2023-12-01'),
        amount: 96,
        status: 'paid' as const,
        downloadUrl: '#'
    }
];

export async function generateMetadata(): Promise<Metadata> {
    const title = `Billing`;
    const description = 'View company billing settings.';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/billing`,
            siteName: siteMetadata.title,
            locale: 'en_AU',
            type: 'article',
            publishedTime: '2024-08-15 13:00:00',
            modifiedTime: '2024-08-15 13:00:00',
            images,
            authors: [siteMetadata.author]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images
        }
    };
}

const BillingPage = async ({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
    const userSession = await authCheck('/billing');
    const { company, userCompany } = await getCompany();
    const { plans } = await getPlans();
    const invoices = mockInvoices;
    const params = await searchParams;

    if (!company || userCompany.role !== 'COMPANY_ADMIN') {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Company data not found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The company data you&apos;re looking for
                            doesn&apos;t exist or you don&apos;t have access to
                            it. If this is an issue, please contact support.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const details = await getCustomerPaymentInformation(
        company.companySubscription?.stripeSubscriptionId
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return {
                    variant: 'default' as const,
                    className: 'bg-emerald-600 text-white',
                    label: 'Active'
                };
            case 'trialing':
                return {
                    variant: 'secondary' as const,
                    className: 'bg-blue-500 text-white',
                    label: 'Trial'
                };
            case 'past_due':
                return {
                    variant: 'destructive' as const,
                    className: 'bg-orange-500 text-white',
                    label: 'Past Due'
                };
            case 'canceled':
                return {
                    variant: 'secondary' as const,
                    className: 'bg-gray-500 text-white',
                    label: 'Canceled'
                };
            case 'unpaid':
                return {
                    variant: 'destructive' as const,
                    className: 'bg-red-500 text-white',
                    label: 'Unpaid'
                };
            case 'incomplete':
                return {
                    variant: 'secondary' as const,
                    className: 'bg-yellow-500 text-white',
                    label: 'Incomplete'
                };
            case 'incomplete_expired':
                return {
                    variant: 'secondary' as const,
                    className: 'bg-gray-500 text-white',
                    label: 'Expired'
                };
            default:
                return {
                    variant: 'secondary' as const,
                    className: 'bg-gray-500 text-white',
                    label: 'Unknown'
                };
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-balance">
                        Billing & Subscription
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your subscription and billing history
                    </p>
                </div>

                {params.session_id && (
                    <Alert variant="default">
                        <AlertTitle>Thank You</AlertTitle>
                        <AlertDescription>
                            Your subscription has been updated.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Current Plan Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Current Subscription
                        </CardTitle>
                        <CardDescription>
                            Your active plan and billing information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start justify-between p-4 bg-muted rounded-lg">
                            <div className="flex flex-col space-y-2">
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
                                {company.companySubscription?.status && (
                                    <Badge
                                        variant={
                                            getStatusBadge(
                                                company.companySubscription
                                                    .status
                                            ).variant
                                        }
                                        className={
                                            getStatusBadge(
                                                company.companySubscription
                                                    .status
                                            ).className
                                        }
                                    >
                                        {
                                            getStatusBadge(
                                                company.companySubscription
                                                    .status
                                            ).label
                                        }
                                    </Badge>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">
                                    {company.companySubscription
                                        ?.billingInterval === 'YEARLY'
                                        ? `${formatDollarsForDisplayNoDecimals(company.plan.priceYearly)} / month`
                                        : `${formatDollarsForDisplayNoDecimals(company.plan.priceMonthly)} / month`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {company.members.length} member
                                    {company.members.length !== 1 ? 's' : ''}
                                    {company.plan.priceYearly > 0 &&
                                        (company.companySubscription
                                            ?.billingInterval === 'YEARLY'
                                            ? ' • Billed yearly'
                                            : ' • Billed monthly')}
                                </p>
                                {company.companySubscription
                                    ?.nextBillingDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Next billing date:{' '}
                                        {company.companySubscription.nextBillingDate.toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Selection */}
                <BillingPlanSelection company={company} plans={plans || []} />

                {/* Payment Method */}
                {company.companySubscription && (
                    <>
                        <BillingPaymentMethod payment={details.payment} />
                        {/* Billing History */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Billing History</CardTitle>
                                    <CardDescription>
                                        Download your invoices and receipts
                                    </CardDescription>
                                </div>
                                {invoices.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-transparent"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export All
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No billing history</p>
                                        <p className="text-sm">
                                            Your invoices will appear here once
                                            you upgrade
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {invoice.date.toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDollarsForDisplayNoDecimals(
                                                            invoice.amount
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            invoice.status ===
                                                            'paid'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {invoice.status}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={
                                                                invoice.downloadUrl
                                                            }
                                                            download
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default BillingPage;
