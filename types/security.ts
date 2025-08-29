import { Dispatch, SetStateAction } from 'react';
import { Country } from '@/generated/prisma';

import { auth } from '@/lib/auth';
import { LocationData } from '@/types/account';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

export type SecurityProps = {
    userSession: SessionType | null;
    location: LocationData;
};

export type EmailDialogProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    initialEmail?: string;
    refetch: () => void;
    userSession: SessionType | null;
};

export type PhoneDialogProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    initialPhone?: string;
    refetch: () => void;
    userSession: SessionType | null;
    defaultCountry: Country;
};

export interface PhoneNumberProps {
    defaultCountry: Country;
    userSession: SessionType | null;
}
