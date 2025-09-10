import { getCompany } from '@/actions/company';
import {
    getCompanyAdminMembers,
    getCompanyInvitations
} from '@/actions/companyMembers';
import {
    Image,
    CompanySize,
    Country,
    Industry,
    Region,
    PlanType,
    CompanyRole
} from '@/generated/prisma';

import { auth } from '@/lib/auth';

export type Session = typeof auth.$Infer.Session;
export type SessionType = Awaited<ReturnType<typeof auth.api.getSession>>;

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type MembersData = Awaited<ReturnType<typeof getCompanyAdminMembers>>;

export type CompanyInvitesData = Awaited<
    ReturnType<typeof getCompanyInvitations>
>;

export type Members = NonNullable<
    MembersData extends { data: infer T } ? T : never
>;

export type CompanyInvites = NonNullable<
    CompanyInvitesData extends { data: infer T } ? T : never
>;

export type Company = NonNullable<
    CompanyData extends { company: infer T } ? T : never
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
    companyPlan: PlanType;
    currentMemberCount: number;
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

export interface CompanyMembersCardProps {
    company: Company;
    membersData: Members;
    invitesData: CompanyInvites;
}
