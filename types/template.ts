import { getUserTeams } from '@/actions/team';
import { Plan, TemplateCategory } from '@/generated/prisma';

export type UserTeams = NonNullable<Awaited<ReturnType<typeof getUserTeams>>>;

export type GlobalTemplate = {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    tier: string;
    isActive: boolean;
};

export type TeamTemplate = {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    isActive: boolean;
};

export type CombinedTemplate = {
    id: string;
    name: string;
    description: string;
    category: string;
    isTeam: boolean;
};

export type NudgeCreateFormTemplateSelectProps = {
    teamId: string;
    plan: Plan;
};

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] =
    [
        { value: TemplateCategory.ADMIN, label: 'Admin' },
        { value: TemplateCategory.EVENTS, label: 'Events' },
        { value: TemplateCategory.FINANCE, label: 'Finance' },
        { value: TemplateCategory.HR, label: 'HR' },
        { value: TemplateCategory.LEADERSHIP, label: 'Leadership' },
        { value: TemplateCategory.MARKETING, label: 'Marketing' },
        { value: TemplateCategory.MEETINGS, label: 'Meetings' },
        { value: TemplateCategory.OPERATIONS, label: 'Operations' },
        { value: TemplateCategory.PERSONAL, label: 'Personal' },
        { value: TemplateCategory.PR, label: 'PR' },
        { value: TemplateCategory.PRODUCTIVITY, label: 'Productivity' },
        {
            value: TemplateCategory.PROJECTMANAGEMENT,
            label: 'Project Management'
        },
        { value: TemplateCategory.REPORTS, label: 'Reports' },
        { value: TemplateCategory.TEAM, label: 'Team Updates' },
        { value: TemplateCategory.OTHER, label: 'Other' }
    ];

export interface TemplateManagementProps {
    teams: UserTeams;
    plan: Plan;
}

export interface TemplateListProps {
    teamId: string;
    refreshKey: number;
}

export interface TemplateFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    template?: TeamTemplate;
    onSuccess: () => void;
}

export interface TemplateDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateName: string;
    onConfirm: () => void;
    isPending: boolean;
}
