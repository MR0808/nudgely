import { Dispatch, SetStateAction } from 'react';

import { getNudgeBySlug, getTeamNudges } from '@/actions/nudges';
import { getUserTeams } from '@/actions/team';
import { SessionType } from '@/types/session';
import { NudgeStatus, Plan } from '@/generated/prisma';

// export type UserTeams = Awaited<ReturnType<typeof getUserTeams>>;
export type UserTeams = NonNullable<Awaited<ReturnType<typeof getUserTeams>>>;

export type Nudges = Awaited<ReturnType<typeof getTeamNudges>>;

export type Nudge = NonNullable<Awaited<ReturnType<typeof getNudgeBySlug>>>;

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
    plan: Plan;
    totalNudges: number;
}

export interface NudgeCreateFormProps {
    returnTeams: UserTeams;
    initialTeam: string;
    initialTimezone: string;
    userSession: SessionType | null;
    plan: Plan;
}

export interface NudgeEditFormProps {
    nudge: Nudge;
    returnTeams: UserTeams;
    userSession: SessionType | null;
    plan: Plan;
}

export interface NudgeCreateFormBasicInformationProps {
    returnTeams: UserTeams;
}

export interface NudgeCreateFormRecipientsProps {
    maxRecipients: number;
    planName: string;
}

export interface NudgePauseDialogProps {
    name: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    nudgeId: string;
    setNudges?: (nudges: Nudges) => void;
}

export interface NudgeDropdownProps {
    name: string;
    nudgeId: string;
    status: NudgeStatus;
    slug: string;
}
