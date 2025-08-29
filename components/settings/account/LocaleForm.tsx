'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';

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
import { LocaleSchema } from '@/schemas/account';
import { cn } from '@/lib/utils';
import { SessionProps } from '@/types/session';
import { authClient, useSession } from '@/lib/auth-client';
import { logAccountUpdated } from '@/actions/audit/audit-account';
import { findLocaleByValue, locales, type Locale } from '@/lib/locales';

const LocaleForm = ({ userSession }: SessionProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [locale, setLocale] = useState<Locale | null>(null);

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
            if (currentUser.user.locale) {
                const userLocale = findLocaleByValue(currentUser.user.locale);
                if (userLocale) setLocale(userLocale);
            }
        }
    }, [currentUser]);

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof LocaleSchema>>({
        resolver: zodResolver(LocaleSchema),
        defaultValues: {
            locale: user?.locale || ''
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof LocaleSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                locale: values.locale,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        refetch();
                        if (user && user.id)
                            await logAccountUpdated(
                                user.id,
                                'user.locale_updated',
                                ['locale'],
                                {
                                    updatedFields: {
                                        locale: values.locale
                                    }
                                }
                            );
                        setEdit(false);
                        toast.success('Locale/Language successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

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
        <div className="mt-8 border-b border-b-gray-200 pb-8">
            <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="text-base font-semibold">Locale/Language</h3>
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
                            className="md:w-1/2 space-y-6"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <div className="flex flex-row gap-x-6">
                                <FormField
                                    control={form.control}
                                    name="locale"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <Popover
                                                open={open}
                                                onOpenChange={setOpen}
                                            >
                                                <PopoverTrigger
                                                    asChild
                                                    className="w-full"
                                                >
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={open}
                                                            className="h-12 w-full justify-between rounded-xl px-6 py-3 text-sm font-normal"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="h-4 w-4 shrink-0 opacity-50" />
                                                                {field.value ? (
                                                                    <span className="truncate">
                                                                        {
                                                                            field.value
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">
                                                                        Select
                                                                        Locale/Language...
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
                                                                No
                                                                locale/language
                                                                found.
                                                            </CommandEmpty>
                                                            {Object.entries(
                                                                groupedLocales
                                                            ).map(
                                                                ([
                                                                    region,
                                                                    regionLocales
                                                                ]) => (
                                                                    <CommandGroup
                                                                        key={
                                                                            region
                                                                        }
                                                                        heading={
                                                                            region
                                                                        }
                                                                    >
                                                                        {regionLocales.map(
                                                                            (
                                                                                locale
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        locale.value
                                                                                    }
                                                                                    value={`${locale.label} ${locale.value}`}
                                                                                    onSelect={() => {
                                                                                        form.setValue(
                                                                                            'locale',
                                                                                            locale.value
                                                                                        );
                                                                                        setOpen(
                                                                                            false
                                                                                        );
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
                                                                                            {
                                                                                                locale.label
                                                                                            }
                                                                                        </span>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {
                                                                                                locale.value
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
                        className={`${
                            !locale && 'italic'
                        } text-base font-normal`}
                    >
                        {locale ? (
                            <div className="flex flex-col">
                                <div className="font-medium">
                                    {locale.label}
                                </div>
                                <div>{locale.value}</div>
                            </div>
                        ) : (
                            'Not specified'
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default LocaleForm;
