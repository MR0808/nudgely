'use client';

import { useState, useEffect } from 'react';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

import { useSession } from '@/lib/auth-client';
import { PhoneNumberProps } from '@/types/security';
import PhoneDialog from '@/components/settings/security/PhoneDialog';

const PhoneNumberForm = ({ userSession, defaultCountry }: PhoneNumberProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [open, setOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | undefined>(
        userSession && userSession.user.phoneNumber
            ? parsePhoneNumber(userSession.user.phoneNumber)
            : undefined
    );

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
            setPhoneNumber(
                currentUser.user.phoneNumber
                    ? parsePhoneNumber(currentUser.user.phoneNumber)
                    : undefined
            );
        }
    }, [currentUser]);

    return (
        <div className="mt-8 border-b border-b-gray-200 pb-8">
            <div className="w-full flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="text-base font-semibold">Phone Number</h3>
                    <div
                        className="cursor-pointer text-base font-normal hover:underline"
                        onClick={() => setOpen(true)}
                    >
                        Edit
                    </div>
                    <PhoneDialog
                        open={open}
                        setOpen={setOpen}
                        initialPhone={user?.phoneNumber ? user.phoneNumber : ''}
                        refetch={refetch}
                        userSession={userSession}
                        defaultCountry={defaultCountry}
                    />
                </div>
                <div
                    className={`${
                        !user?.phoneNumber && 'italic'
                    } text-base font-normal`}
                >
                    {phoneNumber
                        ? phoneNumber.formatNational()
                        : 'Not specified'}
                </div>
            </div>
        </div>
    );
};
export default PhoneNumberForm;
