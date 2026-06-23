import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function PaymentPastDueBanner({
    subscriptionStatus
}: {
    subscriptionStatus: string | null | undefined;
}) {
    if (
        subscriptionStatus !== 'past_due' &&
        subscriptionStatus !== 'unpaid'
    ) {
        return null;
    }

    const isUnpaid = subscriptionStatus === 'unpaid';

    return (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
                {isUnpaid ? 'Subscription unpaid' : 'Payment failed'}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                    {isUnpaid
                        ? 'Your subscription is unpaid. Update your payment method to restore full access.'
                        : 'Your last payment failed. Stripe will retry automatically — please update your card to avoid interruption.'}
                </span>
                <Button asChild size="sm" variant="secondary" className="shrink-0">
                    <Link href="/billing">Update billing</Link>
                </Button>
            </AlertDescription>
        </Alert>
    );
}
