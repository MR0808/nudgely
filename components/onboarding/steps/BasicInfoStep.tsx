'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CompanyOnboardingData } from '@/schemas/onboarding';
import ImageUploadField from '@/components/onboarding/steps/ImageUploadField';

const BasicInfoStep = () => {
    const [url, setUrl] = useState('');

    const form = useFormContext<CompanyOnboardingData>();

    return (
        <div className="space-y-6">
            {/* Logo Upload */}
            <FormField
                control={form.control}
                name="logo"
                render={() => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Company Logo (Optional)
                        </FormLabel>
                        <FormControl>
                            <ImageUploadField
                                bucket="logos"
                                name="logo"
                                setUrl={setUrl}
                                url={url}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Company Name */}
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-card-foreground">
                            Company Name *
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Enter your company name"
                                {...field}
                                className="border-border text-foreground"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default BasicInfoStep;
