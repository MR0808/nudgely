'use client';

import { useFormContext } from 'react-hook-form';

import { CreateNudgeSchemaData } from '@/schemas/nudge';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DAYS_OF_WEEK, NTH_OCCURRENCES } from '@/data/nudgeFrequency';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addOrdinalSuffix } from '@/utils/number';

const NudgeCreateFormScheduleSettingsMonthly = () => {
    const form = useFormContext<CreateNudgeSchemaData>();
    const monthlyType = form.watch('monthlyType');

    return (
        <div className="space-y-4 p-4 bg-muted rounded-lg border-2 border-primary/30">
            <FormField
                control={form.control}
                name="monthlyType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="text-base font-semibold">
                            Monthly Schedule Type
                        </FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value ?? ''}
                                className="space-y-3"
                            >
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem
                                        value="DAY_OF_MONTH"
                                        id="day-of-month"
                                        className="mt-1"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <FormLabel
                                            htmlFor="day-of-month"
                                            className="font-medium cursor-pointer"
                                        >
                                            Specific day of the month
                                        </FormLabel>
                                        {monthlyType === 'DAY_OF_MONTH' && (
                                            <FormField
                                                control={form.control}
                                                name="dayOfMonth"
                                                render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max="31"
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        Number.parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) ||
                                                                            undefined
                                                                    )
                                                                }
                                                                className="border-border text-foreground bg-white w-16"
                                                            />
                                                        </FormControl>
                                                        <span className="text-sm text-muted-foreground">
                                                            {`${addOrdinalSuffix(
                                                                form.watch(
                                                                    'dayOfMonth'
                                                                )
                                                            )} `}
                                                            of every month
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                        value="NTH_DAY_OF_WEEK"
                                        id="nth-day"
                                        className="mt-1"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <FormLabel
                                            htmlFor="nth-day"
                                            className="font-medium cursor-pointer"
                                        >
                                            Nth occurrence of a day
                                        </FormLabel>
                                        {monthlyType === 'NTH_DAY_OF_WEEK' && (
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="nthOccurrence"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    field.onChange(
                                                                        Number.parseInt(
                                                                            value
                                                                        )
                                                                    )
                                                                }
                                                                value={
                                                                    field.value?.toString() ??
                                                                    ''
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="border-border text-foreground bg-white w-44">
                                                                        <SelectValue placeholder="Select occurrence" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {NTH_OCCURRENCES.map(
                                                                        (
                                                                            nth
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    nth.value
                                                                                }
                                                                                value={nth.value.toString()}
                                                                            >
                                                                                {
                                                                                    nth.label
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="dayOfWeekForMonthly"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    field.onChange(
                                                                        Number.parseInt(
                                                                            value
                                                                        )
                                                                    )
                                                                }
                                                                value={
                                                                    field.value?.toString() ??
                                                                    ''
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="border-border text-foreground bg-white w-44">
                                                                        <SelectValue placeholder="Select day" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {DAYS_OF_WEEK.map(
                                                                        (
                                                                            day
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    day.value
                                                                                }
                                                                                value={day.value.toString()}
                                                                            >
                                                                                {
                                                                                    day.label
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};
export default NudgeCreateFormScheduleSettingsMonthly;
