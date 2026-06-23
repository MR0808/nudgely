import { authCheckAdmin } from '@/lib/authCheck';
import { getCronStats } from '@/actions/admin/cron';
import { CronPanel } from '@/components/admin/cron/CronPanel';

export default async function AdminCronPage() {
    await authCheckAdmin('/admin/cron');
    const stats = await getCronStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Cron jobs
                </h1>
                <p className="text-muted-foreground mt-2">
                    Monitor and manually trigger scheduled jobs
                </p>
            </div>
            <CronPanel stats={stats} />
        </div>
    );
}
