import { getTemplates } from '@/actions/admin/templates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/Pagination';
import { TemplateActions } from '@/components/admin/templates/TemplateActions';

export async function TemplateList({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { templates, totalCount } = await getTemplates(searchParams);
    const currentPage = parseInt((searchParams.page as string) || '1', 10);
    const pageSize = parseInt((searchParams.pageSize as string) || '20', 10);

    if (templates.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No templates found</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {templates.map((template) => (
                    <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">
                                        {template.name}
                                    </p>
                                    <Badge variant="secondary">
                                        {template.tier}
                                    </Badge>
                                    <Badge variant="outline">
                                        {template.category}
                                    </Badge>
                                    {!template.isActive && (
                                        <Badge variant="destructive">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {template.description}
                                </p>
                            </div>
                            <TemplateActions template={template} />
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
