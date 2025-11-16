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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CreateNudgeSchemaData } from '@/schemas/nudge';
import { HOURS } from '@/data/nudgeFrequency';
import NudgeCreateFormScheduleSettingsWeekly from '@/components/nudges/form/schedule/NudgeCreateFormScheduleSettingsWeekly';
import NudgeCreateFormScheduleSettingsMonthly from '@/components/nudges/form/schedule/NudgeCreateFormScheduleSettingsMonthly';
import NudgeCreateFormScheduleSettingsTimezone from '@/components/nudges/form/schedule/NudgeCreateFormScheduleSettingsTimezone';

const NudgeCreateFormScheduleSettings = () => {
    const form = useFormContext<CreateNudgeSchemaData>();

    const frequency = form.watch('frequency');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">
                        Schedule Settings
                    </CardTitle>
                    <CardDescription>
                        Configure when the nudge should be sent
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">
                                    Frequency
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="border-border text-foreground bg-white w-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DAILY">
                                            Daily
                                        </SelectItem>
                                        <SelectItem value="WEEKLY">
                                            Weekly
                                        </SelectItem>
                                        <SelectItem value="MONTHLY">
                                            Monthly
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="interval"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">
                                    Interval
                                </FormLabel>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                        Every
                                    </span>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={field.value || 1}
                                            onChange={(e) =>
                                                field.onChange(
                                                    Number.parseInt(
                                                        e.target.value
                                                    ) || 1
                                                )
                                            }
                                            className="border-border text-foreground bg-white w-24"
                                        />
                                    </FormControl>
                                    <span className="text-muted-foreground">
                                        {frequency === 'DAILY' && 'day(s)'}
                                        {frequency === 'WEEKLY' && 'week(s)'}
                                        {frequency === 'MONTHLY' && 'month(s)'}
                                    </span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Weekly Options */}
                {frequency === 'WEEKLY' && (
                    <NudgeCreateFormScheduleSettingsWeekly />
                )}

                {/* Monthly Options */}
                {frequency === 'MONTHLY' && (
                    <NudgeCreateFormScheduleSettingsMonthly />
                )}

                {/* Time and Timezone */}
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="timeOfDay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">
                                    Time of Day
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Select
                                        value={
                                            field.value?.split(':')[0] || '9'
                                        }
                                        onValueChange={(hour) => {
                                            const currentTime =
                                                field.value || '9:00 AM';
                                            const period = currentTime.includes(
                                                'AM'
                                            )
                                                ? 'AM'
                                                : 'PM';
                                            field.onChange(
                                                `${hour}:00 ${period}`
                                            );
                                        }}
                                        disabled
                                    >
                                        <FormControl>
                                            <SelectTrigger className="border-border text-foreground bg-white w-24">
                                                <SelectValue placeholder="Hour" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {HOURS.map((hour) => (
                                                <SelectItem
                                                    key={hour.value}
                                                    value={hour.value.toString()}
                                                >
                                                    {hour.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={
                                            field.value?.includes('AM')
                                                ? 'AM'
                                                : 'PM'
                                        }
                                        onValueChange={(period) => {
                                            const currentTime =
                                                field.value || '9:00 AM';
                                            const hour =
                                                currentTime.split(':')[0];
                                            field.onChange(
                                                `${hour}:00 ${period}`
                                            );
                                        }}
                                        disabled
                                    >
                                        <FormControl>
                                            <SelectTrigger className="border-border text-foreground bg-white w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="AM">
                                                AM
                                            </SelectItem>
                                            <SelectItem value="PM">
                                                PM
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <NudgeCreateFormScheduleSettingsTimezone />
                </div>
            </CardContent>
        </Card>
    );
};

export default NudgeCreateFormScheduleSettings;
