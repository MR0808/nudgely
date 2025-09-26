'use client';

import { CreditCard, House } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useTransition } from 'react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { BillingPaymentMethodProps } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPortalSession } from '@/actions/subscriptions';

const BillingPaymentMethod = ({
    payment,
    customerId
}: BillingPaymentMethodProps) => {
    const [isPending, startTransition] = useTransition();

    if (!payment) return null;

    function countryDisplay(countryCode: string) {
        const regionNames = new Intl.DisplayNames(['en'], {
            type: 'region'
        });
        const countryName = regionNames.of(countryCode);

        return countryName;
    }

    const stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );

    const handleRedirectToPortal = async () => {
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

            const response = await createPortalSession(customerId);

            if (response.error) {
                const errorData = response.error;
                console.error('API Error:', errorData);
                return;
            }

            if (response.url) {
                // Redirect to the Stripe Customer Portal
                window.location.href = response.url;
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                </CardTitle>
                <CardDescription>
                    Manage your payment information
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between ">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    •••• •••• •••• {payment.card?.last4}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {`Expires ${payment.card?.exp_month.toString().padStart(2, '0')}/${payment.card?.exp_year.toString().slice(-2)}`}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRedirectToPortal}
                            disabled={isPending}
                            className="cursor-pointer"
                        >
                            {isPending ? 'Loading...' : 'Manage Subscription'}
                        </Button>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <House className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Billing Address</p>
                            <p className="text-sm text-muted-foreground">
                                {payment.address?.line1}
                            </p>
                            {payment.address?.line2 && (
                                <p className="text-sm text-muted-foreground">
                                    {payment.address?.line2}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {`${payment.address?.city}, ${
                                    payment.address?.state
                                }, ${countryDisplay(
                                    payment.address?.country || 'AU'
                                )}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {payment.address?.postal_code}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default BillingPaymentMethod;
