import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCurrentTeamBySlug } from '@/actions/team';
import { getUserTeamRole } from '@/lib/team';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParamsSlug } from '@/types/global';
import { Suspense } from 'react';
import TeamMain from '@/components/team/view/TeamMain';

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const team = await getCurrentTeamBySlug(slug);
    if (!team) {
        return { title: 'Team not found' };
    }
    const title = `${team.team.name}`;
    const description = 'Team edit';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/team/${slug}`,
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

const TeamPage = async (props: { params: ParamsSlug }) => {
    const { slug } = await props.params;
    const userSession = await authCheck(`/team/${slug}/members`);

    const team = await getCurrentTeamBySlug(slug);

    if (!team) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load team data
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <Suspense fallback={<TeamSkeleton />}>
                    <div className="py-8 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {team.team.name} Members
                            </h1>
                            <p className="text-muted-foreground">
                                Manage team members and their roles
                            </p>
                        </div>
                        <TeamMain teamData={team} userRole={team.userRole} />
                    </div>
                </Suspense>
            </main>
        </div>
    );
};

const TeamSkeleton = () => {
    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
};

export default TeamPage;
