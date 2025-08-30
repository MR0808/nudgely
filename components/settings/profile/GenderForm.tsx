'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Gender } from '@/generated/prisma';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select';

import { authClient, useSession } from '@/lib/auth-client';
import { SubmitButton } from '@/components/Form/Buttons';
import FormError from '@/components/Form/FormError';
import { GenderSchema } from '@/schemas/personal';
import { GenderProps } from '@/types/personal';
import { cn } from '@/lib/utils';
import { logPersonalUpdated } from '@/actions/audit/audit-personal';

const genderLabels: { value: Gender; label: string }[] = [
    { value: Gender.MALE, label: 'Male' },
    { value: Gender.FEMALE, label: 'Female' },
    { value: Gender.OTHER, label: 'Other' },
    { value: Gender.NOTSAY, label: 'Rather not say' }
];

const GenderForm = ({ genderProp, userSession }: GenderProps) => {
    const { refetch } = useSession();
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();
    const [gender, setGender] = useState(
        genderProp
            ? genderLabels.find((g) => g.value === genderProp!)
            : undefined
    );

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof GenderSchema>>({
        resolver: zodResolver(GenderSchema),
        defaultValues: {
            gender: gender?.value || undefined
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof GenderSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                gender: values.gender,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        setGender(
                            genderLabels.find((g) => g.value === values.gender)
                        );
                        if (userSession)
                            await logPersonalUpdated(
                                userSession?.user.id,
                                'user.gender_updated',
                                ['gender'],
                                {
                                    updatedFields: {
                                        gender: values.gender
                                    }
                                }
                            );
                        refetch();
                        setEdit(false);
                        toast.success('Gender successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

    return (
        <div className="border-b border-b-gray-200 pb-8 mt-8">
            <div className="w-full md:w-3/5 flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="font-semibold text-base">Gender</h3>
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
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <Select
                                                disabled={isPending}
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className={cn(
                                                            'w-full rounded-xl py-3 px-6 text-sm font-normal h-12'
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Select a gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            Genders
                                                        </SelectLabel>
                                                        <SelectItem
                                                            value={Gender.MALE}
                                                        >
                                                            Male
                                                        </SelectItem>
                                                        <SelectItem
                                                            value={
                                                                Gender.FEMALE
                                                            }
                                                        >
                                                            Female
                                                        </SelectItem>
                                                        <SelectItem
                                                            value={Gender.OTHER}
                                                        >
                                                            Other
                                                        </SelectItem>
                                                        <SelectItem
                                                            value={
                                                                Gender.NOTSAY
                                                            }
                                                        >
                                                            Rather not say
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
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
                        className={`${!gender && 'italic'} text-base font-normal`}
                    >
                        {gender ? `${gender.label}` : 'Not specified'}
                    </div>
                )}
            </div>
        </div>
    );
};
export default GenderForm;
