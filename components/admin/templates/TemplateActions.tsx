'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toggleTemplateActive } from '@/actions/admin/templates';

type Template = {
    id: string;
    name: string;
    isActive: boolean;
};

export function TemplateActions({ template }: { template: Template }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            await toggleTemplateActive(template.id);
            toast.success(
                template.isActive ? 'Template deactivated' : 'Template activated'
            );
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Action failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggle}>
                    {template.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
