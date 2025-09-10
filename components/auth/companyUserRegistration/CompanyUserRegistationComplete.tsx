'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegistrationCompleteProps } from '@/types/register';

const CompanyUserRegistationComplete = ({
    name,
    email
}: RegistrationCompleteProps) => {
    const router = useRouter();

    const handleContinue = () => {
        router.push('/');
    };

    return (
        <div className="text-center space-y-6">
            <div className="space-y-3">
                <Button onClick={handleContinue} className="w-full">
                    Continue to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default CompanyUserRegistationComplete;
