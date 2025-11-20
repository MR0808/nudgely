import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { ParamsSlug } from '@/types/global';
import { getNudgeBySlug } from '@/actions/nudges';
import { Button } from '@/components/ui/button';
import { getUserTeams } from '@/actions/team';
import { getPlan } from '@/actions/plan';
import NudgeEditForm from '@/components/nudges/edit/NudgeEditForm';

export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const nudge = await getNudgeBySlug(slug);
    if (!nudge.success) {
        return { title: 'Nudge not found' };
    }
    const title = `${nudge.data.nudge.name} | Edit`;
    const description = 'Nudge edit';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/nudges/edit/${slug}`,
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

const EditNudgePage = async (props: { params: Promise<ParamsSlug> }) => {
    const { slug } = await props.params;
    const userSession = await authCheck(`/nudges/edit/${slug}`);
    const nudge = await getNudgeBySlug(slug);

    if (!nudge.success) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Nudge Not Found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The Nudge you&apos;re looking for doesn&apos;t exist
                            or you don&apos;t have access to it.
                        </p>
                        <Link href="/nudges">
                            <Button>Back to Nudges</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const teams = await getUserTeams();
    const resPlan = await getPlan();

    if (!resPlan.data || !resPlan.success) return null;

    if (!teams || teams.length === 0 || !resPlan.data.plan) {
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
        <div>
            <NudgeEditForm
                returnTeams={teams}
                userSession={userSession}
                plan={resPlan.data.plan}
                nudge={nudge.data.nudge}
            />
        </div>
    );
};
export default EditNudgePage;
