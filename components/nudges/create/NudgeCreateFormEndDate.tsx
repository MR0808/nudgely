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
import { CreateNudgeSchemaData } from '@/schemas/nudge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const NudgeCreateFormEndDate = () => {
    const form = useFormContext<CreateNudgeSchemaData>();
    const endType = form.watch('endType');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">
                        End Date Settings
                    </CardTitle>
                    <CardDescription>
                        When should the nudge stop?
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="endType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem
                                            value="NEVER"
                                            id="never"
                                        />
                                        <FormLabel
                                            htmlFor="never"
                                            className="font-medium cursor-pointer"
                                        >
                                            Never (continues indefinitely)
                                        </FormLabel>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <RadioGroupItem
                                            value="ON_DATE"
                                            id="on-date"
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <FormLabel
                                                htmlFor="on-date"
                                                className="font-medium cursor-pointer"
                                            >
                                                On a specific date
                                            </FormLabel>
                                            {endType === 'ON_DATE' && (
                                                <FormField
                                                    control={form.control}
                                                    name="endDate"
                                                    render={({ field }) => (
                                                        <FormControl>
                                                            <Input
                                                                type="date"
                                                                value={
                                                                    field.value ||
                                                                    ''
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                                className="border-border text-foreground bg-white w-40"
                                                            />
                                                        </FormControl>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <RadioGroupItem
                                            value="AFTER_OCCURRENCES"
                                            id="after-occurrences"
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <FormLabel
                                                htmlFor="after-occurrences"
                                                className="font-medium cursor-pointer"
                                            >
                                                After a number of occurrences
                                            </FormLabel>
                                            {endType ===
                                                'AFTER_OCCURRENCES' && (
                                                <FormField
                                                    control={form.control}
                                                    name="endAfterOccurrences"
                                                    render={({ field }) => (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">
                                                                After
                                                            </span>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={
                                                                        field.value ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        field.onChange(
                                                                            Number.parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ) ||
                                                                                undefined
                                                                        )
                                                                    }
                                                                    className="border-border text-foreground bg-white w-24"
                                                                />
                                                            </FormControl>
                                                            <span className="text-sm text-muted-foreground">
                                                                reminders
                                                            </span>
                                                        </div>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
};
export default NudgeCreateFormEndDate;
