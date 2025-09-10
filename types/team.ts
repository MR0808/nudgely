import { getCurrentTeamBySlug } from '@/actions/team';
import { PlanType } from '@/generated/prisma';
import { auth } from '@/lib/auth';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface CreateTeamFormProps {
    companyId: string;
    userSession: SessionType | null;
}

export type Team = {
    id: string;
    name: string;
    role: string;
    memberCount: number;
    tasksCount: number;
};

export type Company = {
    companyName: string;
    companyPlan: string;
    isCompanyTrialing: boolean;
    trialEndsAt: Date | null;
};

export interface TeamSelectorProps {
    teams: Team[];
    company: Company;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'TEAM_ADMIN' | 'TEAM_MEMBER';
    avatar?: string;
    joinedAt: Date;
    isCurrentUser: boolean;
}

export type TeamData = Awaited<ReturnType<typeof getCurrentTeamBySlug>>;

export interface TeamMainProps {
    teamData: TeamData;
    userRole: 'TEAM_ADMIN' | 'TEAM_MEMBER';
}

export interface InviteMemberDialogProps {
    teamId: string;
    teamName: string;
    companyPlan: PlanType;
    currentMemberCount: number;
    trigger?: React.ReactNode;
}
