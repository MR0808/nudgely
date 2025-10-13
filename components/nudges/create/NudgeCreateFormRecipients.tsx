'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { X, Plus } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateNudgeSchemaData } from '@/schemas/nudge';

const NudgeCreateFormRecipients = () => {
    const form = useFormContext<CreateNudgeSchemaData>();

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'recipients'
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl text-primary">
                        Recipients
                    </CardTitle>
                    <CardDescription>
                        Who should receive this nudge?
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="flex gap-4 items-start p-4 bg-muted rounded-lg border-2 border-primary/30"
                    >
                        <div className="flex-1 grid sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={`recipients.${index}.firstName`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold">
                                            First Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="John"
                                                className="border-border text-foreground bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`recipients.${index}.email`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                placeholder="john@example.com"
                                                className="border-border text-foreground bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="mt-8 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ firstName: '', email: '' })}
                    className="w-full border-border hover:bg-primary/10 cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                </Button>
            </CardContent>
        </Card>
    );
};
export default NudgeCreateFormRecipients;
