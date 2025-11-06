'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { DashboardContentProps, DashboardStats } from '@/types/dashboard';
import StatsCards from '@/components/dashboard/StatsCards';
import { getDashboardStats } from '@/actions/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import CompletionsChart from '@/components/dashboard/CompletionsChart';
import FrequencyChart from '@/components/dashboard/FrequencyChart';
import StatusChart from '@/components/dashboard/StatusChart';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import TopNudgesChart from '@/components/dashboard/TopNudgesChart';
import RecentCompletionsTable from '@/components/dashboard/RecentCompletionsTable';
import ActiveRecipientsTable from '@/components/dashboard/ActiveRecipientsTable';
import NudgesNeedingAttention from '@/components/dashboard/NudgesNeedingAttention';

const DashboardContent = ({
    returnTeams,
    initialTeam,
    isAdmin,
    dashboardStats
}: DashboardContentProps) => {
    const [selectedTeam, setSelectedTeam] = useState(initialTeam);
    const [stats, setStats] = useState<DashboardStats>(dashboardStats);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            const data = await getDashboardStats(
                selectedTeam === 'all' ? undefined : selectedTeam
            );
            setStats(data);
            setLoading(false);
        }
        loadStats();
    }, [selectedTeam]);

    return (
        <div className="space-y-6">
            {/* Team Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter by Team</CardTitle>
                    <CardDescription>
                        View stats for the entire company or a specific team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedTeam}
                        onValueChange={setSelectedTeam}
                    >
                        <SelectTrigger className="w-full md:w-64">
                            <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                            {isAdmin && (
                                <SelectItem value="all">
                                    All Teams (Company-wide)
                                </SelectItem>
                            )}
                            {returnTeams.map((team: any) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            {loading || !stats ? (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-64 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Overview Stats */}
                    <StatsCards stats={stats.overview} />

                    {/* Charts Row 1 */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <CompletionsChart data={stats.completionsOverTime} />
                        <FrequencyChart data={stats.nudgesByFrequency} />
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <StatusChart data={stats.nudgesByStatus} />
                        <TeamPerformanceChart data={stats.teamPerformance} />
                    </div>

                    {/* Top Nudges */}
                    <TopNudgesChart data={stats.topNudges} />

                    {/* Tables */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <RecentCompletionsTable
                            data={stats.recentCompletions}
                        />
                        <ActiveRecipientsTable data={stats.activeRecipients} />
                    </div>

                    {/* Nudges Needing Attention */}
                    <NudgesNeedingAttention
                        data={stats.nudgesNeedingAttention}
                    />
                </>
            )}
        </div>
    );
};

export default DashboardContent;
