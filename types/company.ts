import { getCompany } from '@/actions/company';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type Company = NonNullable<
    CompanyData extends { company: infer T } ? T : never
>;

export interface CompanyProps {
    company: Company;
    userRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER';
}

export interface EditCompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company;
}
