'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

const CompanyUserRegistationComplete = () => {
    // const router = useRouter();

    // const handleContinue = () => {
    //     router.push('/');
    // };

    return (
        <div className="text-center space-y-6">
            <div className="space-y-3">
                <Link href="/">
                    <Button className="w-full">Continue to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
};

export default CompanyUserRegistationComplete;
