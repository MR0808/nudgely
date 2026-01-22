import { Gender } from '@/generated/prisma/client';

import { SessionType } from '@/types/session';

export interface GenderProps {
    genderProp?: Gender;
    userSession: SessionType | null;
}

export interface DateOfBirthProps {
    dateOfBirthProp?: Date;
    userSession: SessionType | null;
}

