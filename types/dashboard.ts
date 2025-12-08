import { getDashboardStats } from '@/actions/dashboard';
import { getUserTeams } from '@/actions/team';

export type UserTeams = NonNullable<Awaited<ReturnType<typeof getUserTeams>>>;

export type DashboardStats = NonNullable<
    Awaited<ReturnType<typeof getDashboardStats>>
>;

export interface DashboardContentProps {
    returnTeams: UserTeams;
    initialTeam: string;
    isAdmin: boolean;
    dashboardStats: DashboardStats;
}

export interface StatsCardsProps {
    stats: {
        totalNudges: number;
        totalCompletions: number;
        completionRate: number;
        pendingInstances: number;
    };
}

export interface CompletionsChartProps {
    data: Array<{ date: string; count: number }>;
}

export interface FrequencyChartProps {
    data: Array<{ frequency: string; count: number }>;
}

export interface StatusChartProps {
    data: Array<{ status: string; count: number }>;
}

export interface TeamPerformanceChartProps {
    data: Array<{ teamName: string; completionRate: number }>;
}

export interface TopNudgesChartProps {
    data: Array<{
        nudgeName: string;
        completions: number;
        completionRate: number;
    }>;
}

export interface RecentCompletionsTableProps {
    data: Array<{
        id: string;
        nudgeName: string;
        completedBy: string;
        completedAt: Date;
        scheduledFor: Date;
    }>;
}

export interface ActiveRecipientsTableProps {
    data: Array<{
        email: string;
        name: string;
        completions: number;
        totalSent: number;
        completionRate: number;
    }>;
}

export interface NudgesNeedingAttentionProps {
    data: Array<{
        nudgeId: string;
        nudgeName: string;
        status: string;
        completionRate: number;
        overdueCount: number;
        lastInstanceDate: Date | null;
    }>;
}

export interface PendingNudgesTableProps {
    data: Array<{
        id: string;
        nudgeId: string;
        nudgeName: string;
        teamName: string;
        scheduledFor: Date;
        status: string;
        overdueCount: number;
    }>;
}
