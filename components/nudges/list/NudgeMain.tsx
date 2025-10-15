'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import NudgeTeamSelector from '@/components/nudges/list/NudgeTeamSelector';
import { Button } from '@/components/ui/button';
import { NudgeMainProps } from '@/types/nudge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getTeamNudges } from '@/actions/nudges';
import { Skeleton } from '@/components/ui/skeleton';

const NudgeMain = ({
    returnTeams,
    returnNudges,
    plan,
    totalNudges
}: NudgeMainProps) => {
    const [nudges, setNudges] = useState(returnNudges);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState(returnTeams[0]);

    useEffect(() => {
        async function fetchNudges() {
            try {
                setIsLoading(true);

                const newNudges = await getTeamNudges(selectedTeam.id);
                setNudges(newNudges);
            } catch (error) {
                console.error('Failed to fetch team data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchNudges();
    }, [selectedTeam]);

    if (!returnTeams) return null;

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">Your Nudges</h1>

                <div className="flex items-center gap-4">
                    <NudgeTeamSelector
                        returnTeams={returnTeams}
                        selectedTeam={selectedTeam}
                        setSelectedTeam={setSelectedTeam}
                    />

                    {returnTeams &&
                        returnTeams.length > 0 &&
                        (plan.maxNudges === 0 ||
                            totalNudges < plan.maxNudges) && (
                            <Link
                                href={`/nudges/create?id=${selectedTeam?.id}`}
                            >
                                <Button className="h-12 cursor-pointer">
                                    + Add Nudge
                                </Button>
                            </Link>
                        )}
                </div>
            </div>
            <div className="grid gap-4">
                {isLoading ? (
                    <CardSkeleton />
                ) : nudges && nudges.length > 0 ? (
                    nudges.map((nudge) => (
                        <Card
                            key={nudge.id}
                            className="hover:shadow-lg transition cursor-pointer group"
                        >
                            <Link
                                href={`/nudges/${nudge.id}`}
                                className="block"
                            >
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle className="text-lg group-hover:text-blue-600 transition">
                                        {nudge.name}
                                    </CardTitle>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>
                                                Actions
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    alert('Edit Nudge')
                                                }
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                {nudge.status === 'ACTIVE'
                                                    ? 'Pause'
                                                    : 'Resume'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">
                                        {nudge.description}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-500">
                                        Frequency:{' '}
                                        <span className="font-medium">
                                            {nudge.frequency}
                                        </span>{' '}
                                        <br />
                                        Time: {nudge.timeOfDay} <br />
                                        Recipients:{' '}
                                        {nudge.recipients.join(', ')}
                                    </div>
                                    <div className="mt-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                nudge.status == 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {nudge.status === 'ACTIVE'
                                                ? 'Active'
                                                : 'Paused'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                ) : (
                    "There are no nudges for this team. Why don't you create one now?"
                )}
            </div>
        </div>
    );
};
export default NudgeMain;

const CardSkeleton = () => {
    return (
        <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader className="flex flex-row justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/5 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <div className="mt-2">
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardContent>
        </Card>
    );
};
