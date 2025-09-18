'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Crown,
    Settings,
    Mail,
    Building2,
    Calendar,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamFilterProps } from '@/types/team';
import DeleteTeamDialog from '@/components/team/view/DeleteTeamDialog';
import DeactivateMemberDialog from '@/components/team/view/DeactivateMemberDialog';

const TeamUserFilter = ({
    teamsDb,
    canManageCompany,
    usersWithoutTeams
}: TeamFilterProps) => {
    const [teams, setTeams] = useState(teamsDb || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTeams, setFilteredTeams] = useState(
        teams.teams.filter((team) =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const [filteredUsers, setFilteredUsers] = useState(
        teams.members.filter(
            (user) =>
                user.user.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                user.user.lastName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                user.user.email
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
        )
    );
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const [totalPages, setTotalPages] = useState(
        Math.ceil(filteredUsers.length / usersPerPage)
    );
    const [startIndex, setStartIndex] = useState(
        (currentPage - 1) * usersPerPage
    );
    const [paginatedUsers, setpaginatedUsers] = useState(
        filteredUsers.slice(startIndex, startIndex + usersPerPage)
    );

    useEffect(() => {
        setStartIndex((currentPage - 1) * usersPerPage);
        const sIndex = (currentPage - 1) * usersPerPage;
        setpaginatedUsers(filteredUsers.slice(sIndex, sIndex + usersPerPage));
    }, [currentPage]);

    useEffect(() => {
        setFilteredTeams(
            teams.teams.filter((team) =>
                team.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredUsers(
            teams.members.filter(
                (user) =>
                    user.user.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    user.user.lastName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    user.user.email
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
            )
        );
        setCurrentPage(1);
        setTotalPages(Math.ceil(filteredUsers.length / usersPerPage));
        setStartIndex((currentPage - 1) * usersPerPage);
        setpaginatedUsers(
            filteredUsers.slice(startIndex, startIndex + usersPerPage)
        );
    }, [teams, searchQuery]);

    return (
        <>
            {/* Teams Grid */}
            <Tabs defaultValue="teams" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                    </TabsList>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teams or users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <TabsContent value="teams" className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTeams.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    {searchQuery
                                        ? 'No teams found'
                                        : 'No teams yet'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? 'Try adjusting your search terms'
                                        : 'Create your first team to get started'}
                                </p>
                                {!searchQuery && (
                                    <Link href="/team/create">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Team
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filteredTeams.map((team) => (
                                <Card
                                    key={team.id}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">
                                                    {team.name}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {team.description ? (
                                                        team.description
                                                    ) : (
                                                        <>&nbsp;</>
                                                    )}
                                                </CardDescription>
                                            </div>
                                            {canManageCompany && (
                                                <DeleteTeamDialog
                                                    teamId={team.id}
                                                    setFilteredTeams={
                                                        setFilteredTeams
                                                    }
                                                />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-4">
                                            {/* Team Stats */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {team.members.length}{' '}
                                                    members
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Crown className="h-4 w-4" />
                                                    {team.admins} admins
                                                </div>
                                            </div>

                                            {/* Member Avatars */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {team.members
                                                        .slice(0, 4)
                                                        .map((member) => (
                                                            <Avatar
                                                                key={member.id}
                                                                className="h-8 w-8 border-2 border-background"
                                                            >
                                                                <AvatarImage
                                                                    src={
                                                                        member
                                                                            .user
                                                                            .image ||
                                                                        '/images/assets/profile.jpg'
                                                                    }
                                                                    alt={`${member.user.name} ${member.user.lastName}`}
                                                                />
                                                                <AvatarFallback className="text-xs">
                                                                    {`${member.user.name[0]} ${member.user.lastName[0]}`}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    {team.members.length >
                                                        4 && (
                                                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                                            +
                                                            {team.members
                                                                .length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={
                                                        team.company.plan.colour
                                                    }
                                                    className="text-xs"
                                                >
                                                    {team.company.plan.name}
                                                </Badge>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <Link
                                                        href={`/team/${team.slug}`}
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Manage
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 bg-transparent"
                                                >
                                                    <Link
                                                        href={`/team/${team.slug}/members`}
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        Members
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="users" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        All Users ({filteredUsers.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Manage user profiles and access
                                        permissions
                                    </CardDescription>
                                </div>
                                {usersWithoutTeams > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="text-orange-600 border-orange-200"
                                    >
                                        {usersWithoutTeams} without a team
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">
                                        {searchQuery
                                            ? 'No users found'
                                            : 'No users yet'}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? 'Try adjusting your search terms'
                                            : 'Users will appear here once they join your organization'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {paginatedUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage
                                                            src={
                                                                user.user
                                                                    .image ||
                                                                '/images/assets/profile.jpg'
                                                            }
                                                            alt={`${user.user.name} ${user.user.lastName}`}
                                                        />
                                                        <AvatarFallback>
                                                            {`${user.user.name[0]}${user.user.lastName[0]}`}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium">
                                                                {`${user.user.name} ${user.user.lastName}`}
                                                            </h3>
                                                            <Badge
                                                                variant={
                                                                    user.user
                                                                        .status ===
                                                                    'ACTIVE'
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {
                                                                    user.user
                                                                        .status
                                                                }
                                                            </Badge>
                                                            {user.user
                                                                .teamMembers
                                                                .length ===
                                                                0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs text-orange-600 border-orange-200"
                                                                >
                                                                    No Team
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {
                                                                    user.user
                                                                        .email
                                                                }
                                                            </div>
                                                            {user.user
                                                                .jobTitle && (
                                                                <div className="flex items-center gap-1">
                                                                    <Settings className="h-3 w-3" />
                                                                    {
                                                                        user
                                                                            .user
                                                                            .jobTitle
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {
                                                                    user.user
                                                                        .teamMembers
                                                                        .length
                                                                }{' '}
                                                                teams
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Joined{' '}
                                                                {new Date(
                                                                    user.createdAt
                                                                ).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/users/${user.id}`}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Settings className="h-4 w-4 mr-2" />
                                                                    View Profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {canManageCompany && (
                                                                <DeactivateMemberDialog
                                                                    memberId={
                                                                        user.userId
                                                                    }
                                                                    setFilteredUsers={
                                                                        setFilteredUsers
                                                                    }
                                                                />
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {startIndex + 1} to{' '}
                                                {Math.min(
                                                    startIndex + usersPerPage,
                                                    filteredUsers.length
                                                )}{' '}
                                                of {filteredUsers.length} users
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setCurrentPage((prev) =>
                                                            Math.max(
                                                                prev - 1,
                                                                1
                                                            )
                                                        )
                                                    }
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from(
                                                        {
                                                            length: Math.min(
                                                                5,
                                                                totalPages
                                                            )
                                                        },
                                                        (_, i) => {
                                                            const pageNum =
                                                                i + 1;
                                                            return (
                                                                <Button
                                                                    key={
                                                                        pageNum
                                                                    }
                                                                    variant={
                                                                        currentPage ===
                                                                        pageNum
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setCurrentPage(
                                                                            pageNum
                                                                        )
                                                                    }
                                                                    className="w-8 h-8 p-0"
                                                                >
                                                                    {pageNum}
                                                                </Button>
                                                            );
                                                        }
                                                    )}
                                                    {totalPages > 5 && (
                                                        <span className="text-muted-foreground">
                                                            ...
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setCurrentPage((prev) =>
                                                            Math.min(
                                                                prev + 1,
                                                                totalPages
                                                            )
                                                        )
                                                    }
                                                    disabled={
                                                        currentPage ===
                                                        totalPages
                                                    }
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
};
export default TeamUserFilter;
