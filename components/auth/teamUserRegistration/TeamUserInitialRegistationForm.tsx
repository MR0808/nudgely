'use client';

import { useForm, type SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
    companyUserRegisterInitial,
    registerInitial,
    teamUserRegisterInitial
} from '@/actions/register';
import { InviteUserRegisterSchema } from '@/schemas/register';
import type { TeamUserInitialRegistationFormProps } from '@/types/register';
import {
    InputAuth,
    InputAuthCompanyUser,
    PasswordInputAuthCompanyUser,
    SubmitButtonAuth
} from '@/components/form/FormInputs';
import { inviteCompanyAdmin } from '@/actions/companyMembers';

const TeamUserInitialRegistationForm = ({
    invite,
    data,
    onNext
}: TeamUserInitialRegistationFormProps) => {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof InviteUserRegisterSchema>>({
        resolver: zodResolver(InviteUserRegisterSchema),
        defaultValues: {
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            terms: data.terms
        }
    });

    const onSubmit = (values: z.infer<typeof InviteUserRegisterSchema>) => {
        toast.dismiss();
        startTransition(async () => {
            const result = await teamUserRegisterInitial(
                values,
                invite.team.companyId,
                invite.teamId,
                invite.role,
                invite.id
            );
            if (result.error) {
                toast.error(result.error, { position: 'top-center' });
            } else if (result.userId) {
                onNext({ ...values, userId: result.userId });
            }
        });
    };

    const onError: SubmitErrorHandler<
        z.infer<typeof InviteUserRegisterSchema>
    > = (errors) => {
        toast.dismiss();
        const errorMessages = Object.entries(errors).map(([field, error]) => (
            <li key={field}>{error.message || `Invalid ${field}`}</li>
        ));

        toast.dismiss();
        toast.error('Please fix the following errors:', {
            position: 'top-center',
            description: (
                <ul className="list-disc ml-4 space-y-1">{errorMessages}</ul>
            ),
            closeButton: true,
            duration: Number.POSITIVE_INFINITY
        });
    };
    return (
        <>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit, onError)}
                    className="flex flex-col gap-6"
                >
                    <div className="relative flex flex-row gap-5 w-full">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                                        First Name
                                    </FormLabel>
                                    <FormControl>
                                        <InputAuthCompanyUser
                                            {...field}
                                            type="text"
                                            name="name"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                                        Last Name
                                    </FormLabel>
                                    <FormControl>
                                        <InputAuthCompanyUser
                                            {...field}
                                            type="text"
                                            name="lastName"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="relative">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                                        Email
                                    </FormLabel>
                                    <FormControl>
                                        <InputAuth
                                            {...field}
                                            type="email"
                                            name="email"
                                            disabled={true}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="relative">
                        <div className="relative">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                                            Password
                                        </FormLabel>
                                        <FormControl>
                                            <PasswordInputAuthCompanyUser
                                                {...field}
                                                name="password"
                                                type="password"
                                                defaultValue=""
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="my-2 flex justify-between gap-2">
                        <div className="grow">
                            <div className="relative">
                                <FormField
                                    control={form.control}
                                    name="terms"
                                    render={({ field }) => (
                                        <FormItem
                                            className={cn(
                                                'flex flex-row items-center space-x-2'
                                            )}
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                    className="peer rounded border-gray-300 dark:border-gray-600 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
                                                />
                                            </FormControl>
                                            <FormLabel
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200'
                                                )}
                                            >
                                                I accept the terms and
                                                conditions
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <SubmitButtonAuth
                        text="Register"
                        isPending={isPending}
                        className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                    />
                </form>
            </Form>
        </>
    );
};

export default TeamUserInitialRegistationForm;
