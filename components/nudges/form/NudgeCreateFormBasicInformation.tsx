'use client';

import { useFormContext } from 'react-hook-form';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CreateNudgeSchemaData } from '@/schemas/nudge';

const NudgeCreateFormBasicInformation = () => {
    const form = useFormContext<CreateNudgeSchemaData>();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Basic Information</CardTitle>
                <CardDescription>
                    Give your nudge a name and description
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">
                                Nudge Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., Weekly Team Update"
                                    className="border-border text-foreground bg-white"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">
                                Description
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="What is this reminder for?"
                                    rows={3}
                                    className="border-border text-foreground resize-none bg-white"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
};

export default NudgeCreateFormBasicInformation;
