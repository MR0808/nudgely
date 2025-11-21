export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import type { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
import siteMetadata from '@/utils/siteMetaData';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheck } from '@/lib/authCheck';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { getDashboardStats } from '@/actions/dashboard';
import { getUserTeams } from '@/actions/team';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
    const title = `Dashboard`;
    const description = 'View your company dashboard.';
    const images = [siteMetadata.siteLogo];
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteMetadata.siteUrl}/`,
            siteName: siteMetadata.title,
            locale: 'en_AU',
            type: 'article',
            publishedTime: '2024-08-15 13:00:00',
            modifiedTime: '2024-08-15 13:00:00',
            images,
            authors: [siteMetadata.author]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images
        }
    };
}

const DashboardPage = async () => {
    const { userCompany } = await authCheck();
    const teams = await getUserTeams();

    if (!teams || teams.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-2">
                            No teams found
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            You are not part of any teams. Please request to be
                            a part of a team to create a nudge.
                        </p>
                        <Link href="/">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const initialTeam =
        userCompany.role === 'COMPANY_ADMIN' ? 'all' : teams[0].id;

    const dashboardStats = await getDashboardStats(
        userCompany.role === 'COMPANY_ADMIN' ? undefined : teams[0].id
    );

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Comprehensive nudge analytics and insights
                        </p>
                    </div>
                </div>
                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardContent
                        returnTeams={teams || []}
                        initialTeam={initialTeam}
                        isAdmin={userCompany.role === 'COMPANY_ADMIN'}
                        dashboardStats={dashboardStats}
                    />
                </Suspense>
            </div>
        </div>
    );
};

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
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
    );
}

export default DashboardPage;
