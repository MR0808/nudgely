import type { Metadata } from 'next';

import { Separator } from '@/components/ui/separator';
import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import CreateTeamForm from '@/components/team/create/CreateTeamForm';
import { getUserCompany } from '@/actions/company';

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

    const company = await getUserCompany(userSession.user.id);

    if (!company.data) return null;

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
                companyId={company.data}
            />
        </div>
    );
};
export default TeamCreatePage;
