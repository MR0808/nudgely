'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Country } from 'react-phone-number-input';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { EditCompanyDialogProps } from '@/types/company';
import { EditCompanySchema } from '@/schemas/company';
import LocaleField from '@/components/onboarding/steps/LocaleField';
import LocationField from '@/components/onboarding/steps/LocationField';
import { Separator } from '@/components/ui/separator';
import TimezoneField from '@/components/onboarding/steps/TimezoneField';
import { PhoneInput } from '@/components/ui/phone-input';
import { updateCompany } from '@/actions/company';
import { logCompanyUpdated } from '@/actions/audit/audit-company';

const EditCompanyDialog = ({
    open,
    onOpenChange,
    company,
    countries,
    regions,
    companySizes,
    industries,
    userSession
}: EditCompanyDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof EditCompanySchema>>({
        resolver: zodResolver(EditCompanySchema),
        defaultValues: {
            name: company.name,
            contactEmail: company.contactEmail || '',
            contactPhone: company.contactPhone || '',
            address1: company.address1 || '',
            address2: company.address2 || '',
            city: company.city || '',
            region: company.regionId || '',
            country: company.countryId || '',
            postalCode: company.postalCode || '',
            website: company.website || '',
            industry: company.industryId || '',
            companySize: company.companySizeId || '',
            timezone: company.timezone || '',
            locale: company.locale || ''
        }
    });

    let countryCode = 'AU';
    if (company.country) countryCode = company.country.isoCode;

    const onSubmit = (values: z.infer<typeof EditCompanySchema>) => {
        startTransition(async () => {
            const data = await updateCompany(values);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                if (userSession) {
                    await logCompanyUpdated(userSession.user.id, {
                        companyId: data.data.id
                    });
                }
                onOpenChange(false);
                toast.success('Team successfully created');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Edit Company Details
                    </DialogTitle>
                    <DialogDescription>
                        Update your company information and settings. Changes
                        will be reflected across all teams.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Company Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
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
                            </div>

                            <div className="space-y-2">
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
                            </div>

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
                            <LocationField
                                countries={countries}
                                regions={regions}
                            />
                            <Separator />
                            {/* Contact Information */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="contactEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Email *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="contactPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Phone Number *
                                                </FormLabel>
                                                <FormControl>
                                                    <PhoneInput
                                                        {...field}
                                                        defaultCountry={
                                                            countryCode as Country
                                                        }
                                                        placeholder="Enter a phone number"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TimezoneField />
                                <LocaleField />
                            </div>
                            <Separator />

                            {/* Company Details */}
                            <div className="space-y-2">
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
                                                    {companySizes.map(
                                                        (size) => (
                                                            <SelectItem
                                                                key={size.id}
                                                                value={size.id}
                                                            >
                                                                <span className="font-bold">
                                                                    {size.name}
                                                                </span>{' '}
                                                                ({size.size})
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
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
                                                    {industries.map(
                                                        (industry) => (
                                                            <SelectItem
                                                                key={
                                                                    industry.id
                                                                }
                                                                value={
                                                                    industry.id
                                                                }
                                                            >
                                                                {industry.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EditCompanyDialog;
