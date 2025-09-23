'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    Users,
    Settings,
    Mail,
    Calendar,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ShieldCheck,
    Users2
} from 'lucide-react';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DeactivateMemberDialog from '@/components/team/view/DeactivateMemberDialog';
import ReactivateMemberDialog from '@/components/team/view/ReactivateMemberDialog';
import ProfileDialog from '@/components/team/view/ProfileDialog';
import { ReturnMember, UsersListProps } from '@/types/team';
import { deactivateMember, reactivateMember } from '@/actions/companyMembers';
import AddToTeamDialog from '@/components/team/list/AddToTeamDialog';

const UsersList = ({
    members,
    searchQueryUsers,
    canManageCompany,
    setMembers,
    usersWithoutTeams,
    teams
}: UsersListProps) => {
    const [isPending, startTransition] = useTransition();
    const [openDeactivate, setOpenDeactivate] = useState(false);
    const [openReactivate, setOpenReactivate] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openTeams, setOpenTeams] = useState(false);
    const [memberId, setMemberId] = useState('');
    const [member, setMember] = useState<ReturnMember | null>(null);
    const [filteredUsers, setFilteredUsers] = useState(
        members.filter(
            (user) =>
                user.user.name
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase()) ||
                user.user.lastName
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase()) ||
                user.user.email
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase())
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
    const [paginatedUsers, setPaginatedUsers] = useState(
        filteredUsers.slice(startIndex, startIndex + usersPerPage)
    );

    useEffect(() => {
        setStartIndex((currentPage - 1) * usersPerPage);
        const sIndex = (currentPage - 1) * usersPerPage;
        setPaginatedUsers(filteredUsers.slice(sIndex, sIndex + usersPerPage));
    }, [currentPage]);

    useEffect(() => {
        const newFilteredUsers = members.filter(
            (user) =>
                user.user.name
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase()) ||
                user.user.lastName
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase()) ||
                user.user.email
                    .toLowerCase()
                    .includes(searchQueryUsers.toLowerCase())
        );

        // Update states
        setFilteredUsers(newFilteredUsers);
        setCurrentPage(1);
        setTotalPages(Math.ceil(newFilteredUsers.length / usersPerPage));
        setStartIndex(0);
        setPaginatedUsers(newFilteredUsers.slice(0, usersPerPage));
    }, [members, searchQueryUsers]);

    const onOpenDeactivate = (memberId: string) => {
        setMemberId(memberId);
        setOpenDeactivate(true);
    };

    const onOpenReactivate = (memberId: string) => {
        setMemberId(memberId);
        setOpenReactivate(true);
    };

    const onOpenProfile = (member: ReturnMember) => {
        setMember(member);
        setOpenProfile(true);
    };

    const onOpenTeams = (member: ReturnMember) => {
        setMember(member);
        setOpenTeams(true);
    };

    const onDeactivate = (memberId: string) => {
        startTransition(async () => {
            const result = await deactivateMember(memberId);
            if (result.error) {
                toast.error(result.error);
            }
            if (result.data) {
                setMembers(result.data);
                setFilteredUsers(result.data);
                setCurrentPage(1); // Reset to page 1
                setTotalPages(Math.ceil(result.data.length / usersPerPage));
                setStartIndex(0); // (1 - 1) * usersPerPage
                setPaginatedUsers(result.data.slice(0, usersPerPage));

                toast.success('Member deactivated');
            }
            setOpenDeactivate(false);
        });
    };

    const onReactivate = (memberId: string) => {
        startTransition(async () => {
            const result = await reactivateMember(memberId);
            if (result.error) {
                toast.error(result.error);
            }
            if (result.data) {
                setMembers(result.data);
                setFilteredUsers(result.data);
                setCurrentPage(1); // Reset to page 1
                setTotalPages(Math.ceil(result.data.length / usersPerPage));
                setStartIndex(0); // (1 - 1) * usersPerPage
                setPaginatedUsers(result.data.slice(0, usersPerPage));

                toast.success('Member reactivated');
            }
            setOpenReactivate(false);
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            All Users ({filteredUsers.length})
                        </CardTitle>
                        <CardDescription>
                            Manage user profiles and access permissions
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
                            {searchQueryUsers
                                ? 'No users found'
                                : 'No users yet'}
                        </h3>
                        <p className="text-muted-foreground">
                            {searchQueryUsers
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
                                                    user.user.image ||
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
                                                        user.user.status ===
                                                        'ACTIVE'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {user.user.status}
                                                </Badge>
                                                {user.user.teamMembers
                                                    .length === 0 && (
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
                                                    {user.user.email}
                                                </div>
                                                {user.user.jobTitle && (
                                                    <div className="flex items-center gap-1">
                                                        <Settings className="h-3 w-3" />
                                                        {user.user.jobTitle}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {
                                                        user.user.teamMembers
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
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        onOpenProfile(user)
                                                    }
                                                >
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    View Profile
                                                </DropdownMenuItem>
                                                {canManageCompany &&
                                                    user.role ===
                                                        'COMPANY_MEMBER' && (
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                onOpenTeams(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            <Users2 className="h-4 w-4 mr-2" />
                                                            Manage Teams
                                                        </DropdownMenuItem>
                                                    )}
                                                {canManageCompany &&
                                                    user.role ===
                                                        'COMPANY_MEMBER' && (
                                                        <>
                                                            {user.user
                                                                .status ===
                                                            'ACTIVE' ? (
                                                                <DropdownMenuItem
                                                                    className="text-destructive cursor-pointer"
                                                                    onClick={() =>
                                                                        onOpenDeactivate(
                                                                            user.id
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Deactivate
                                                                    Member
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    className="text-green-800 cursor-pointer"
                                                                    onClick={() =>
                                                                        onOpenReactivate(
                                                                            user.id
                                                                        )
                                                                    }
                                                                >
                                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                                    Reactivate
                                                                    Member
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {canManageCompany && (
                            <>
                                <DeactivateMemberDialog
                                    memberId={memberId}
                                    open={openDeactivate}
                                    onDeactivate={onDeactivate}
                                    setOpen={setOpenDeactivate}
                                    isPending={isPending}
                                />
                                <ReactivateMemberDialog
                                    memberId={memberId}
                                    open={openReactivate}
                                    onReactivate={onReactivate}
                                    setOpen={setOpenReactivate}
                                    isPending={isPending}
                                />
                                <ProfileDialog
                                    open={openProfile}
                                    setOpen={setOpenProfile}
                                    member={member}
                                />
                                <AddToTeamDialog
                                    open={openTeams}
                                    setOpen={setOpenTeams}
                                    user={member}
                                    teams={teams}
                                    setMembers={setMembers}
                                />
                            </>
                        )}

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
                                                Math.max(prev - 1, 1)
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
                                                length: Math.min(5, totalPages)
                                            },
                                            (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <Button
                                                        key={pageNum}
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
                                                Math.min(prev + 1, totalPages)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
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
    );
};
export default UsersList;
