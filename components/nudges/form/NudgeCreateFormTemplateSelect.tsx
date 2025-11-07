'use client';

import { useFormContext } from 'react-hook-form';
import { useEffect, useState, useTransition } from 'react';
import { Building2, Globe } from 'lucide-react';

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import type { CreateNudgeSchemaData } from '@/schemas/nudge';
import { getAllTemplates } from '@/actions/template';
import {
    CombinedTemplate,
    NudgeCreateFormTemplateSelectProps
} from '@/types/template';

const NudgeCreateFormTemplateSelect = ({
    teamId,
    plan
}: NudgeCreateFormTemplateSelectProps) => {
    const form = useFormContext<CreateNudgeSchemaData>();
    const [isPending, startTransition] = useTransition();
    const [templates, setTemplates] = useState<CombinedTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (teamId) {
            startTransition(async () => {
                const result = await getAllTemplates({ teamId, plan });
                setTemplates(result.templates);
                setCategories(result.categories);
            });
        }
    }, [teamId, plan]);

    const handleTemplateSelect = (templateId: string) => {
        const selectedTemplate = templates.find((t) => t.id === templateId);
        if (selectedTemplate) {
            form.setValue('name', selectedTemplate.name);
            form.setValue('description', selectedTemplate.description);
        }
    };

    const teamTemplates = templates.filter((t) => t.isTeam);
    const globalTemplates = templates.filter((t) => !t.isTeam);

    // Group team templates by category
    const teamTemplatesByCategory = categories.reduce(
        (acc, category) => {
            const categoryTemplates = teamTemplates.filter(
                (t) => t.category === category
            );
            if (categoryTemplates.length > 0) {
                acc[category] = categoryTemplates;
            }
            return acc;
        },
        {} as Record<string, CombinedTemplate[]>
    );

    // Group global templates by category
    const globalTemplatesByCategory = categories.reduce(
        (acc, category) => {
            const categoryTemplates = globalTemplates.filter(
                (t) => t.category === category
            );
            if (categoryTemplates.length > 0) {
                acc[category] = categoryTemplates;
            }
            return acc;
        },
        {} as Record<string, CombinedTemplate[]>
    );

    const teamCategories = Object.keys(teamTemplatesByCategory);
    const globalCategories = Object.keys(globalTemplatesByCategory);

    return (
        <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-base font-semibold">
                        Template (Optional)
                    </FormLabel>
                    <Select
                        onValueChange={(value) => {
                            field.onChange(value);
                            handleTemplateSelect(value);
                        }}
                        value={field.value}
                        disabled={isPending || templates.length === 0}
                    >
                        <FormControl>
                            <SelectTrigger className="border-border text-foreground bg-white w-full">
                                <SelectValue
                                    placeholder={
                                        isPending
                                            ? 'Loading templates...'
                                            : templates.length === 0
                                              ? 'No templates available'
                                              : 'Select a template'
                                    }
                                />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {teamCategories.length > 0 && (
                                <>
                                    {teamCategories.map((category) => (
                                        <SelectGroup key={`team-${category}`}>
                                            <SelectLabel>
                                                {category} (Team)
                                            </SelectLabel>
                                            {teamTemplatesByCategory[
                                                category
                                            ].map((template) => (
                                                <SelectItem
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {template.name}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </>
                            )}

                            {globalCategories.length > 0 && (
                                <>
                                    {globalCategories.map((category) => (
                                        <SelectGroup key={`global-${category}`}>
                                            <SelectLabel>
                                                {category} (Global)
                                            </SelectLabel>
                                            {globalTemplatesByCategory[
                                                category
                                            ].map((template) => (
                                                <SelectItem
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {template.name}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default NudgeCreateFormTemplateSelect;
