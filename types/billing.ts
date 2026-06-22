import type { Plan } from '@/generated/prisma/client';

import { getCompany } from '@/actions/company';
import type {
    BillingInvoicesList,
    BillingPayment
} from '@/lib/stripe-billing-display';

export type CompanyData = Awaited<ReturnType<typeof getCompany>>;

export type CompanyDataData = NonNullable<
    CompanyData extends { data: infer T } ? T : never
>;

export type Company = NonNullable<
    CompanyDataData extends { company: infer T } ? T : never
>;

export type Payment = BillingPayment;
export type Invoices = BillingInvoicesList;

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

