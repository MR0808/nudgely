import { Dispatch, SetStateAction } from 'react';

import { getTeamNudges } from '@/actions/nudges';
import { getUserTeams } from '@/actions/team';
import { SessionType } from '@/types/session';

// export type UserTeams = Awaited<ReturnType<typeof getUserTeams>>;
export type UserTeams = NonNullable<Awaited<ReturnType<typeof getUserTeams>>>;

export type Nudges = Awaited<ReturnType<typeof getTeamNudges>>;

export type UserTeam = NonNullable<UserTeams>[number];

export type Company = {
    companyName: string;
    companyPlan: string;
    isCompanyTrialing: boolean;
    trialEndsAt: Date | null;
};

export interface NudgeTeamSelectorProps {
    returnTeams: UserTeams;
    selectedTeam: UserTeam | null;
    setSelectedTeam: Dispatch<SetStateAction<UserTeam>>;
}

export interface NudgeMainProps {
    returnTeams: UserTeams;
    returnNudges: Nudges;
}

export interface NudgeCreateFormProps {
    returnTeams: UserTeams;
    initialTeam: string;
    initialTimezone: string;
    userSession: SessionType | null;
}

export interface NudgeCreateFormBasicInformationProps {
    returnTeams: UserTeams;
}
