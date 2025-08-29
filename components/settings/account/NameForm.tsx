'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';

import { authClient, useSession } from '@/lib/auth-client';
import { SubmitButton } from '@/components/form/Buttons';
import { AccountFormInput } from '@/components/form/FormInputs';
import FormError from '@/components/form/FormError';
import { NameSchema } from '@/schemas/account';
import { cn } from '@/lib/utils';
import { SessionProps } from '@/types/session';
import { logAccountUpdated } from '@/actions/audit/audit-account';

const NameForm = ({ userSession }: SessionProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
        }
    }, [currentUser]);

    const errorClass = 'pl-6';

    const form = useForm<z.infer<typeof NameSchema>>({
        resolver: zodResolver(NameSchema),
        defaultValues: {
            name: user?.name || '',
            lastName: user?.lastName || ''
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof NameSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                name: values.name,
                lastName: values.lastName,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        refetch();
                        if (user && user.id)
                            await logAccountUpdated(
                                user.id,
                                'user.name_updated',
                                ['name', 'firstName'],
                                {
                                    updatedFields: {
                                        name: values.name,
                                        lastName: values.lastName
                                    }
                                }
                            );
                        setEdit(false);
                        toast.success('Name successfully updated');
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
                    <h3 className="text-base font-semibold">Name</h3>
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
                            <div className="flex flex-row space-x-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <FormControl>
                                                <AccountFormInput
                                                    {...field}
                                                    name="firstName"
                                                    type="text"
                                                    placeholder="First Name"
                                                />
                                            </FormControl>
                                            <FormMessage
                                                className={errorClass}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <FormControl>
                                                <AccountFormInput
                                                    {...field}
                                                    name="lastName"
                                                    type="text"
                                                    placeholder="Last Name"
                                                />
                                            </FormControl>
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
                            !user?.name && 'italic'
                        } text-base font-normal`}
                    >
                        {user?.name && user?.lastName
                            ? `${user.name} ${user.lastName}`
                            : 'Not specified'}
                    </div>
                )}
            </div>
        </div>
    );
};
export default NameForm;
