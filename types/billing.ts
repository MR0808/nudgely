import { Plan } from '@/generated/prisma';

import { getCompany } from '@/actions/company';
import { getCustomerPaymentInformation } from '@/actions/subscriptions';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type Company = NonNullable<
    CompanyData extends { company: infer T } ? T : never
>;

export type Details = Awaited<ReturnType<typeof getCustomerPaymentInformation>>;

export type Payment = NonNullable<
    Details extends { payment: infer T } ? T : never
>;

export type Invoices = NonNullable<
    Details extends { invoices: infer T } ? T : never
>;

export interface BillingPlanSelectionProps {
    company: Company;
    plans: Plan[];
}

export interface BillingPaymentMethodProps {
    payment: Payment | null;
    customerId: string | null;
}

export interface BillingInvoicesProps {
    invoices: Invoices | null;
    customerId: string | null;
}
