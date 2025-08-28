'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegistrationCompleteProps } from '@/types/register';

const RegistrationComplete = ({ name, email }: RegistrationCompleteProps) => {
    const router = useRouter();

    const handleContinue = () => {
        router.push('/');
    };

    return (
        <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                    Welcome to Nudgely, {name}!
                </h3>
                <p className="text-default-600">
                    Your account has been successfully created and verified.
                </p>
            </div>

            {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-green-800">Account Details:</h4>
                <div className="text-sm text-green-700 space-y-1">
                    <p>✓ Email verified: {email}</p>
                </div>
            </div> */}

            <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                    Continue to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default RegistrationComplete;
