'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Clock } from 'lucide-react';

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
import { TimezoneSchema } from '@/schemas/account';
import { cn } from '@/lib/utils';
import { SessionProps } from '@/types/session';
import { authClient, useSession } from '@/lib/auth-client';
import { logAccountUpdated } from '@/actions/audit/audit-account';
import { timezones, type Timezone } from '@/lib/timezones';

const TimezoneForm = ({ userSession }: SessionProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
        }
    }, [currentUser]);

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof TimezoneSchema>>({
        resolver: zodResolver(TimezoneSchema),
        defaultValues: {
            timezone: user?.timezone || ''
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof TimezoneSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                timezone: values.timezone,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        refetch();
                        if (user && user.id)
                            await logAccountUpdated(
                                user.id,
                                'user.timezone_updated',
                                ['timezone'],
                                {
                                    updatedFields: {
                                        timezone: values.timezone
                                    }
                                }
                            );
                        setEdit(false);
                        toast.success('Timezone successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

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
        <div className="mt-8 border-b border-b-gray-200 pb-8">
            <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="text-base font-semibold">Timezone</h3>
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
                                    name="timezone"
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
                                                                <Clock className="h-4 w-4 shrink-0 opacity-50" />
                                                                {field.value ? (
                                                                    <span className="truncate">
                                                                        {
                                                                            field.value
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">
                                                                        Select
                                                                        Timezone...
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command
                                                        className="w-full"
                                                        // filter={(
                                                        //     value,
                                                        //     search
                                                        // ) => {
                                                        //     const item =
                                                        //         timezones.find(
                                                        //             (item) =>
                                                        //                 item.value.toString() ===
                                                        //                 value
                                                        //         );
                                                        //     if (!item) return 0;
                                                        //     if (
                                                        //         item.label
                                                        //             .toLowerCase()
                                                        //             .includes(
                                                        //                 search.toLowerCase()
                                                        //             )
                                                        //     )
                                                        //         return 1;

                                                        //     return 0;
                                                        // }}
                                                    >
                                                        <CommandInput
                                                            placeholder="Search Timezones..."
                                                            className="h-9 w-full"
                                                        />
                                                        <CommandList className="w-full">
                                                            <CommandEmpty>
                                                                No timezone
                                                                found.
                                                            </CommandEmpty>
                                                            {Object.entries(
                                                                groupedTimezones
                                                            ).map(
                                                                ([
                                                                    region,
                                                                    regionTimezones
                                                                ]) => (
                                                                    <CommandGroup
                                                                        key={
                                                                            region
                                                                        }
                                                                        heading={
                                                                            region
                                                                        }
                                                                    >
                                                                        {regionTimezones.map(
                                                                            (
                                                                                timezone
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        timezone.value
                                                                                    }
                                                                                    value={`${timezone.label} ${timezone.value}`}
                                                                                    onSelect={() => {
                                                                                        form.setValue(
                                                                                            'timezone',
                                                                                            timezone.value
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
                            !user?.timezone && 'italic'
                        } text-base font-normal`}
                    >
                        {user?.timezone ? `${user.timezone}` : 'Not specified'}
                    </div>
                )}
            </div>
        </div>
    );
};
export default TimezoneForm;
