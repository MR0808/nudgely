import { Plan } from '@/generated/prisma/client';

import { getCompany } from '@/actions/company';
import { getCustomerPaymentInformation } from '@/actions/subscriptions';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type CompanyDataData = NonNullable<
    CompanyData extends { data: infer T } ? T : never
>;

export type Company = NonNullable<
    CompanyDataData extends { company: infer T } ? T : never
>;

export type GetPaymentReturn = Awaited<
    ReturnType<typeof getCustomerPaymentInformation>
>;

export type Payment = Extract<
    GetPaymentReturn,
    { success: true }
>['data']['payment'];

export type Invoices = Extract<
    GetPaymentReturn,
    { success: true }
>['data']['invoices'];

export interface BillingPlanSelectionProps {
    company: Company;
    plans: Plan[];
    isComplete: boolean;
}

export interface BillingPlanSelectionDowngradeDialogProps {
    company: Company;
    plan: Plan;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export interface BillingPaymentMethodProps {
    payment: Payment | null;
    customerId: string | null;
}

export interface BillingInvoicesProps {
    invoices: Invoices | undefined;
    customerId: string | null;
}

