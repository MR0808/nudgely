'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Check, ChevronsUpDown, Clock } from 'lucide-react';

import { CreateNudgeSchemaData } from '@/schemas/nudge';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { timezones, type Timezone } from '@/lib/timezones';
import { cn } from '@/lib/utils';

const NudgeCreateFormScheduleSettingsTimezone = () => {
    const [openTimezone, setOpenTimezone] = useState(false);

    const form = useFormContext<CreateNudgeSchemaData>();

    const groupedTimezones = timezones.reduce(
        (acc, timezone) => {
            if (!acc[timezone.region]) {
                acc[timezone.region] = [];
            }
            acc[timezone.region].push(timezone);
            return acc;
        },
        {} as Record<string, Timezone[]>
    );

    return (
        <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-base font-semibold">
                        Timezone
                    </FormLabel>
                    <Popover open={openTimezone} onOpenChange={setOpenTimezone}>
                        <PopoverTrigger asChild className="w-full">
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openTimezone}
                                    className="h-9 w-full justify-between px-6 py-3 text-sm font-normal bg-white"
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 shrink-0 opacity-50" />
                                        {field.value ? (
                                            <span className="truncate">
                                                {field.value}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Select Timezone...
                                            </span>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command className="w-full">
                                <CommandInput
                                    placeholder="Search Timezones..."
                                    className="h-9 w-full"
                                />
                                <CommandList className="w-full">
                                    <CommandEmpty>
                                        No timezone found.
                                    </CommandEmpty>
                                    {Object.entries(groupedTimezones).map(
                                        ([region, regionTimezones]) => (
                                            <CommandGroup
                                                key={region}
                                                heading={region}
                                            >
                                                {regionTimezones.map(
                                                    (timezone) => (
                                                        <CommandItem
                                                            key={timezone.value}
                                                            value={`${timezone.label} ${timezone.value}`}
                                                            onSelect={() => {
                                                                form.setValue(
                                                                    'timezone',
                                                                    timezone.value
                                                                );
                                                                setOpenTimezone(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    field.value ===
                                                                        timezone.value
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {
                                                                        timezone.label
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        timezone.value
                                                                    }
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    )
                                                )}
                                            </CommandGroup>
                                        )
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
export default NudgeCreateFormScheduleSettingsTimezone;
