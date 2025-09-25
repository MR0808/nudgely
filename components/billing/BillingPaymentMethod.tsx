'use client';

import { CreditCard, House } from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { BillingPaymentMethodProps } from '@/types/billing';
import { Button } from '@/components/ui/button';

const BillingPaymentMethod = ({ payment }: BillingPaymentMethodProps) => {
    if (!payment) return null;

    function countryDisplay(countryCode: string) {
        const regionNames = new Intl.DisplayNames(['en'], {
            type: 'region'
        });
        const countryName = regionNames.of(countryCode);

        return countryName;
    }

    const handleRedirectToPortal = async () => {
        setLoading(true);
        try {
            // Replace with the actual customer ID (e.g., from your auth system or database)
            const customerId = 'cus_12345'; // Example customer ID

            const response = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customerId })
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to the Stripe Customer Portal
                window.location.href = data.url;
            } else {
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error redirecting to portal:', error);
        } finally {
            setLoading(false);
        }
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
                        <Button variant="outline" size="sm">
                            Update Payment Method
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
