'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { Country } from 'react-phone-number-input';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import { SubmitButton } from '@/components/form/Buttons';
import { PhoneInput } from '@/components/ui/phone-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Clock, AlertCircle } from 'lucide-react';
import { PhoneDialogProps } from '@/types/security';
import { cn } from '@/lib/utils';
import {
    ChangePhoneSchema,
    VerifyPhoneChangeOTPSchema
} from '@/schemas/security';
import { sendPhoneChangeOTP, verifyPhoneChangeOTP } from '@/actions/phone';
import { authClient } from '@/lib/auth-client';
import { logPhoneUpdated } from '@/actions/audit/audit-security';

type Step = 'input' | 'verify' | 'success';

const PhoneDialog = ({
    open,
    setOpen,
    initialPhone,
    refetch,
    userSession,
    defaultCountry
}: PhoneDialogProps) => {
    const [step, setStep] = useState<Step>('input');
    const [user, setUser] = useState(userSession?.user);
    const [error, setError] = useState({ error: false, message: '' });
    const [currentPhoneNumber] = useState(initialPhone);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [formattedNumber, setFormattedNumber] = useState<
        PhoneNumber | undefined
    >(undefined);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [isPendingInput, startTransitionInput] = useTransition();
    const [isPendingVerify, startTransitionVerify] = useTransition();

    if (!initialPhone) initialPhone = undefined;

    const handleOpenChange = (newState: boolean) => {
        setOpen(newState);
        if (!newState) {
            setStep('input');
            setNewPhoneNumber('');
            setCooldownTime(0);
            setError({ error: false, message: '' });
        }
    };

    const handleStartOver = () => {
        setStep('input');
        setNewPhoneNumber('');
        setCooldownTime(0);
        setError({ error: false, message: '' });
    };

    const formInput = useForm<z.infer<typeof ChangePhoneSchema>>({
        resolver: zodResolver(ChangePhoneSchema),
        defaultValues: {
            currentPhoneNumber: initialPhone,
            newPhoneNumber: ''
        }
    });

    const onSubmitInput = (values: z.infer<typeof ChangePhoneSchema>) => {
        startTransitionInput(async () => {
            const data = await sendPhoneChangeOTP(values);
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
                formVerify.setValue('newPhoneNumber', values.newPhoneNumber);
                if (!values.currentPhoneNumber)
                    formVerify.setValue('currentPhoneNumber', 'New number');
                setError({ error: false, message: '' });
                setStep('verify');
                setNewPhoneNumber(values.newPhoneNumber);
                setFormattedNumber(parsePhoneNumber(values.newPhoneNumber));
            }
        });
    };

    const onErrorInput: SubmitErrorHandler<
        z.infer<typeof ChangePhoneSchema>
    > = (errors) => {
        setError({
            error: true,
            message: errors.newPhoneNumber?.message || ''
        });
    };

    const formVerify = useForm<z.infer<typeof VerifyPhoneChangeOTPSchema>>({
        resolver: zodResolver(VerifyPhoneChangeOTPSchema),
        defaultValues: {
            currentPhoneNumber,
            newPhoneNumber,
            otp: ''
        }
    });

    const onSubmitVerify = (
        values: z.infer<typeof VerifyPhoneChangeOTPSchema>
    ) => {
        startTransitionVerify(async () => {
            const data = await verifyPhoneChangeOTP(values);
            if (!data.success) {
                setError({ error: true, message: data.message });
            }
            if (data.success) {
                if (user && user.id)
                    await logPhoneUpdated(
                        user.id,
                        values.currentPhoneNumber || 'New Phone',
                        values.newPhoneNumber
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
        z.infer<typeof VerifyPhoneChangeOTPSchema>
    > = (errors) => {
        setError({
            error: true,
            message: errors.newPhoneNumber?.message || ''
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {step === 'input' && (
                    <>
                        <DialogTitle className="text-center">
                            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <div className="text-lg font-semibold">
                                Change your phone number
                            </div>
                        </DialogTitle>
                        <div className="space-y-9">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mt-2">
                                    Current phone number:{' '}
                                    <span className="font-medium">
                                        {currentPhoneNumber}
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
                                            name="newPhoneNumber"
                                            render={({ field }) => (
                                                <FormItem
                                                    className={cn('w-full')}
                                                >
                                                    <FormLabel className="mb-6">
                                                        New Phone Number
                                                    </FormLabel>
                                                    <FormControl>
                                                        <PhoneInput
                                                            {...field}
                                                            defaultCountry={
                                                                defaultCountry.isoCode as Country
                                                            }
                                                            placeholder="Enter a phone number"
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
                                        {formattedNumber &&
                                            formattedNumber.formatNational()}
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
                                        OTP sent successfully! Check your phone
                                        number.
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
                                Phone Number Updated!
                            </h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Your phone number has been successfully changed
                                to{' '}
                                <span className="font-medium">
                                    {formattedNumber &&
                                        formattedNumber.formatNational()}
                                </span>
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

export default PhoneDialog;
