'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Country, Region } from '@/generated/prisma/client';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';

import { Button } from '@/components/ui/button';
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

import { SubmitButton } from '@/components/form/Buttons';
import FormError from '@/components/form/FormError';
import { LocationSchema } from '@/schemas/account';
import { cn } from '@/lib/utils';
import { LocationProps } from '@/types/account';
import {
    getCountryById,
    getRegionById,
    getRegionsByCountry
} from '@/lib/location';
import { authClient, useSession } from '@/lib/auth-client';
import { logAccountUpdated } from '@/actions/audit/audit-account';

const LocationForm = ({
    regionProp,
    countryProp,
    countries,
    regions,
    initialValueProp,
    userSession
}: LocationProps) => {
    const { refetch } = useSession();
    const [edit, setEdit] = useState(false);
    const [initialValue, setInitialValue] = useState(initialValueProp);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();
    const [country, setCountry] = useState(countryProp);
    const [region, setRegion] = useState(regionProp);
    const [countriesList, setCountriesList] = useState<Country[]>(countries);
    const [regionsList, setRegionsList] = useState<Region[]>(regions);
    const [openCountry, setOpenCountry] = useState(false);
    const [openRegion, setOpenRegion] = useState(false);

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof LocationSchema>>({
        resolver: zodResolver(LocationSchema),
        defaultValues: {
            region: region?.id || '',
            country: country?.id || ''
        }
    });

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const result = await getRegionsByCountry(
                    form.getValues('country')
                );
                form.setValue('region', '');
                setRegionsList(result!);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchRegions();
    }, [form.watch('country')]);

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof LocationSchema>) => {
        startTransition(async () => {
            const regionSet = values.region ? values.region : null;
            await authClient.updateUser({
                countryId: values.country,
                regionId: regionSet,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        const countryDb = await getCountryById(values.country);
                        const regionDb = values.region
                            ? await getRegionById(values.region)
                            : undefined;
                        setCountry(countryDb!);
                        setRegion(regionDb!);
                        setInitialValue(true);
                        if (userSession)
                            await logAccountUpdated(
                                userSession?.user.id,
                                'user.location_updated',
                                ['region', 'country'],
                                {
                                    updatedFields: {
                                        region: regionDb,
                                        country: countryDb
                                    }
                                }
                            );
                        refetch();
                        setEdit(false);
                        toast.success('Location successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

    return (
        <div className="mt-8 border-b border-b-gray-200 pb-8">
            <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="text-base font-semibold">Location</h3>
                    <div
                        className="cursor-pointer text-base font-normal hover:underline"
                        onClick={cancel}
                    >
                        {edit ? 'Cancel' : 'Edit'}
                    </div>
                </div>
                {edit ? (
                    <Form {...form}>
                        <FormError message={error} />
                        <form
                            className="w-full space-y-6"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <div className="flex flex-row gap-x-6">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <Popover
                                                open={openCountry}
                                                onOpenChange={setOpenCountry}
                                            >
                                                <PopoverTrigger
                                                    asChild
                                                    className="w-full"
                                                >
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={
                                                                openCountry
                                                            }
                                                            className="h-12 w-full justify-between rounded-xl px-6 py-3 text-sm font-normal"
                                                        >
                                                            {field.value
                                                                ? countriesList.find(
                                                                      (
                                                                          country
                                                                      ) =>
                                                                          country.id ===
                                                                          field.value
                                                                  )?.name
                                                                : 'Select Country...'}
                                                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command
                                                        className="w-full"
                                                        filter={(
                                                            value,
                                                            search
                                                        ) => {
                                                            const item =
                                                                countriesList.find(
                                                                    (item) =>
                                                                        item.id.toString() ===
                                                                        value
                                                                );
                                                            if (!item) return 0;
                                                            if (
                                                                item.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        search.toLowerCase()
                                                                    )
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
                                                                No country
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup className="w-full">
                                                                {countriesList.map(
                                                                    (
                                                                        country
                                                                    ) => (
                                                                        <CommandItem
                                                                            className="w-full"
                                                                            key={
                                                                                country.id
                                                                            }
                                                                            value={country.id.toString()}
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    'country',
                                                                                    country.id
                                                                                );
                                                                                setOpenCountry(
                                                                                    false
                                                                                );
                                                                            }}
                                                                        >
                                                                            {
                                                                                country.name
                                                                            }
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
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage
                                                className={errorClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="region"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <Popover
                                                open={openRegion}
                                                onOpenChange={setOpenRegion}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={
                                                                openRegion
                                                            }
                                                            className="h-12 w-full justify-between rounded-xl px-6 py-3 text-sm font-normal"
                                                        >
                                                            {field.value &&
                                                            field.value !== ''
                                                                ? regionsList.find(
                                                                      (
                                                                          region
                                                                      ) =>
                                                                          region.id ===
                                                                          field.value
                                                                  )?.name
                                                                : 'Select State...'}
                                                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command
                                                        filter={(
                                                            value,
                                                            search
                                                        ) => {
                                                            const item =
                                                                regionsList.find(
                                                                    (item) =>
                                                                        item.id.toString() ===
                                                                        value
                                                                );
                                                            if (!item) return 0;
                                                            if (
                                                                item.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        search.toLowerCase()
                                                                    )
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
                                                                No states found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {regionsList.map(
                                                                    (
                                                                        region
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                region.id
                                                                            }
                                                                            value={region.id.toString()}
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    'region',
                                                                                    region.id
                                                                                );
                                                                                setOpenRegion(
                                                                                    false
                                                                                );
                                                                            }}
                                                                        >
                                                                            {
                                                                                region.name
                                                                            }
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
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage
                                                className={errorClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <SubmitButton
                                    text="update"
                                    isPending={isPending}
                                />
                            </div>
                        </form>
                    </Form>
                ) : (
                    <div
                        className={`${!initialValue && 'italic'} text-base font-normal`}
                    >
                        {initialValue
                            ? region
                                ? `${region.name}, ${country?.name}`
                                : country?.name
                            : 'Not specified'}
                    </div>
                )}
            </div>
        </div>
    );
};
export default LocationForm;

