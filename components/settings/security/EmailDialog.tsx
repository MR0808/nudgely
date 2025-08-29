'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { useState, useTransition } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import { SubmitButton } from '@/components/form/Buttons';
import { AccountFormInput } from '@/components/form/FormInputs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Clock, AlertCircle } from 'lucide-react';
import { EmailDialogProps } from '@/types/security';
import { cn } from '@/lib/utils';
import {
    ChangeEmailSchema,
    VerifyEmailChangeOTPSchema
} from '@/schemas/security';
import { sendEmailChangeOTP, verifyEmailChangeOTP } from '@/actions/email';
import maskEmail from '@/utils/maskEmail';
import { authClient } from '@/lib/auth-client';
import { logEmailUpdated } from '@/actions/audit/audit-security';

type Step = 'input' | 'verify' | 'success';

const EmailDialog = ({
    open,
    setOpen,
    initialEmail = 'user@example.com',
    refetch,
    userSession
}: EmailDialogProps) => {
    const [step, setStep] = useState<Step>('input');
    const [user, setUser] = useState(userSession?.user);
    const [error, setError] = useState({ error: false, message: '' });
    const [currentEmail] = useState(initialEmail);
    const [newEmail, setNewEmail] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [cooldownTime, setCooldownTime] = useState(0);
    const [isPendingInput, startTransitionInput] = useTransition();
    const [isPendingVerify, startTransitionVerify] = useTransition();

    const handleOpenChange = (newState: boolean) => {
        setOpen(newState);
        if (!newState) {
            setStep('input');
            setNewEmail('');
            setMaskedEmail('');
            setCooldownTime(0);
            setError({ error: false, message: '' });
        }
    };

    const handleStartOver = () => {
        setStep('input');
        setNewEmail('');
        setMaskedEmail('');
        setCooldownTime(0);
        setError({ error: false, message: '' });
    };

    const formInput = useForm<z.infer<typeof ChangeEmailSchema>>({
        resolver: zodResolver(ChangeEmailSchema),
        defaultValues: {
            currentEmail: initialEmail,
            newEmail: ''
        }
    });

    const onSubmitInput = (values: z.infer<typeof ChangeEmailSchema>) => {
        startTransitionInput(async () => {
            const data = await sendEmailChangeOTP(values);
            if (!data.success) {
                setError({ error: true, message: data.message });
            }
            if (data.cooldownTime) {
                setCooldownTime(data.cooldownTime);

                const interval = setInterval(() => {
                    setCooldownTime((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                clearInterval(interval);
            }
            if (data.success) {
                formVerify.setValue('newEmail', values.newEmail);
                setError({ error: false, message: '' });
                setStep('verify');
                setNewEmail(values.newEmail);
                setMaskedEmail(maskEmail(values.newEmail));
            }
        });
    };

    const onErrorInput: SubmitErrorHandler<
        z.infer<typeof ChangeEmailSchema>
    > = (errors) => {
        setError({ error: true, message: errors.newEmail?.message || '' });
    };

    const formVerify = useForm<z.infer<typeof VerifyEmailChangeOTPSchema>>({
        resolver: zodResolver(VerifyEmailChangeOTPSchema),
        defaultValues: {
            currentEmail,
            newEmail,
            otp: ''
        }
    });

    const onSubmitVerify = (
        values: z.infer<typeof VerifyEmailChangeOTPSchema>
    ) => {
        startTransitionVerify(async () => {
            const data = await verifyEmailChangeOTP(values);
            if (!data.success) {
                setError({ error: true, message: data.message });
            }
            if (data.success) {
                if (user && user.id)
                    await logEmailUpdated(
                        user.id,
                        values.currentEmail,
                        values.newEmail
                    );
                await authClient.getSession({
                    query: {
                        disableCookieCache: true
                    }
                });
                refetch();
                setError({ error: false, message: '' });
                setStep('success');
            }
        });
    };

    const onErrorVerify: SubmitErrorHandler<
        z.infer<typeof VerifyEmailChangeOTPSchema>
    > = (errors) => {
        setError({ error: true, message: errors.newEmail?.message || '' });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {step === 'input' && (
                    <>
                        <DialogTitle className="text-center">
                            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <div className="text-lg font-semibold">
                                Change your email address
                            </div>
                        </DialogTitle>
                        <div className="space-y-9">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mt-2">
                                    Current email:{' '}
                                    <span className="font-medium">
                                        {currentEmail}
                                    </span>
                                </p>
                            </div>
                            {error.error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {error.message}
                                        {cooldownTime > 0 && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-xs">
                                                    Try again in {cooldownTime}{' '}
                                                    seconds
                                                </span>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Form {...formInput}>
                                <form
                                    className="space-y-4"
                                    onSubmit={formInput.handleSubmit(
                                        onSubmitInput,
                                        onErrorInput
                                    )}
                                    noValidate
                                >
                                    <div className="space-y-2">
                                        <FormField
                                            control={formInput.control}
                                            name="newEmail"
                                            render={({ field }) => (
                                                <FormItem
                                                    className={cn('w-full')}
                                                >
                                                    <FormLabel className="mb-6">
                                                        New Email Address
                                                    </FormLabel>
                                                    <FormControl>
                                                        <AccountFormInput
                                                            {...field}
                                                            name="newEmail"
                                                            type="email"
                                                            placeholder="Enter your new email address"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <SubmitButton
                                        text="Send Verification Code"
                                        isPending={
                                            isPendingInput || cooldownTime > 0
                                        }
                                        className="w-full mt-6"
                                    />
                                </form>
                            </Form>
                        </div>
                    </>
                )}
                {step === 'verify' && (
                    <>
                        <DialogTitle className="text-center">
                            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <div className="text-lg font-semibold">
                                Verify Your New Email
                            </div>
                        </DialogTitle>
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mt-2">
                                    We sent a 6-digit code to{' '}
                                    <span className="font-medium">
                                        {maskedEmail}
                                    </span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mt-2">
                                    Enter verification code below
                                </p>
                            </div>

                            {!error.error && (
                                <Alert className="items-center">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        OTP sent successfully! Check your email.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error.error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {error.message}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Form {...formVerify}>
                                <form
                                    className="space-y-4"
                                    onSubmit={formVerify.handleSubmit(
                                        onSubmitVerify,
                                        onErrorVerify
                                    )}
                                >
                                    <div className="space-y-2">
                                        <FormField
                                            control={formVerify.control}
                                            name="otp"
                                            render={({ field }) => (
                                                <FormItem
                                                    className={cn('w-full')}
                                                >
                                                    <FormControl>
                                                        <div className="flex justify-center">
                                                            <InputOTP
                                                                maxLength={6}
                                                                {...field}
                                                            >
                                                                <InputOTPGroup>
                                                                    <InputOTPSlot
                                                                        index={
                                                                            0
                                                                        }
                                                                    />
                                                                    <InputOTPSlot
                                                                        index={
                                                                            1
                                                                        }
                                                                    />
                                                                    <InputOTPSlot
                                                                        index={
                                                                            2
                                                                        }
                                                                    />
                                                                    <InputOTPSlot
                                                                        index={
                                                                            3
                                                                        }
                                                                    />
                                                                    <InputOTPSlot
                                                                        index={
                                                                            4
                                                                        }
                                                                    />
                                                                    <InputOTPSlot
                                                                        index={
                                                                            5
                                                                        }
                                                                    />
                                                                </InputOTPGroup>
                                                            </InputOTP>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex gap-5 mx-10 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleStartOver}
                                            className="flex-1 w-1/2"
                                            size="lg"
                                        >
                                            Back
                                        </Button>
                                        <SubmitButton
                                            text="Verify"
                                            isPending={isPendingVerify}
                                            className="w-1/2"
                                        />
                                    </div>
                                </form>
                            </Form>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Code expires in 10 minutes
                                </p>
                            </div>
                        </div>
                    </>
                )}
                {step === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-700">
                                Email Updated!
                            </h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Your email has been successfully changed to{' '}
                                <span className="font-medium">{newEmail}</span>
                            </p>
                        </div>
                        <Button
                            onClick={() => handleOpenChange(false)}
                            variant="outline"
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EmailDialog;
