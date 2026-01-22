import type { Gender } from '@/lib/prisma-enums';

import { SessionType } from '@/types/session';

export interface GenderProps {
    genderProp?: Gender;
    userSession: SessionType | null;
}

export interface DateOfBirthProps {
    dateOfBirthProp?: Date;
    userSession: SessionType | null;
}

