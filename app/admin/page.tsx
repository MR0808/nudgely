import { Suspense } from 'react';

import { authCheckAdmin } from '@/lib/authCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    Building2,
    Users2,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Clock,
    FileText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats } from '@/actions/admin';
import { cn } from '@/lib/utils';

const AdminDashboard = async () => {
    await authCheckAdmin('/admin');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                    Overview of your platform metrics and system health
                </p>
            </div>

            <Suspense fallback={<StatsLoading />}>
                <DashboardStats />
            </Suspense>
        </div>
    );
};

async function DashboardStats() {
    const stats = await getDashboardStats();

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            description: `${stats.activeUsers} active`,
            trend: stats.userGrowth
        },
        {
            title: 'Companies',
            value: stats.totalCompanies,
            icon: Building2,
            description: `${stats.activeCompanies} active`,
            trend: stats.companyGrowth
        },
        {
            title: 'Teams',
            value: stats.totalTeams,
            icon: Users2,
            description: `${stats.activeTeams} active`,
            trend: stats.teamGrowth
        },
        {
            title: 'Active Subscriptions',
            value: stats.activeSubscriptions,
            icon: CreditCard,
            description: `$${stats.mrr.toLocaleString()} MRR`,
            trend: stats.subscriptionGrowth
        },
        {
            title: 'Active Nudges',
            value: stats.activeNudges,
            icon: Clock,
            description: `${stats.pendingInstances} pending`,
            trend: null
        },
        {
            title: 'Templates',
            value: stats.totalTemplates,
            icon: FileText,
            description: `${stats.activeTemplates} active`,
            trend: null
        }
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stat.value.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                                {stat.trend !== null && (
                                    <span
                                        className={cn(
                                            'text-xs font-medium flex items-center gap-1',
                                            stat.trend >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        )}
                                    >
                                        <TrendingUp className="h-3 w-3" />
                                        {stat.trend > 0 ? '+' : ''}
                                        {stat.trend}%
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {stats.systemAlerts.length > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                            <AlertCircle className="h-5 w-5" />
                            System Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {stats.systemAlerts.map((alert, index) => (
                                <li
                                    key={index}
                                    className="text-sm text-orange-800 dark:text-orange-200"
                                >
                                    • {alert}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

function StatsLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default AdminDashboard;
