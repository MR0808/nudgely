import {
    Image,
    CompanySize,
    Country,
    Industry,
    Region,
    CompanyRole,
    Plan
} from '@/generated/prisma';

import { getCompany } from '@/actions/company';
import {
    getCompanyAdminMembers,
    getCompanyInvitations
} from '@/actions/companyMembers';
import { InferActionField } from '@/types/actions';
import { getCompanyTeams } from '@/actions/team';
import { SessionType } from '@/types/session';
import { getCustomerPaymentInformation } from '@/actions/subscriptions';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type Members = InferActionField<
    typeof getCompanyAdminMembers,
    'members'
>;

export type CompanyInvites = InferActionField<
    typeof getCompanyInvitations,
    'invitations'
>;

export type TeamsData = Awaited<ReturnType<typeof getCompanyTeams>>;

export type CompanyDataData = NonNullable<
    CompanyData extends { data: infer T } ? T : never
>;

export type Company = NonNullable<
    CompanyDataData extends { company: infer T } ? T : never
>;

export type TeamsUpper = NonNullable<
    TeamsData extends { data: infer T } ? T : never
>;

export type Teams = NonNullable<
    TeamsUpper extends { teams: infer T } ? T : never
>;

export type Details = Awaited<ReturnType<typeof getCustomerPaymentInformation>>;

export type Payment = NonNullable<
    Details extends { payment: infer T } ? T : never
>;

export interface CompanyProps {
    company: Company;
    userRole: CompanyRole;
    image: Image | null;
    countries: Country[];
    regions: Region[];
    companySizes: CompanySize[];
    industries: Industry[];
    userSession: SessionType | null;
}

export interface EditCompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company;
    countries: Country[];
    regions: Region[];
    companySizes: CompanySize[];
    industries: Industry[];
    userSession: SessionType | null;
}

export interface UpdateLogoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentLogo?: string;
    userSession: SessionType | null;
}

export interface InviteCompanyMemberDialogProps {
    companyId: string;
    companyName: string;
    currentMemberCount: number;
    companyPlan: Plan;
    setMembers: (members: Members) => void;
    setPendingInvites: (pendingInvites: CompanyInvites) => void;
    trigger?: React.ReactNode;
}

export interface CancelInviteDialogProps {
    name: string;
    email: string;
    inviteId: string;
    setPendingInvites: (pendingInvites: CompanyInvites) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export interface RemoveAdminMemberDialogProps {
    name: string;
    email: string;
    memberId: string;
    setMembers: (members: Members) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export interface CompanyMembersCardProps {
    company: Company;
    membersData: Members;
    invitesData: CompanyInvites;
    userSession: SessionType | null;
}

export interface CompanyTeamsCardProps {
    teams: Teams;
    userSession: SessionType | null;
}

export interface CompanyBillingCardProps {
    company: Company;
    nudgeCount: number;
    payment: Payment | null;
    nextBillingDate: Date | null;
}

export interface BillingManagementDialogProps {
    trigger: React.ReactNode;
    company: Company;
    plans: Plan[];
}

export interface CompanyCheckResult {
    isCompanyAdmin: boolean;
    companyId: string | null;
    companyName: string | null;
    isComplete: boolean;
    missingFields: string[];
}
