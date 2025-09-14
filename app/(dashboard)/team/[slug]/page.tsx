import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Users,
    ArrowLeft,
    Crown,
    Calendar,
    Building2,
    CheckSquare,
    UserPlus,
    MoreHorizontal,
    Trash2
} from 'lucide-react';

import { authCheck } from '@/lib/authCheck';
import siteMetadata from '@/utils/siteMetaData';
import { getCurrentTeamBySlug } from '@/actions/team';
import { ParamsSlug } from '@/types/global';
import { Button } from '@/components/ui/button';
import TeamEditForm from '@/components/team/view/TeamEditForm';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
    const userSession = await authCheck(`/team/${slug}`);

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

    const { team, members, userRole } = data;

    const canManageTeam = userRole === 'TEAM_ADMIN' ? true : false;

    const totalCompletions = team.nudges.reduce((total, nudge) => {
        return total + (nudge.completions?.length || 0);
    }, 0);

    const teamForm = {
        id: team.id,
        name: team.name,
        description: team.description || ''
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/team">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Teams
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {team.name}
                            </h1>
                            <p className="text-muted-foreground">
                                Manage team settings and members
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/team/${slug}/members`}>
                            <Button
                                variant="outline"
                                className="gap-2 bg-transparent cursor-pointer"
                            >
                                <Users className="h-4 w-4" />
                                Manage Members
                            </Button>
                        </Link>
                        {canManageTeam && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Team
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
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
                                        {members.length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Members
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {team.nudges.length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total Tasks
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {totalCompletions}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Completed
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
                                        {new Date(
                                            team.createdAt
                                        ).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Created
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Team Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {canManageTeam && (
                            <TeamEditForm
                                team={teamForm}
                                companyId={team.companyId}
                                userSession={userSession}
                            />
                        )}

                        {/* Team Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Team Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </Label>
                                    <p className="text-sm">
                                        {team.description}
                                    </p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Company
                                        </Label>
                                        <p className="text-sm">
                                            {team.company.name}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Plan
                                        </Label>
                                        <Badge
                                            variant={team.company.plan.colour}
                                        >
                                            {team.company.plan.name}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Your Role
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm">
                                                {userRole === 'TEAM_ADMIN'
                                                    ? 'Admin'
                                                    : 'Member'}
                                            </p>
                                            {userRole === 'TEAM_ADMIN' && (
                                                <Crown className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Last Updated
                                        </Label>
                                        <p className="text-sm">
                                            {new Date(
                                                team.updatedAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Team Members
                                    </CardTitle>
                                    <CardDescription>
                                        {members.length} members
                                    </CardDescription>
                                </div>
                                {canManageTeam && (
                                    <Link href={`/team/${slug}/members`}>
                                        <Button size="sm" variant="outline">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Invite
                                        </Button>
                                    </Link>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {members.slice(0, 5).map((member: any) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={
                                                        member.avatar ||
                                                        '/placeholder.svg'
                                                    }
                                                    alt={member.name}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {member.name
                                                        .split(' ')
                                                        .map(
                                                            (n: string) => n[0]
                                                        )
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium truncate">
                                                        {member.name}
                                                    </p>
                                                    {member.role ===
                                                        'TEAM_ADMIN' && (
                                                        <Crown className="h-3 w-3 text-amber-500" />
                                                    )}
                                                    {member.isCurrentUser && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            You
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {members.length > 5 && (
                                        <div className="text-center pt-2">
                                            <Link
                                                href={`/team/${slug}/members`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    View all {members.length}{' '}
                                                    members
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
