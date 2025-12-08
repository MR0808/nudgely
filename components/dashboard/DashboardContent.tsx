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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            setError(null);
            try {
                const data = await getDashboardStats(
                    selectedTeam === 'all' ? undefined : selectedTeam
                );
                setStats(data);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Unable to load dashboard data';
                setError(message);
                setStats(dashboardStats);
            } finally {
                setLoading(false);
            }
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
            {error ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Unable to load data</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Please select another team or try again later.
                        </p>
                    </CardContent>
                </Card>
            ) : loading || !stats ? (
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

                    {/* Pending / Overdue Nudges */}
                    {stats.pendingNudges && stats.pendingNudges.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Nudges Not Yet Completed</CardTitle>
                                <CardDescription>
                                    Instances that are still pending or overdue
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {stats.pendingNudges.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col gap-1 rounded-lg border p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">
                                                {item.nudgeName}
                                            </div>
                                            <div className="text-xs uppercase text-muted-foreground">
                                                {item.status.toLowerCase()}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Team: {item.teamName}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Scheduled:{' '}
                                            {new Date(
                                                item.scheduledFor
                                            ).toLocaleString()}
                                        </div>
                                        {item.overdueCount > 0 && (
                                            <div className="text-sm text-destructive">
                                                Overdue count:{' '}
                                                {item.overdueCount}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardContent;
