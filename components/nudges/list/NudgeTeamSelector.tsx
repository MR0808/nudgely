'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Crown, Users, CheckSquare } from 'lucide-react';
import { NudgeTeamSelectorProps } from '@/types/nudge';

const NudgeTeamSelector = ({
    returnTeams,
    selectedTeam,
    setSelectedTeam,
    allTeamOption
}: NudgeTeamSelectorProps) => {
    const [teams, setTeams] = useState(returnTeams || []);

    return (
        <div className="space-y-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-[200px] justify-between bg-transparent h-12"
                    >
                        {' '}
                        {teams.length === 0 ? (
                            'You are not a part of any teams'
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary-foreground text-xs font-medium">
                                        {selectedTeam?.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex flex-row items-start min-w-0 gap-5">
                                    <span className="truncate text-sm font-medium max-w-[120px]">
                                        {selectedTeam?.name}
                                    </span>
                                </div>
                            </div>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="start">
                    <DropdownMenuItem
                        onClick={() => setSelectedTeam(allTeamOption)}
                        className="flex items-center justify-between p-3 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-primary-foreground text-xs font-medium">
                                    A
                                </span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium truncate">
                                        All
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {allTeamOption.memberCount}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="h-3 w-3" />
                                        {allTeamOption.nudgesCount}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {selectedTeam?.id === 'all' && (
                            <Check className="h-4 w-4 flex-shrink-0" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {teams.map((team) => (
                        <DropdownMenuItem
                            key={team.id}
                            onClick={() => setSelectedTeam(team)}
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
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {team.memberCount}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckSquare className="h-3 w-3" />
                                            {team.nudgesCount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {team.id === selectedTeam?.id && (
                                <Check className="h-4 w-4 flex-shrink-0" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default NudgeTeamSelector;
