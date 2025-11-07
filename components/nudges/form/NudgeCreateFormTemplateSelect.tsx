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

    // Group templates by category
    const templatesByCategory = categories.reduce(
        (acc, category) => {
            acc[category] = templates.filter((t) => t.category === category);
            return acc;
        },
        {} as Record<string, CombinedTemplate[]>
    );

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
                            {categories.map((category) => (
                                <SelectGroup key={category}>
                                    <SelectLabel>{category}</SelectLabel>
                                    {templatesByCategory[category].map(
                                        (template) => (
                                            <SelectItem
                                                key={template.id}
                                                value={template.id}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {template.isTeam ? (
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span>{template.name}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    )}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default NudgeCreateFormTemplateSelect;
