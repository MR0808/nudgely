import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';
import { TemplateList } from '@/components/admin/templates/TemplateList';

export default async function AdminTemplatesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/templates');
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Global templates
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage the template library available to all companies
                </p>
            </div>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <TemplateList searchParams={params} />
            </Suspense>
        </div>
    );
}
