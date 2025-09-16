import {
    getCompanyInvitationByToken,
    getTeamInvitationByToken
} from '@/actions/invitation';

export type CompanyInvitationData = Awaited<
    ReturnType<typeof getCompanyInvitationByToken>
>;

export type CompanyInvitation = NonNullable<
    CompanyInvitationData extends { invitation: infer T } ? T : never
>;

export type CompanyInvitationInviter = NonNullable<
    CompanyInvitationData extends { inviter: infer T } ? T : never
>;

export type TeamInvitationData = Awaited<
    ReturnType<typeof getTeamInvitationByToken>
>;

export type TeamInvitation = NonNullable<
    TeamInvitationData extends { invitation: infer T } ? T : never
>;

export type TeamInvitationInviter = NonNullable<
    TeamInvitationData extends { inviter: infer T } ? T : never
>;

export interface CompanyInvitationFormProps {
    invite: CompanyInvitation;
    inviter: CompanyInvitationInviter;
}

export interface TeamInvitationFormProps {
    invite: TeamInvitation;
    inviter: TeamInvitationInviter;
}
