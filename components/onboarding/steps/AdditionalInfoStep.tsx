'use client';

import { useFormContext } from 'react-hook-form';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import type { CompanyOnboardingData } from '@/schemas/onboarding';
import { CompanySize, Industry } from '@/generated/prisma/client';

const AdditionalInfoStep = ({
    companySizes,
    industries
}: {
    companySizes: CompanySize[];
    industries: Industry[];
}) => {
    const form = useFormContext<CompanyOnboardingData>();

    return (
        <div className="space-y-6">
            {/* Website */}
            <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Website (Optional)
                        </FormLabel>
                        <FormControl>
                            <Input
                                type="url"
                                placeholder="https://www.yourcompany.com"
                                {...field}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (value && !/^https?:\/\//i.test(value)) {
                                        field.onChange(`https://${value}`);
                                    }
                                }}
                                className="border-border text-foreground"
                            />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                            Your company&apos;s website URL
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Company Size */}
            <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Company Size (Optional)
                        </FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                                <SelectTrigger className="w-full border-border text-foreground">
                                    <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {companySizes.map((size) => (
                                    <SelectItem key={size.id} value={size.id}>
                                        <span className="font-bold">
                                            {size.name}
                                        </span>{' '}
                                        ({size.size})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-muted-foreground">
                            This helps us tailor our service to your needs
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Industry */}
            <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Industry (Optional)
                        </FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                                <SelectTrigger className="w-full border-border text-foreground">
                                    <SelectValue placeholder="Select your industry" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {industries.map((industry) => (
                                    <SelectItem
                                        key={industry.id}
                                        value={industry.id}
                                    >
                                        {industry.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-muted-foreground">
                            Help us understand your business better
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default AdditionalInfoStep;

