'use client';

import * as z from 'zod';
import { format, sub, getMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { enAU } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { authClient, useSession } from '@/lib/auth-client';
import { SubmitButton } from '@/components/Form/Buttons';
import FormError from '@/components/Form/FormError';
import { DateOfBirthSchema } from '@/schemas/personal';
import { DateOfBirthProps } from '@/types/personal';
import { cn } from '@/lib/utils';
import { logPersonalUpdated } from '@/actions/audit/audit-personal';

const DateOfBirthForm = ({
    dateOfBirthProp,
    userSession
}: DateOfBirthProps) => {
    const { refetch } = useSession();
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | null>(dateOfBirthProp || null);
    const endYear = sub(new Date(), {
        years: 18
    }).getFullYear();
    const currentMonth = getMonth(new Date());

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof DateOfBirthSchema>>({
        resolver: zodResolver(DateOfBirthSchema),
        defaultValues: {
            dateOfBirth: date || undefined
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof DateOfBirthSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                dateOfBirth: values.dateOfBirth,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async (ctx) => {
                        setDate(values.dateOfBirth);
                        if (userSession)
                            await logPersonalUpdated(
                                userSession?.user.id,
                                'user.dateofbirth_updated',
                                ['dateofbirth'],
                                {
                                    updatedFields: {
                                        dateofbirth: values.dateOfBirth
                                    }
                                }
                            );
                        refetch();
                        setEdit(false);
                        toast.success('Date of birth successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

    return (
        <div className="mt-8">
            <div className="w-full md:w-3/5 flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="font-semibold text-base">
                        Date of Birth (must be over 18)
                    </h3>
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
                            className="space-y-6 w-full"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <div className="flex flex-row gap-x-6">
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col w-full">
                                            <Popover
                                                open={isOpen}
                                                onOpenChange={setIsOpen}
                                            >
                                                <PopoverTrigger
                                                    asChild
                                                    className="h-12"
                                                >
                                                    <FormControl>
                                                        <Button
                                                            variant={'outline'}
                                                            className={cn(
                                                                'w-full font-normal',
                                                                !field.value &&
                                                                    'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                `${format(
                                                                    field.value,
                                                                    'do MMMM, yyyy'
                                                                )}`
                                                            ) : (
                                                                <span>
                                                                    Pick a date
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        locale={enAU}
                                                        captionLayout="dropdown"
                                                        selected={
                                                            date || field.value
                                                        }
                                                        onSelect={(
                                                            selectedDate
                                                        ) => {
                                                            setDate(
                                                                selectedDate!
                                                            );
                                                            field.onChange(
                                                                selectedDate
                                                            );
                                                        }}
                                                        onDayClick={() =>
                                                            setIsOpen(false)
                                                        }
                                                        startMonth={
                                                            new Date(1900, 0)
                                                        }
                                                        endMonth={
                                                            new Date(
                                                                endYear,
                                                                currentMonth
                                                            )
                                                        }
                                                        disabled={(date) =>
                                                            Number(date) >
                                                            Number(
                                                                sub(
                                                                    new Date(),
                                                                    {
                                                                        years: 18
                                                                    }
                                                                )
                                                            )
                                                        }
                                                        defaultMonth={
                                                            date ||
                                                            sub(new Date(), {
                                                                years: 18
                                                            })
                                                        }
                                                    />
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
                        className={`${!date && 'italic'} text-base font-normal`}
                    >
                        {date
                            ? `${format(
                                  toZonedTime(date, 'Australia/Melbourne'),
                                  'do MMMM, yyyy'
                              )}`
                            : 'Not specified'}
                    </div>
                )}
            </div>{' '}
        </div>
    );
};
export default DateOfBirthForm;
