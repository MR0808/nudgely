'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { TemplateCategory } from '@/generated/prisma';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createTeamTemplate, updateTeamTemplate } from '@/actions/template';
import { TEMPLATE_CATEGORIES } from '@/types/template';
import { TemplateFormDialogProps, TeamTemplate } from '@/types/template';

const templateFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.enum(TemplateCategory),
    isActive: z.boolean()
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

const TemplateFormDialog = ({
    open,
    onOpenChange,
    teamId,
    template,
    onSuccess
}: TemplateFormDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            name: template?.name || '',
            description: template?.description || '',
            category: template?.category || TemplateCategory.OTHER,
            isActive: template?.isActive ?? true
        }
    });

    const onSubmit = async (data: TemplateFormData) => {
        startTransition(async () => {
            const result = template
                ? await updateTeamTemplate(template.id, data)
                : await createTeamTemplate({
                      ...data,
                      teamId
                  });
            if (result.success) {
                toast.success(
                    template
                        ? 'Template updated successfully'
                        : 'Template created successfully'
                );
                form.reset();
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to save template');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {template ? 'Edit Template' : 'Create Template'}
                    </DialogTitle>
                    <DialogDescription>
                        {template
                            ? 'Update your team template'
                            : 'Create a new template for your team'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Template Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="e.g., Weekly Team Update"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Describe what this template is for..."
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {TEMPLATE_CATEGORIES.map(
                                                (category) => (
                                                    <SelectItem
                                                        key={category.value}
                                                        value={category.value}
                                                    >
                                                        {category.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Active Status
                                        </FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Make this template available for use
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? 'Saving...'
                                    : template
                                      ? 'Update Template'
                                      : 'Create Template'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TemplateFormDialog;
