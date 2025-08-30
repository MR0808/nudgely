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
import {
    AccountFormInput,
    AccountFormTextarea
} from '@/components/form/FormInputs';
import FormError from '@/components/form/FormError';
import { BioSchema } from '@/schemas/profile';
import { cn } from '@/lib/utils';
import { SessionProps } from '@/types/session';
import { logProfileUpdated } from '@/actions/audit/audit-profile';

const BioForm = ({ userSession }: SessionProps) => {
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

    const form = useForm<z.infer<typeof BioSchema>>({
        resolver: zodResolver(BioSchema),
        defaultValues: {
            bio: user?.bio || ''
        }
    });

    const cancel = () => {
        form.reset();
        setEdit(!edit);
    };

    const onSubmit = (values: z.infer<typeof BioSchema>) => {
        startTransition(async () => {
            await authClient.updateUser({
                bio: values.bio,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        refetch();
                        if (user && user.id)
                            await logProfileUpdated(
                                user.id,
                                'user.bio_updated',
                                ['bio'],
                                {
                                    updatedFields: {
                                        bio: values.bio
                                    }
                                }
                            );
                        setEdit(false);
                        toast.success('Bio successfully updated');
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
                    <h3 className="text-base font-semibold">Bio</h3>
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
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem className={cn('w-full')}>
                                            <FormControl>
                                                <AccountFormTextarea
                                                    {...field}
                                                    name="bio"
                                                    type="text"
                                                    placeholder="Bio"
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
                            !user?.bio && 'italic'
                        } text-base font-normal whitespace-pre-wrap`}
                    >
                        {user?.bio ? user.bio : 'Not specified'}
                    </div>
                )}
            </div>
        </div>
    );
};
export default BioForm;
