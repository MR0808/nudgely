import type { Metadata } from 'next';
import { Building2, Calendar, Crown, Plus, Users } from 'lucide-react';
import Link from 'next/link';

import siteMetadata from '@/utils/siteMetaData';
import { authCheck } from '@/lib/authCheck';
import { getCompanyTeams } from '@/actions/team';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TeamUserFilter from '@/components/team/list/TeamUserFilter';
import { getPlan } from '@/actions/plan';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Teams and Users`;
    const description = 'View your teams and manage users.';
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

const TeamPage = async () => {
    const { user, userCompany } = await authCheck('/team');
    const { data } = await getCompanyTeams();
    const { plan } = await getPlan();

    if (!data || !plan) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            Company data not found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            The teams you&apos;re looking for doesn&apos;t exist
                            or you don&apos;t have access to it.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { teams, members } = data;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const activeMembers = members.filter(
        (member) => member.user.status === 'ACTIVE'
    );

    const activeTeams = teams.filter((team) => team.status === 'ACTIVE');

    const recentMembers = activeMembers.filter(
        (member) => member.createdAt >= oneMonthAgo
    );

    const canManageCompany =
        userCompany.role === 'COMPANY_ADMIN' ? true : false;

    const usersWithoutTeams = activeMembers.filter(
        (u) => u.user.teamMembers.length === 0
    ).length;

    return (
        <div className="w-full bg-background">
            <div className="mx-32 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Teams & Users
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your teams, members, and user permissions
                        </p>
                    </div>
                    {canManageCompany && (
                        <div className="flex gap-2">
                            <Link href="/company/settings">
                                <Button
                                    variant="outline"
                                    className="gap-2 bg-transparent cursor-pointer"
                                >
                                    <Building2 className="h-4 w-4" />
                                    Company Settings
                                </Button>
                            </Link>
                            {(plan.maxTeams > activeTeams.length ||
                                plan.maxTeams === 0) && (
                                <Link href="/team/create">
                                    <Button className="gap-2 cursor-pointer">
                                        <Plus className="h-4 w-4" />
                                        Create Team
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {`${activeTeams.length} / ${plan.maxTeams === 0 ? '∞' : plan.maxTeams}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total Teams
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {`${activeMembers.length} / ${plan.maxUsers === 0 ? '∞' : plan.maxUsers}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total Active Members
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {usersWithoutTeams}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {usersWithoutTeams === 1
                                            ? 'Member Without a Team'
                                            : 'Members Without a Team'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {recentMembers.length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        New Members This Month
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {
                                            teams.filter(
                                                (t) =>
                                                    new Date(t.createdAt) >
                                                    new Date(
                                                        Date.now() -
                                                            30 *
                                                                24 *
                                                                60 *
                                                                60 *
                                                                1000
                                                    )
                                            ).length
                                        }
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        New Teams This Month
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <TeamUserFilter
                    teamsDb={data}
                    canManageCompany={canManageCompany}
                    usersWithoutTeams={usersWithoutTeams}
                    userId={user.id}
                />
            </div>
        </div>
    );
};

export default TeamPage;
