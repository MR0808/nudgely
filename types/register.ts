import { Country } from '@/generated/prisma';

export type RegistrationStep = 'initial' | 'email-verify' | 'complete';

export interface RegistrationData {
    userId?: string;
    companyName: string;
    name: string;
    lastName: string;
    email: string;
    password: string;
    terms: boolean;
}

export interface InitialRegistrationFormProps {
    data: RegistrationData;
    onNext: (data: RegistrationData & { userId: string }) => void;
}

export interface EmailVerificationFormProps {
    email: string;
    userId?: string;
    password: string;
    onNext: (userId: string) => void;
}

export interface RegistrationCompleteProps {
    name: string;
    email: string;
}

export interface EmailCheckResult {
    isDisposable: boolean;
    error: string | null;
}
