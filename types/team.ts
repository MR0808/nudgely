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
