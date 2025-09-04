'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';

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
import { locales, type Locale } from '@/lib/locales';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LocaleField = () => {
    const [open, setOpen] = useState(false);

    const form = useFormContext();

    const groupedLocales = locales.reduce(
        (acc, locale) => {
            if (!acc[locale.region]) {
                acc[locale.region] = [];
            }
            acc[locale.region].push(locale);
            return acc;
        },
        {} as Record<string, Locale[]>
    );

    return (
        <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
                <FormItem className={cn('w-full')}>
                    <FormLabel className="text-card-foreground">
                        Locale *
                    </FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild className="w-full">
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="h-9 w-full justify-between px-6 py-3 text-sm font-normal"
                                >
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 shrink-0 opacity-50" />
                                        {field.value ? (
                                            <span className="truncate">
                                                {field.value}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Select Locale/Language...
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
                                    placeholder="Search Locales/Languages..."
                                    className="h-9 w-full"
                                />
                                <CommandList className="w-full">
                                    <CommandEmpty>
                                        No locale/language found.
                                    </CommandEmpty>
                                    {Object.entries(groupedLocales).map(
                                        ([region, regionLocales]) => (
                                            <CommandGroup
                                                key={region}
                                                heading={region}
                                            >
                                                {regionLocales.map((locale) => (
                                                    <CommandItem
                                                        key={locale.value}
                                                        value={`${locale.label} ${locale.value}`}
                                                        onSelect={() => {
                                                            form.setValue(
                                                                'locale',
                                                                locale.value
                                                            );
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                field.value ===
                                                                    locale.value
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0'
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {locale.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {locale.value}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
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
export default LocaleField;
