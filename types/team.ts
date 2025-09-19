import { getCompanyTeams, getCurrentTeamBySlug } from '@/actions/team';
import { Plan, TeamRole, UserRole } from '@/generated/prisma';
import { auth } from '@/lib/auth';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

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

export interface TeamFilterProps {
    teamsDb: Teams;
    canManageCompany: boolean;
    usersWithoutTeams: number;
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
    setTeams?: (returnTeams: ReturnTeams) => void;
}

// export interface DeactivateMemberDialogProps {
//     memberId: string;
//     setFilteredUsers: (members: ReturnMembers) => void;
//     open: boolean;
//     setOpen: (open: boolean) => void;
//     setSearchQuery: (searchQuery: string) => void;
// }

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
