'use client';

import { useEffect, useState, useTransition } from 'react';
import { Building2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTeamTemplates, deleteTeamTemplate } from '@/actions/template';
import { toast } from 'sonner';
import TemplateFormDialog from '@/components/templates/TemplateFormDialog';
import TemplateDeleteDialog from '@/components/templates/TemplateDeleteDialog';
import {
    TemplateListProps,
    TeamTemplate,
    TEMPLATE_CATEGORIES
} from '@/types/template';

const TemplateList = ({ teamId, refreshKey }: TemplateListProps) => {
    const [templates, setTemplates] = useState<TeamTemplate[]>([]);
    const [isPending, startTransition] = useTransition();
    const [editingTemplate, setEditingTemplate] = useState<TeamTemplate | null>(
        null
    );
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    useEffect(() => {
        if (teamId) {
            startTransition(async () => {
                const result = await getTeamTemplates(teamId, true);
                setTemplates(result);
            });
        }
    }, [teamId, refreshKey]);

    const handleDelete = (templateId: string, templateName: string) => {
        setTemplateToDelete({ id: templateId, name: templateName });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        startTransition(async () => {
            const result = await deleteTeamTemplate(templateToDelete.id);
            if (result.success) {
                toast.success('Template deleted successfully');
                setTemplates((prev) =>
                    prev.filter((t) => t.id !== templateToDelete.id)
                );
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
            } else {
                toast.error(result.error || 'Failed to delete template');
            }
        });
    };

    const handleEdit = (template: TeamTemplate) => {
        setEditingTemplate(template);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        setEditingTemplate(null);
        startTransition(async () => {
            const result = await getTeamTemplates(teamId, true);
            setTemplates(result);
        });
    };

    // Group templates by category
    const templatesByCategory = templates.reduce(
        (acc, template) => {
            if (!acc[template.category]) {
                acc[template.category] = [];
            }
            acc[template.category].push(template);
            return acc;
        },
        {} as Record<string, TeamTemplate[]>
    );

    const getCategoryLabel = (categoryValue: string) => {
        return (
            TEMPLATE_CATEGORIES.find((cat) => cat.value === categoryValue)
                ?.label || categoryValue
        );
    };

    if (isPending && templates.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                        Loading templates...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (templates.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                        No templates found. Create your first template to get
                        started.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {TEMPLATE_CATEGORIES.map((category) => {
                const categoryTemplates = templatesByCategory[category.value];
                if (!categoryTemplates || categoryTemplates.length === 0)
                    return null;

                return (
                    <Card key={category.value}>
                        <CardHeader>
                            <CardTitle className="text-xl">
                                {category.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {categoryTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="flex items-start justify-between p-4 bg-muted rounded-lg border"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="font-semibold">
                                                {template.name}
                                            </h3>
                                            {!template.isActive && (
                                                <Badge variant="secondary">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {template.description}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(template)}
                                            disabled={isPending}
                                            className="cursor-pointer"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleDelete(
                                                    template.id,
                                                    template.name
                                                )
                                            }
                                            disabled={isPending}
                                            className="hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}

            {editingTemplate && (
                <TemplateFormDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    teamId={teamId}
                    template={editingTemplate}
                    onSuccess={handleEditSuccess}
                />
            )}

            <TemplateDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                templateName={templateToDelete?.name || ''}
                onConfirm={confirmDelete}
                isPending={isPending}
            />
        </div>
    );
};

export default TemplateList;
