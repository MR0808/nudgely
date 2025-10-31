import type { Metadata } from 'next';
import Link from 'next/link';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCurrentTeamBySlug } from '@/actions/team';
import { ParamsSlug } from '@/types/global';
import { Button } from '@/components/ui/button';
import TeamMembersList from '@/components/team/view/TeamMembersList';
import { ArrowLeft } from 'lucide-react';

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
    const title = `${team.team.name} | Members`;
    const description = 'Team members edit';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/team/${slug}/members`,
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

const TeamMembersPage = async (props: { params: Promise<ParamsSlug> }) => {
    const { slug } = await props.params;
    const userSession = await authCheck(`/team/${slug}/members`);

    const data = await getCurrentTeamBySlug(slug);

    if (!data) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Team Not Found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The team you&apos;re looking for doesn&apos;t exist
                            or you don&apos;t have access to it.
                        </p>
                        <Link href="/team">
                            <Button>Back to Teams</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { team, members, invites, userRole } = data;

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <Link href={`/team/${team.slug}`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Team
                    </Button>
                </Link>
            </div>
            <div>
                <h1 className="text-3xl font-bold">{team.name} Members</h1>
                <p className="text-muted-foreground">
                    Manage team members and their roles
                </p>
            </div>

            <TeamMembersList
                team={team}
                membersData={members}
                invitesData={invites || []}
                userRole={userRole}
            />
        </div>
    );
};

export default TeamMembersPage;
