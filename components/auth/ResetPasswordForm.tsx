'use client';

import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import {
    PasswordInputAuth,
    SubmitButtonAuth
} from '@/components/form/FormInputs';
import { ResetPasswordSchema } from '@/schemas/auth';
import { resetPassword } from '@/lib/auth-client';
import { getUserIdfromToken } from '@/actions/login';
import { logPasswordResetCompleted } from '@/actions/audit/audit-auth';
import Link from 'next/link';

const ResetPasswordForm = ({ token }: { token: string }) => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
        startTransition(async () => {
            const data = await getUserIdfromToken(token);
            await resetPassword({
                newPassword: values.password,
                token,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        toast.dismiss();
                        toast.success('Password reset successfully.', {
                            position: 'top-center'
                        });
                        if (data.data)
                            await logPasswordResetCompleted(data.data, {
                                resetToken: token // You might want to hash this or just store a reference
                            });
                        router.push('/auth/login');
                    }
                }
            });
        });
    };

    const onError: SubmitErrorHandler<z.infer<typeof ResetPasswordSchema>> = (
        errors
    ) => {
        const errorMessages = Object.entries(errors).map(([field, error]) => (
            <li key={field}>{error.message || `Invalid ${field}`}</li>
        ));

        toast.dismiss();

        toast.error('There were errors while resettting password', {
            position: 'top-center',
            description: (
                <ul className="list-disc ml-4 space-y-1">{errorMessages}</ul>
            ),
            closeButton: true,
            duration: Infinity
        });
    };

    return (
        <>
            <h1 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">
                Reset Password
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Please enter your new password. Make sure it is at least 6
                characters.
            </p>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit, onError)}
                    className="flex flex-col gap-6"
                >
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
                                        <PasswordInputAuth
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

                    <div className="relative">
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                                        Confirm Password
                                    </FormLabel>
                                    <FormControl>
                                        <PasswordInputAuth
                                            {...field}
                                            name="confirmPassword"
                                            type="password"
                                            defaultValue=""
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <SubmitButtonAuth
                        text="Reset Password"
                        isPending={isPending}
                        className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                    />
                </form>
            </Form>
            <div className="mt-20 text-gray-600 dark:text-gray-400">
                Remembered your password?&nbsp;
                <Link
                    className="font-medium text-indigo-600 underline"
                    href="/auth/login"
                >
                    Login
                </Link>
            </div>
        </>
    );
};

export default ResetPasswordForm;
