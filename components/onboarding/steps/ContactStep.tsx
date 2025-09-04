'use client';

import { useFormContext } from 'react-hook-form';
import { Country } from 'react-phone-number-input';
import { Country as CountryDb } from '@/generated/prisma';

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CompanyOnboardingData } from '@/schemas/onboarding';
import { PhoneInput } from '@/components/ui/phone-input';

const ContactStep = ({ defaultCountry }: { defaultCountry: CountryDb }) => {
    const form = useFormContext<CompanyOnboardingData>();

    return (
        <div className="space-y-6">
            {/* Contact Email */}
            <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Contact Email *
                        </FormLabel>
                        <FormControl>
                            <Input
                                type="email"
                                placeholder="contact@yourcompany.com"
                                {...field}
                                className="border-border text-foreground"
                            />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                            This email will be used for important notifications
                            and billing
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Contact Phone */}
            <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Contact Phone *
                        </FormLabel>
                        <FormControl>
                            {/* <Input
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                {...field}
                                className=" border-border text-foreground"
                            /> */}
                            <PhoneInput
                                {...field}
                                defaultCountry={
                                    defaultCountry.isoCode as Country
                                }
                                placeholder="Enter a phone number"
                            />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                            Include country code for international numbers
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default ContactStep;
