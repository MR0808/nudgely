import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

export async function generateMetadata(): Promise<Metadata> {
    const { company } = await getCompany();

    if (!company) {
        return { title: 'Company not found' };
    }

    const title = `${company.name}`;
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
    const { user } = userSession;

    const { company, userCompany, image } = await getCompany();

    if (!company || userCompany.role !== 'COMPANY_ADMIN') {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load company data
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const countries = await getAllCountries();
    const regions = await getRegionsByCountry(company.countryId!);
    const companySizes = await getAllCompanySizes();
    const industries = await getAllIndustries();
    const members = await getCompanyAdminMembers();
    const invitations = await getCompanyInvitations();

    if (!members.data) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load company data
                    </AlertDescription>
                </Alert>
            </div>
        );
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
                        membersData={members.data}
                        invitesData={invitations.data || []}
                    />
                    {/* <CompanyTeamsCard /> */}
                </div>

                {/* <CompanyBillingCard /> */}

                {/* <CompanyDangerZone /> */}
            </div>
        </div>
    );
};
export default CompanyPage;
