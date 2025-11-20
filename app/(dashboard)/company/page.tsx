import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCompany } from '@/actions/company';
import { Separator } from '@/components/ui/separator';
import CompanyDetails from '@/components/company/CompanyDetails';
import { getAllCountries, getRegionsByCountry } from '@/lib/location';
import { getAllCompanySizes } from '@/lib/companySize';
import { getAllIndustries } from '@/lib/industries';
import CompanyMembersCard from '@/components/company/CompanyMembersCard';
import {
    getCompanyAdminMembers,
    getCompanyInvitations
} from '@/actions/companyMembers';
import CompanyTeamsCard from '@/components/company/CompanyTeamsCard';
import { getCompanyTeams } from '@/actions/team';
import { Button } from '@/components/ui/button';
import CompanyBillingCard from '@/components/company/CompanyBillingCard';
import { getCompanyNudgeCount } from '@/actions/nudges';
import { getCustomerPaymentInformation } from '@/actions/subscriptions';

export async function generateMetadata(): Promise<Metadata> {
    const res = await getCompany();
    if (!res.data) {
        return { title: 'Company not found' };
    }
    const { company } = res.data;

    if (!company) {
        return { title: 'Company not found' };
    }

    const title = `Company - ${company.name}`;
    const description = 'View company details and settings.';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/company`,
            siteName: siteMetadata.title,
            locale: 'en_AU',
            type: 'article',
            publishedTime: '2024-08-15 13:00:00',
            modifiedTime: '2024-08-15 13:00:00',
            images,
            authors: [siteMetadata.author]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images
        }
    };
}

const CompanyPage = async () => {
    const userSession = await authCheck('/company');
    const res = await getCompany();
    if (!res.success || !res.data) return null;
    const { company, userCompany, image } = res.data;

    if (!company || userCompany.role !== 'COMPANY_ADMIN') {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Company data not found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The company data you&apos;re looking for
                            doesn&apos;t exist or you don&apos;t have access to
                            it. If this is an issue, please contact support.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const countries = await getAllCountries();
    const regions = await getRegionsByCountry(company.countryId!);
    const companySizes = await getAllCompanySizes();
    const industries = await getAllIndustries();
    const resMembers = await getCompanyAdminMembers();
    if (!resMembers.success || !resMembers.data) return null;
    const { members } = resMembers.data;
    const resInvitations = await getCompanyInvitations();
    if (!resInvitations.success || !resInvitations.data) return null;
    const { invitations } = resInvitations.data;
    const teams = await getCompanyTeams();
    const nudgeCount = await getCompanyNudgeCount();

    if (!members) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Company data not found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The company data you&apos;re looking for
                            doesn&apos;t exist or you don&apos;t have access to
                            it. If this is an issue, please contact support.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const details = await getCustomerPaymentInformation(
        company.stripeCustomerId,
        company.companySubscription?.stripeSubscriptionId
    );

    let nextBillingDate = new Date();
    if (details.nextBillingDate) {
        nextBillingDate = new Date(details.nextBillingDate * 1000);
    }

    return (
        <div className="px-4 py-6 flex grow flex-col overflow-hidden mx-auto w-3/4 ">
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Company Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your company details, members, and billing.
                </p>
            </div>
            <Separator className="my-4 lg:my-6" />
            <div className="grid gap-6">
                <CompanyDetails
                    company={company}
                    userRole={userCompany.role}
                    image={image}
                    countries={countries!}
                    regions={regions!}
                    industries={industries!}
                    companySizes={companySizes!}
                    userSession={userSession}
                />

                <div className="grid md:grid-cols-2 gap-6">
                    <CompanyMembersCard
                        company={company}
                        membersData={members}
                        invitesData={invitations || []}
                        userSession={userSession}
                    />
                    <CompanyTeamsCard
                        teams={teams.data?.teams || []}
                        userSession={userSession}
                    />
                </div>

                <CompanyBillingCard
                    company={company}
                    nudgeCount={nudgeCount}
                    payment={details.payment}
                    nextBillingDate={
                        details.nextBillingDate ? nextBillingDate : null
                    }
                />

                {/* <CompanyDangerZone /> */}
            </div>
        </div>
    );
};
export default CompanyPage;
