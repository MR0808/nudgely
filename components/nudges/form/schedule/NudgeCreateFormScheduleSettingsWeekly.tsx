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
import { DAYS_OF_WEEK } from '@/data/nudgeFrequency';

const NudgeCreateFormScheduleSettingsWeekly = () => {
    const form = useFormContext<CreateNudgeSchemaData>();

    return (
        <div className="space-y-2 p-4 bg-muted rounded-lg border-2 border-primary/30">
            <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-semibold">
                            Day of Week
                        </FormLabel>
                        <Select
                            onValueChange={(value) =>
                                field.onChange(Number.parseInt(value))
                            }
                            value={field.value?.toString() ?? ''}
                        >
                            <FormControl>
                                <SelectTrigger className="border-border text-foreground bg-white w-32">
                                    <SelectValue placeholder="Select a day" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem
                                        key={day.value}
                                        value={day.value.toString()}
                                    >
                                        {day.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};
export default NudgeCreateFormScheduleSettingsWeekly;
