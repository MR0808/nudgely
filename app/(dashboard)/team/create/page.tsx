import type { Metadata } from 'next';
import Link from 'next/link';

import { Separator } from '@/components/ui/separator';
import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import CreateTeamForm from '@/components/team/create/CreateTeamForm';
import { getUserCompany } from '@/actions/company';
import { Button } from '@/components/ui/button';

export function generateMetadata(): Metadata {
    const title = 'Create a team';
    const description = 'Create a team';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/team/create`,
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

const TeamCreatePage = async () => {
    const userSession = await authCheck('/team/create');
    const res = await getUserCompany();

    const company = res.data;

    if (
        !company?.companyId ||
        userSession.userCompany.role !== 'COMPANY_ADMIN'
    ) {
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

    return (
        <div className="px-4 py-6 flex grow flex-col overflow-hidden mx-auto w-3/4 ">
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Create a team
                </h1>
                <p className="text-muted-foreground">
                    Use the form below to create a team. All tasks must belong
                    to a team.
                </p>
            </div>
            <Separator className="my-4 lg:my-6" />
            <CreateTeamForm
                userSession={userSession}
                companyId={company.companyId}
            />
        </div>
    );
};
export default TeamCreatePage;
