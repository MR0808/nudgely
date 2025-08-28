'use client';

import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputAuth, SubmitButtonAuth } from '@/components/form/FormInputs';
import { EmailSchema } from '@/schemas/auth';
import { forgetPassword } from '@/lib/auth-client';
import Link from 'next/link';

const ForgotPasswordForm = () => {
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof EmailSchema>>({
        resolver: zodResolver(EmailSchema),
        defaultValues: {
            email: ''
        }
    });

    const onSubmit = (values: z.infer<typeof EmailSchema>) => {
        setSuccess(false);
        startTransition(async () => {
            await forgetPassword({
                email: values.email,
                redirectTo: '/auth/reset-password',
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        setSuccess(true);
                        toast.success(
                            'Reset password email sent successfully!'
                        );
                    }
                }
            });
        });
    };

    const onError: SubmitErrorHandler<z.infer<typeof EmailSchema>> = (
        errors
    ) => {
        toast.dismiss();

        toast.error('Please enter a valid email', {
            position: 'top-center',
            closeButton: true,
            duration: Infinity
        });
    };

    return (
        <>
            <h1 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">
                Forgot Password
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Enter your email address below to receive a password reset link
            </p>
            {!success ? (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit, onError)}
                        className="flex flex-col gap-6"
                    >
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
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <SubmitButtonAuth
                            text="Reset password"
                            isPending={isPending}
                            className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                        />
                    </form>
                </Form>
            ) : (
                <div className="text-default-500 text-base text-center">
                    Your reset password email has been resent.
                </div>
            )}
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

export default ForgotPasswordForm;
