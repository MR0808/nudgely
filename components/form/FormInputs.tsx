'use client';

import { forwardRef } from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ReloadIcon } from '@radix-ui/react-icons';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

type FormInputProps = {
    name: string;
    type: string;
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
};

type btnSize = 'default' | 'lg' | 'sm';

type SubmitButtonProps = {
    className?: string;
    text?: string;
    size?: btnSize;
    isPending: boolean;
    disabledCheck?: boolean;
};

export const InputAuth = forwardRef<HTMLInputElement, FormInputProps>(
    function PasswordInputAuth(
        { label, name, type, defaultValue, ...props },
        ref
    ) {
        return (
            <Input
                type={type}
                name={name}
                {...props}
                className="block peer w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-800 placeholder-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors focus:border-indigo-500 focus:outline-0 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
            />
        );
    }
);

export const PasswordInputAuth = forwardRef<HTMLInputElement, FormInputProps>(
    function PasswordInputAuth(
        { label, name, type, defaultValue, ...props },
        ref
    ) {
        const [showPassword, setShowPassword] = useState(false);
        return (
            <>
                <Input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    className="block peer w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white dark:border-gray-600 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-0 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
                    {...props}
                />
                <div
                    className="absolute translate-y-8 right-1 cursor-pointer"
                    tabIndex={-1}
                >
                    <Button
                        type="button"
                        variant="link"
                        onClick={() => {
                            setShowPassword((prev) => !prev);
                        }}
                    >
                        {showPassword ? (
                            <Eye className="size-5" />
                        ) : (
                            <EyeOff className="size-5" />
                        )}
                    </Button>
                </div>
            </>
        );
    }
);

export const SubmitButtonAuth = ({
    className = '',
    text = 'submit',
    size = 'lg',
    isPending,
    disabledCheck = true
}: SubmitButtonProps) => {
    return (
        <Button
            type="submit"
            disabled={isPending || !disabledCheck}
            className={cn('capitalize', className)}
            size={size}
        >
            {isPending ? (
                <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                text
            )}
        </Button>
    );
};

export const SubmitButton = ({
    className = '',
    text = 'submit',
    size = 'lg',
    isPending,
    disabledCheck = true
}: SubmitButtonProps) => {
    return (
        <Button
            type="submit"
            disabled={isPending || !disabledCheck}
            className={cn('capitalize', className)}
            size={size}
        >
            {isPending ? (
                <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                text
            )}
        </Button>
    );
};

export const AccountFormInput = forwardRef<HTMLInputElement, FormInputProps>(
    function AccountFormInput({ name, type, placeholder, ...props }, ref) {
        return (
            <Input
                name={name}
                type={type}
                placeholder={placeholder}
                {...props}
                className={cn('h-12 rounded-xl px-6 py-3 text-sm font-normal')}
                formNoValidate={true}
            />
        );
    }
);

export const AccountFormTextarea = forwardRef<HTMLInputElement, FormInputProps>(
    function AccountFormTextarea({ name, placeholder, ...props }, ref) {
        return (
            <Textarea
                name={name}
                placeholder={placeholder}
                {...props}
                className={cn('rounded-xl px-6 py-3 text-sm font-normal')}
            />
        );
    }
);
