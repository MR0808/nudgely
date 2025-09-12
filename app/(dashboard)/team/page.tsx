import type { Metadata } from 'next';
import {
    AlertCircle,
    Building2,
    Calendar,
    Crown,
    Plus,
    Users
} from 'lucide-react';
import Link from 'next/link';

import siteMetadata from '@/utils/siteMetaData';
import { authCheck } from '@/lib/authCheck';
import { getCompanyTeams } from '@/actions/team';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TeamFilter from '@/components/team/list/TeamFilter';

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
    const userSession = await authCheck('/team');
    const { data: teams } = await getCompanyTeams();

    if (!teams) {
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
                        <Link href="/team/create">
                            <Button className="gap-2 cursor-pointer">
                                <Plus className="h-4 w-4" />
                                Create Team
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {teams.length}
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
                                        {/* {totalMembers} */}5
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total Members
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {/* {totalAdmins} */}3
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Team Admins
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
                                        New This Month
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <TeamFilter teamsDb={teams} />
            </div>
        </div>
    );
};

export default TeamPage;
