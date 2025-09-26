'use client';

import { Download } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { BillingInvoicesProps } from '@/types/billing';
import { formatDollarsForDisplayNoDecimals } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { downloadAllInvoices } from '@/actions/subscriptions';

const BillingInvoices = ({ invoices, customerId }: BillingInvoicesProps) => {
    const [isPending, startTransition] = useTransition();

    if (!invoices) return null;

    const convertToDate = (created: number) => {
        const date = new Date(created * 1000);
        const formattedDate = date.toLocaleDateString();
        return formattedDate;
    };

    const stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );

    const handleDownload = async () => {
        if (!customerId) {
            toast.error(
                'There was an issue loading the customer portal, please reload the page and try again'
            );
            return;
        }
        startTransition(async () => {
            const stripe = await stripePromise;

            if (!stripe) {
                console.error('Stripe failed to load');
                return;
            }

            // const response = await downloadAllInvoices(customerId);
            const response = await fetch(
                `/api/stripe/invoices/export?customer_id=${encodeURIComponent(customerId)}`
            );
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to download CSV');
            }

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to download CSV');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_invoices.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                        Download your invoices and receipts
                    </CardDescription>
                </div>
                {invoices.data.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={handleDownload}
                        disabled={isPending}
                    >
                        <Download className="h-4 w-4" />
                        {isPending ? 'Downloading...' : 'Export All'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {invoices.data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No billing history</p>
                        <p className="text-sm">
                            Your invoices will appear here once you upgrade
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invoices.data.map((invoice) => {
                            return (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {convertToDate(invoice.created)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDollarsForDisplayNoDecimals(
                                                invoice.amount_paid
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                invoice.status === 'paid'
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
                                                    invoice.invoice_pdf || '#'
                                                }
                                                download
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
export default BillingInvoices;
