'use client';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const TeamUserRegistationComplete = () => {
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

export default TeamUserRegistationComplete;
