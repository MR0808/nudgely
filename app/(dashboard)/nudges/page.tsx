import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { Button } from '@/components/ui/button';
import NudgeMain from '@/components/nudges/list/NudgeMain';
import { getUserTeams } from '@/actions/team';
import { getTeamNudges, getTotalCompanyNudges } from '@/actions/nudges';
import { getPlan } from '@/actions/plan';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Nudges`;
    const description = 'View your nudges.';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/nudges`,
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

const NudgesPage = async () => {
    const userSession = await authCheck('/billing');
    const teams = await getUserTeams();
    const plan = await getPlan();

    if (!teams || teams.length === 0 || !plan.plan) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            No teams found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            You are not part of any teams. Please request to be
                            a part of a team to create a nudge.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const nudges = await getTeamNudges(teams[0].id);
    const totalNudges = await getTotalCompanyNudges();

    return (
        <NudgeMain
            returnTeams={teams}
            returnNudges={nudges}
            plan={plan.plan}
            totalNudges={totalNudges}
        />
    );
};

export default NudgesPage;
