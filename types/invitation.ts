import { getCompanyInvitationByToken } from '@/actions/invitation';

export type CompanyInvitationData = Awaited<
    ReturnType<typeof getCompanyInvitationByToken>
>;

export type CompanyInvitation = NonNullable<
    CompanyInvitationData extends { invitation: infer T } ? T : never
>;

export type CompanyInvitationInviter = NonNullable<
    CompanyInvitationData extends { inviter: infer T } ? T : never
>;

export interface CompanyInvitationFormProps {
    invite: CompanyInvitation;
    inviter: CompanyInvitationInviter;
}
