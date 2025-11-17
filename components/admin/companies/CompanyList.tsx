import { getCompanies } from '@/actions/admin/companies';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';
import { CompanyActions } from '@/components/admin/companies/CompanyActions';
import { getPlans } from '@/actions/admin/plans';

export async function CompanyList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const [{ companies, totalCount }, plans] = await Promise.all([
        getCompanies(searchParams),
        getPlans()
    ]);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    if (companies.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No companies found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {companies.map((company) => (
                    <Card key={company.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold truncate">
                                        {company.name}
                                    </h3>
                                    <Badge
                                        variant={
                                            company.status === 'ACTIVE'
                                                ? 'outline'
                                                : company.status === 'DISABLED'
                                                  ? 'secondary'
                                                  : 'destructive'
                                        }
                                    >
                                        {company.status}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {company.plan.name}
                                    </Badge>
                                    {company.companySubscription?.status && (
                                        <Badge
                                            variant={
                                                company.companySubscription
                                                    .status === 'active'
                                                    ? 'default'
                                                    : company
                                                            .companySubscription
                                                            .status === 'trial'
                                                      ? 'outline'
                                                      : 'destructive'
                                            }
                                        >
                                            {company.companySubscription.status}
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Members
                                        </p>
                                        <p className="font-medium">
                                            {company._count.members}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Teams
                                        </p>
                                        <p className="font-medium">
                                            {company._count.teams}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Industry
                                        </p>
                                        <p className="font-medium">
                                            {company.industry?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Created
                                        </p>
                                        <p className="font-medium">
                                            {new Date(
                                                company.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {company.trialEndsAt && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        Trial ends:{' '}
                                        {new Date(
                                            company.trialEndsAt
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <CompanyActions company={company} plans={plans} />
                        </div>
                    </Card>
                ))}
            </div>

            <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
            />
        </div>
    );
}
