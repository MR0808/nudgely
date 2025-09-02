'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Check,
    ChevronDown,
    Plus,
    Crown,
    Users,
    CheckSquare,
    Building2
} from 'lucide-react';
import { useTeamStore } from '@/stores/teamStore';
import { Team, TeamSelectorProps } from '@/types/team';
import { getUserTeams } from '@/actions/team';

const TeamSelector = ({ teams, company }: TeamSelectorProps) => {
    const { selectedTeam, setSelectedTeam } = useTeamStore();
    const [currentTeam, setCurrentTeam] = useState<Team | null>(
        selectedTeam ? selectedTeam : teams[0]
    );

    const [isLoading, setIsLoading] = useState(false);
    const [isCompanyView, setIsCompanyView] = useState(true);
    const [userTeams, setUserTeams] = useState(teams);

    const switchTeam = (newTeam: Team) => {
        setIsCompanyView(false);
        setSelectedTeam(newTeam);
        setCurrentTeam(newTeam);
    };

    const switchToCompany = () => {
        setIsCompanyView(true);
        setSelectedTeam(null);
        setCurrentTeam(null);
    };

    // useEffect(() => {
    //     async function fetchTeams() {
    //         try {
    //             if (isReloadTeam) {
    //                 setIsLoading(true);
    //                 setIsReloadTeam(false);

    //                 console.log(1);
    //                 const newTeams = await getUserTeams();
    //                 console.log(2);

    //                 setUserTeams(newTeams || []);
    //                 console.log(3);

    //                 setCurrentTeam(selectedTeam);
    //                 console.log(4);

    //                 setIsLoading(false);
    //             }
    //         } catch (error) {
    //             console.error('Failed to fetch team data:', error);
    //         }
    //     }
    //     fetchTeams();
    // }, [selectedTeam]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <div className="text-xs font-medium text-sidebar-foreground mb-2">
                    Team
                </div>
                <Skeleton className="h-12 w-full rounded-md" />
            </div>
        );
    }

    if (userTeams.length === 0) {
        return (
            <div className="space-y-2">
                <div className="text-xs font-medium text-sidebar-foreground mb-2">
                    Team
                </div>
                <Link href="/team/create">
                    <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                    </Button>
                </Link>
            </div>
        );
    }

    const displayInfo =
        isCompanyView && userTeams.length > 0
            ? {
                  name: company.companyName,
                  companyName: company.companyName,
                  companyPlan: company.companyPlan,
                  isCompanyTrialing: company.isCompanyTrialing,
                  trialEndsAt: company.trialEndsAt
              }
            : currentTeam;

    if (!displayInfo) {
        return (
            <div className="space-y-2">
                <div className="text-xs font-medium text-sidebar-foreground mb-2">
                    Team
                </div>
                <Link href="/team/create">
                    <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="text-xs font-medium text-sidebar-foreground mb-2">
                Team
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between bg-transparent h-12"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                {isCompanyView ? (
                                    <Building2 className="h-3 w-3 text-primary-foreground" />
                                ) : (
                                    <span className="text-primary-foreground text-xs font-medium">
                                        {displayInfo.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-row items-start min-w-0 gap-5">
                                <span className="truncate text-sm font-medium max-w-[120px]">
                                    {displayInfo.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* {!isCompanyView && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Building2 className="h-3 w-3" />
                                            <span className="truncate max-w-[80px]">
                                                {displayInfo.companyName}
                                            </span>
                                        </div>
                                    )} */}
                                    <Badge
                                        variant={
                                            company.companyPlan === 'PRO'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="text-xs"
                                    >
                                        {company.companyPlan}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="start">
                    <DropdownMenuLabel>Switch View</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {userTeams.length > 0 && (
                        <>
                            <DropdownMenuItem
                                onClick={switchToCompany}
                                className="flex items-center justify-between p-3 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                        <Building2 className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium truncate">
                                                {company.companyName}
                                            </span>
                                            <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Company Overview</span>
                                            <Badge
                                                variant={
                                                    company.companyPlan ===
                                                    'PRO'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {company.companyPlan}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                {isCompanyView && (
                                    <Check className="h-4 w-4 flex-shrink-0" />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {userTeams.map((team) => (
                        <DropdownMenuItem
                            key={team.id}
                            onClick={() => switchTeam(team)}
                            className="flex items-center justify-between p-3 cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-foreground text-xs font-medium">
                                        {team.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium truncate">
                                            {team.name}
                                        </span>
                                        {team.role === 'TEAM_ADMIN' && (
                                            <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {/* <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            <span className="truncate max-w-[60px]">
                                                {team.companyName}
                                            </span>
                                        </div> */}
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {team.memberCount}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckSquare className="h-3 w-3" />
                                            {team.tasksCount}
                                        </div>
                                        <Badge
                                            variant={
                                                company.companyPlan === 'PRO'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {company.companyPlan}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            {team.id === currentTeam?.id && !isCompanyView && (
                                <Check className="h-4 w-4 flex-shrink-0" />
                            )}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href="/team/create"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Team
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default TeamSelector;
