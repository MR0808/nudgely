'use client';

import { useFormContext } from 'react-hook-form';

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CompanyOnboardingData } from '@/schemas/onboarding';
import LocationField from '@/components/onboarding/steps/LocationField';
import { LocationProps } from '@/types/onboarding';
import TimezoneField from '@/components/onboarding/steps/TimezoneField';
import LocaleField from '@/components/onboarding/steps/LocaleField';

const AddressStep = ({ countries, regions }: LocationProps) => {
    const form = useFormContext<CompanyOnboardingData>();

    return (
        <div className="space-y-6">
            {/* Address Line 1 */}
            <FormField
                control={form.control}
                name="address1"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Address Line 1 *
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Street address, P.O. box, company name"
                                {...field}
                                className="border-border text-foreground"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Address Line 2 */}
            <FormField
                control={form.control}
                name="address2"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Address Line 2 (Optional)
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Apartment, suite, unit, building, floor, etc."
                                {...field}
                                className="border-border text-foreground"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-card-foreground">
                                City *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="City"
                                    {...field}
                                    className="border-border text-foreground"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-card-foreground">
                                Postal Code *
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="ZIP or Postal Code"
                                    {...field}
                                    className="border-border text-foreground"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <LocationField countries={countries} regions={regions} />
            <div className="flex flex-row gap-x-6 w-full">
                <TimezoneField />
                <LocaleField />
            </div>
        </div>
    );
};

export default AddressStep;
