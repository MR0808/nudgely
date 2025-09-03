'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { Company, EditCompanyDialogProps } from '@/types/company';
import { EditCompanySchema } from '@/schemas/company';

const EditCompanyDialog = ({
    open,
    onOpenChange,
    company
}: EditCompanyDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof EditCompanySchema>>({
        resolver: zodResolver(EditCompanySchema),
        defaultValues: {
            name: company.name,
            contactPhone: company.contactPhone || '',
            address1: company.address1 || '',
            address2: company.address2 || '',
            city: company.city || '',
            region: company.regionId || '',
            country: company.countryId || '',
            postalCode: company.postalCode || '',
            website: company.website || '',
            industry: company.industryId || '',
            companySize: company.companySizeId || ''
        }
    });

    const onSubmit = (values: z.infer<typeof EditCompanySchema>) => {
        startTransition(async () => {
            // const info = getDateTime();
            // if (info) {
            //     const newValues = { ...values, date: info.startDateTime };
            //     const data = await createEvent(newValues);
            //     if (!data.success) {
            //         toast.error(
            //             'There was an error creating your event, please try again'
            //         );
            //     }
            //     if (data.success && data.data) {
            //         if (userSession)
            //             await logEventCreated(userSession?.user.id, {
            //                 eventId: data.data.id,
            //                 eventName: data.data.title,
            //                 eventDate: data.data.date
            //             });
            //         toast.success('Event successfully created');
            //         router.push(`/event/${data.data.slug}`);
            //     }
            // } else {
            //     toast.error(
            //         'There was an error creating your event, please try again'
            //     );
            // }
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
                            {/* Company Name */}
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
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            {/* <div className="space-y-2">
                                <Label htmlFor="address">Street Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'address',
                                            e.target.value
                                        )
                                    }
                                    placeholder="123 Business Ave, Suite 100"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City, State, ZIP</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'city',
                                            e.target.value
                                        )
                                    }
                                    placeholder="San Francisco, CA 94105"
                                />
                            </div> */}

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

                            {/* Company Details */}
                            {/* <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        value={formData.industry}
                                        onValueChange={(value) =>
                                            handleInputChange('industry', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technology">
                                                Technology
                                            </SelectItem>
                                            <SelectItem value="Healthcare">
                                                Healthcare
                                            </SelectItem>
                                            <SelectItem value="Finance">
                                                Finance
                                            </SelectItem>
                                            <SelectItem value="Education">
                                                Education
                                            </SelectItem>
                                            <SelectItem value="Retail">
                                                Retail
                                            </SelectItem>
                                            <SelectItem value="Manufacturing">
                                                Manufacturing
                                            </SelectItem>
                                            <SelectItem value="Consulting">
                                                Consulting
                                            </SelectItem>
                                            <SelectItem value="Other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="size">Company Size</Label>
                                    <Select
                                        value={formData.size}
                                        onValueChange={(value) =>
                                            handleInputChange('size', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-10 employees">
                                                1-10 employees
                                            </SelectItem>
                                            <SelectItem value="11-50 employees">
                                                11-50 employees
                                            </SelectItem>
                                            <SelectItem value="51-200 employees">
                                                51-200 employees
                                            </SelectItem>
                                            <SelectItem value="201-500 employees">
                                                201-500 employees
                                            </SelectItem>
                                            <SelectItem value="501-1000 employees">
                                                501-1000 employees
                                            </SelectItem>
                                            <SelectItem value="1000+ employees">
                                                1000+ employees
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> 
                            </div>*/}
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
