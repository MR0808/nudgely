'use client';

import { useState, useEffect } from 'react';

import { useSession } from '@/lib/auth-client';
import { SessionProps } from '@/types/session';
import EmailDialog from '@/components/settings/security/EmailDialog';

const EmailForm = ({ userSession }: SessionProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
        }
    }, [currentUser]);

    return (
        <div className="border-b border-b-gray-200 pb-8">
            <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="font-semibold text-base">Email</h3>
                    <div
                        className="cursor-pointer text-base font-normal hover:underline"
                        onClick={() => setOpen(true)}
                    >
                        Edit
                    </div>
                    <EmailDialog
                        open={open}
                        setOpen={setOpen}
                        initialEmail={user?.email}
                        refetch={refetch}
                        userSession={userSession}
                    />
                </div>
                <div
                    className={`${!user?.email && 'italic'} text-base font-normal`}
                >
                    {user?.email ? `${user.email}` : 'Not specified'}
                </div>
            </div>
        </div>
    );
};
export default EmailForm;
