import type { Plan, TeamStatus, User } from '@/generated/prisma/client';
import type { TeamRole } from '@/lib/prisma-enums';

import { getCompanyTeams, getCurrentTeamBySlug } from '@/actions/team';
import { SessionType } from '@/types/session';

export type TeamsData = Awaited<ReturnType<typeof getCompanyTeams>>;

export type Teams = NonNullable<
    TeamsData extends { data: infer T } ? T : never
>;

export type ReturnTeams = NonNullable<
    Teams extends { teams: infer T } ? T : never
>;

export type ReturnMembers = NonNullable<
    Teams extends { members: infer T } ? T : never
>;

export type ReturnMember = NonNullable<Teams>['members'][number];

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

export type TeamData = Awaited<ReturnType<typeof getCurrentTeamBySlug>>;

export type TeamDataTeam = NonNullable<TeamData>['team'];

export type Members = NonNullable<TeamData>['members'];
export type Member = NonNullable<TeamData>['members'][number];
export type Invites = NonNullable<TeamData>['invites'];

export interface TeamMainProps {
    teamData: TeamData;
    userRole: TeamRole;
}

export interface InviteMemberDialogProps {
    teamId: string;
    teamName: string;
    currentMemberCount: number;
    companyPlan: Plan;
    setMembers: (members: Members) => void;
    setPendingInvites?: (pendingInvites: Invites) => void;
    trigger: 'team' | 'members';
}

export interface TeamUserFilterProps {
    teamsDb: Teams;
    canManageCompany: boolean;
    usersWithoutTeams: number;
    userId: string;
}

export interface TeamsListProps {
    teams: ReturnTeams;
    searchQueryTeams: string;
    canManageCompany: boolean;
    setTeams: (returnTeams: ReturnTeams) => void;
    userId: string;
}

export interface UsersListProps {
    members: ReturnMembers;
    searchQueryUsers: string;
    canManageCompany: boolean;
    setMembers: (returnMembers: ReturnMembers) => void;
    usersWithoutTeams: number;
    teams: ReturnTeams;
}

export interface TeamEditFormProps {
    team: { id: string; name: string; description: string };
    companyId: string;
    userSession: SessionType | null;
}

export interface TeamMembersListProps {
    team: TeamDataTeam;
    membersData: Members;
    invitesData: Invites;
    userRole: TeamRole;
}

export interface CancelInviteDialogProps {
    name: string;
    email: string;
    inviteId: string;
    setPendingInvites: (pendingInvites: Invites) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    slug: string;
    trigger?: React.ReactNode;
}

export interface RemoveMemberDialogProps {
    name: string;
    email: string;
    memberId: string;
    teamId: string;
    setMembers: (members: Members) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export interface TeamMembersCardProps {
    canManageTeam: boolean;
    membersData: Members;
    team: TeamDataTeam;
}

export interface DeleteTeamDialogProps {
    teamId: string;
    status: TeamStatus;
    setTeams?: (returnTeams: ReturnTeams) => void;
}

export interface DeactivateMemberDialogProps {
    memberId: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onDeactivate: (memberId: string) => void;
    isPending: boolean;
}

export interface ReactivateMemberDialogProps {
    memberId: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onReactivate: (memberId: string) => void;
    isPending: boolean;
}

export interface ProfileDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    member: ReturnMember | null;
}

export interface AddToTeamDialogProps {
    user: ReturnMember | null;
    teams: ReturnTeams;
    open: boolean;
    setOpen: (open: boolean) => void;
    setMembers: (returnMembers: ReturnMembers) => void;
}

