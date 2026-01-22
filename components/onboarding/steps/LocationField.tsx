'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Country, Region } from '@/generated/prisma/client';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import { getRegionsByCountry } from '@/lib/location';
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
    CommandList,
    CommandItem
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { LocationProps } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CompanyOnboardingData } from '@/schemas/onboarding';

const LocationField = ({ countries, regions }: LocationProps) => {
    const [countriesList, setCountriesList] = useState<Country[]>(countries);
    const [regionsList, setStatesList] = useState<Region[]>(regions);
    const [openCountry, setOpenCountry] = useState(false);
    const [openState, setOpenState] = useState(false);
    const form = useFormContext<CompanyOnboardingData>();

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const result = await getRegionsByCountry(
                    form.getValues('country')
                );
                if (!result || result.length === 0) {
                    form.setValue('region', 'blank');
                } else {
                    const region = form.getValues('region');
                    const hasId = result.some((item) => item.id === region);
                    if (!hasId) form.setValue('region', '');
                }
                setStatesList(result!);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchStates();
    }, [form.watch('country')]);

    return (
        <div className="flex flex-row gap-x-6 w-full">
            <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                    <FormItem className={cn('w-full')}>
                        <FormLabel>Country *</FormLabel>
                        <Popover
                            open={openCountry}
                            onOpenChange={setOpenCountry}
                        >
                            <PopoverTrigger asChild className="w-full">
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCountry}
                                        className="h-9 w-full justify-between px-6 py-3 text-sm font-normal"
                                    >
                                        {field.value
                                            ? countriesList.find(
                                                  (country) =>
                                                      country.id === field.value
                                              )?.name
                                            : 'Select Country...'}
                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command
                                    className="w-full"
                                    filter={(value, search) => {
                                        const item = countriesList.find(
                                            (item) =>
                                                item.id.toString() === value
                                        );
                                        if (!item) return 0;
                                        if (
                                            item.name
                                                .toLowerCase()
                                                .includes(search.toLowerCase())
                                        )
                                            return 1;

                                        return 0;
                                    }}
                                >
                                    <CommandInput
                                        placeholder="Search Country..."
                                        className="h-9 w-full"
                                    />
                                    <CommandList className="w-full">
                                        <CommandEmpty className="w-full">
                                            No country found.
                                        </CommandEmpty>
                                        <CommandGroup className="w-full">
                                            {countriesList.map((country) => (
                                                <CommandItem
                                                    className="w-full"
                                                    key={country.id}
                                                    value={country.id.toString()}
                                                    onSelect={() => {
                                                        form.setValue(
                                                            'country',
                                                            country.id
                                                        );
                                                        setOpenCountry(false);
                                                    }}
                                                >
                                                    {country.name}
                                                    <CheckIcon
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            country.id ===
                                                                field.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                    <FormItem className={cn('w-full')}>
                        <FormLabel>State *</FormLabel>
                        <Popover open={openState} onOpenChange={setOpenState}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openState}
                                        className="h-9 w-full justify-between px-6 py-3 text-sm font-normal"
                                    >
                                        {field.value &&
                                        field.value !== '' &&
                                        field.value !== 'blank'
                                            ? regionsList.find(
                                                  (region) =>
                                                      region.id === field.value
                                              )?.name
                                            : 'Select State...'}
                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command
                                    filter={(value, search) => {
                                        const item = regionsList.find(
                                            (item) =>
                                                item.id.toString() === value
                                        );
                                        if (!item) return 0;
                                        if (
                                            item.name
                                                .toLowerCase()
                                                .includes(search.toLowerCase())
                                        )
                                            return 1;

                                        return 0;
                                    }}
                                >
                                    <CommandInput
                                        placeholder="Search State..."
                                        className="h-9"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            No regions found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {regionsList.map((region) => (
                                                <CommandItem
                                                    key={region.id}
                                                    value={region.id.toString()}
                                                    onSelect={() => {
                                                        form.setValue(
                                                            'region',
                                                            region.id
                                                        );
                                                        setOpenState(false);
                                                    }}
                                                >
                                                    {region.name}
                                                    <CheckIcon
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            region.id ===
                                                                field.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};
export default LocationField;

