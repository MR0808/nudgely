import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import NudgeCreateForm from '@/components/nudges/create/NudgeCreateForm';
import { getUserTeams } from '@/actions/team';
import { Button } from '@/components/ui/button';
import { getPlan } from '@/actions/plan';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Create Nudge`;
    const description = 'Create a nudge.';
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

const CreateNudgePage = async ({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
    const userSession = await authCheck('/nudges/create');
    const teams = await getUserTeams();
    const params = await searchParams;
    const initialTeam = params.id ? params.id : '';
    const plan = await getPlan();

    let initialTimezone = 'UTC';
    if (userSession.company.timezone) {
        initialTimezone = userSession.company.timezone;
    } else if (userSession.user.timezone) {
        initialTimezone = userSession.user.timezone;
    }

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

    return (
        // <div className="container mx-auto max-w-5xl py-10 grid grid-cols-1 md:grid-cols-1 gap-8">
        <div>
            {/* Left Column: Form */}
            <NudgeCreateForm
                returnTeams={teams}
                initialTeam={initialTeam}
                initialTimezone={initialTimezone}
                userSession={userSession}
                plan={plan.plan}
            />

            {/* Right Column: Live Preview */}
            {/* <NudgePreview /> */}
        </div>
    );
};

export default CreateNudgePage;
