import { Dispatch, SetStateAction } from 'react';
import { Country } from '@/generated/prisma';

import { LocationData } from '@/types/account';
import { SessionType } from '@/types/session';

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
