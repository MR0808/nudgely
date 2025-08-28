'use client';

import Link from 'next/link';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

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
    InputAuth,
    PasswordInputAuth,
    SubmitButtonAuth
} from '@/components/form/FormInputs';
import { LoginSchema } from '@/schemas/auth';
import { login } from '@/actions/login';

const LoginForm = () => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get('callbackURL') || '/';

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: true
        }
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        startTransition(async () => {
            const data = await login(values);
            console.log(data);
            const { error, emailVerified } = data;
            if (error) {
                toast.error(error, { position: 'top-center' });
            } else {
                toast.success('Log in successful', { position: 'top-center' });
                if (!emailVerified) {
                    router.push('/auth/verify-email');
                } else if (emailVerified) {
                    router.push(callbackURL);
                }
            }
        });
    };

    const onError: SubmitErrorHandler<z.infer<typeof LoginSchema>> = (
        errors
    ) => {
        const errorMessages = Object.entries(errors).map(([field, error]) => (
            <li key={field}>{error.message || `Invalid ${field}`}</li>
        ));

        toast.dismiss();

        toast.error('There were errors in your login', {
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
                Welcome Back
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Access your account to explore our amazing features.
            </p>
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

                    <div className="my-2 flex justify-between gap-2">
                        <div className="grow">
                            <div className="relative">
                                <FormField
                                    control={form.control}
                                    name="rememberMe"
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
                                                Keep me signed in
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="text-right">
                            <a
                                className="text-indigo-600 dark:text-indigo-400"
                                href="/auth/forgot-password"
                            >
                                Forgot Password?
                            </a>
                        </div>
                    </div>

                    <SubmitButtonAuth
                        text="Sign in"
                        isPending={isPending}
                        className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                    />
                    <div className="text-gray-600 dark:text-gray-400">
                        By proceeding, you acknowledge and accept our&nbsp;
                        <a
                            className="font-medium text-indigo-600 underline"
                            href="/terms"
                            target="_blank"
                        >
                            Terms and Conditions
                        </a>
                        &nbsp;and&nbsp;
                        <Link
                            className="font-medium text-indigo-600 underline"
                            href="/privacy-policy"
                            target="_blank"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </div>
                </form>
            </Form>
            <div className="mt-20 text-gray-600 dark:text-gray-400">
                Don&apos;t have an account yet?&nbsp;
                <Link
                    className="font-medium text-indigo-600 underline"
                    href="/auth/register"
                >
                    Sign up
                </Link>
            </div>
        </>
    );
};

export default LoginForm;
