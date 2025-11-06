import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCardsProps } from '@/types/dashboard';
import { Activity, CheckCircle2, Clock, Users } from 'lucide-react';

const StatsCards = ({ stats }: StatsCardsProps) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Nudges
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalNudges}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Currently active
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Completions
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalCompletions}
                    </div>
                    <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Completion Rate
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.completionRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Overall performance
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Pending
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.pendingInstances}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Awaiting completion
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatsCards;
