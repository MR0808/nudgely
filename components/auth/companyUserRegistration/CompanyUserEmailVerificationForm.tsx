'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, RefreshCw } from 'lucide-react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from '@/components/ui/input-otp';
import { verifyEmailOTP, resendEmailOTP } from '@/actions/verify-email';
import { EmailVerificationFormProps } from '@/types/register';
import { OTPSchema } from '@/schemas/register';
import { SubmitButtonAuth } from '@/components/form/FormInputs';

const CompanyUserEmailVerificationForm = ({
    email,
    userId,
    password,
    onNext
}: EmailVerificationFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const form = useForm<z.infer<typeof OTPSchema>>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { otp: '' }
    });

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const onSubmit = (values: z.infer<typeof OTPSchema>) => {
        if (!userId) {
            toast.error('User ID not found. Please start registration again.');
            return;
        }

        startTransition(async () => {
            const result = await verifyEmailOTP(
                userId,
                values.otp,
                email,
                password
            );
            if (result.error) {
                toast.error(result.error, { position: 'top-center' });
                form.setError('otp', { message: result.error });
            } else {
                onNext(userId);
            }
        });
    };

    const handleResendOTP = async () => {
        if (!userId || countdown > 0) return;

        setIsResending(true);
        const result = await resendEmailOTP(userId);
        setIsResending(false);

        if (result.error) {
            toast.error(result.error, { position: 'top-center' });
        } else {
            toast.success('New OTP sent to your email!', {
                position: 'top-center'
            });
            setCountdown(60); // 60 second cooldown
            form.reset();
        }
    };

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex justify-center mb-5">
                                        <InputOTP maxLength={6} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-center" />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col space-y-3">
                        <SubmitButtonAuth
                            text="Verify Email"
                            isPending={isPending}
                            className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                        />

                        <div className="text-center">
                            <div onClick={handleResendOTP} className="text-sm">
                                {isResending ? (
                                    <div className="flex flex-row justify-center cursor-default hover:none">
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </div>
                                ) : countdown > 0 ? (
                                    <div className="cursor-default">
                                        Resend in {countdown}s
                                    </div>
                                ) : (
                                    <div className="hover:underline cursor-pointer hover:text-gray-500">
                                        Resend Code
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CompanyUserEmailVerificationForm;
