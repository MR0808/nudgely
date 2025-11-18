import { Suspense } from 'react';
import { CompanyList } from '@/components/admin/companies/CompanyList';
import { CompanyFilters } from '@/components/admin/companies/CompanyFilters';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { authCheckAdmin } from '@/lib/authCheck';

export default async function CompaniesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await authCheckAdmin('/admin/companies');
    const params = await searchParams;
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Companies
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage companies, subscriptions, and settings
                    </p>
                </div>
                <Button>
                    <Building2 className="h-4 w-4 mr-2" />
                    Add Company
                </Button>
            </div>

            <CompanyFilters />

            <Suspense fallback={<ListSkeleton />}>
                <CompanyList searchParams={params} />
            </Suspense>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
            ))}
        </div>
    );
}
