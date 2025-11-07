'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import TemplateList from '@/components/templates/TemplateList';
import TemplateFormDialog from '@/components/templates/TemplateFormDialog';
import { TemplateManagementProps } from '@/types/template';

export default function TemplateManagement({
    teams,
    plan
}: TemplateManagementProps) {
    const [selectedTeamId, setSelectedTeamId] = useState<string>(
        teams[0]?.id || ''
    );
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const isPro = plan.name !== 'Free';

    const handleTemplateCreated = () => {
        setRefreshKey((prev) => prev + 1);
        setIsCreateDialogOpen(false);
    };

    if (!isPro) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">
                        Template Management
                    </CardTitle>
                    <CardDescription>
                        Manage custom templates for your team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold mb-2">
                            Pro Feature
                        </h3>
                        <p className="text-muted-foreground">
                            Team templates are only available on the Pro plan.
                            Upgrade to create custom templates for your team.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">
                        Template Management
                    </CardTitle>
                    <CardDescription>
                        Create and manage templates for your team
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold mb-2 block">
                                Select Team
                            </label>
                            <Select
                                value={selectedTeamId}
                                onValueChange={setSelectedTeamId}
                            >
                                <SelectTrigger className="w-full max-w-md">
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map((team) => (
                                        <SelectItem
                                            key={team.id}
                                            value={team.id}
                                        >
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="mt-6 cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedTeamId && (
                <TemplateList teamId={selectedTeamId} refreshKey={refreshKey} />
            )}

            <TemplateFormDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                teamId={selectedTeamId}
                onSuccess={handleTemplateCreated}
            />
        </div>
    );
}
