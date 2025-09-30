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
import BillingInvoices from '@/components/billing/BillingInvoices';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Subscription`;
    const description = 'Change company subscription.';
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

const PricingPage = async () => {
    const userSession = await authCheck('/subscription');
    const { company, userCompany } = await getCompany();
    const { plans } = await getPlans();

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

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-20 p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-balance">
                        Change Your Subscription
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your subscription
                    </p>
                </div>
                <BillingPlanSelection company={company} plans={plans || []} />
            </div>
        </div>
    );
};
export default PricingPage;
