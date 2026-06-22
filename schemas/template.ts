import * as z from 'zod';
import { TemplateCategory } from '@/lib/prisma-enums';

export const TemplateFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.enum(
        Object.values(TemplateCategory) as [string, ...string[]]
    ),
    isActive: z.boolean()
});

export type TemplateFormData = z.infer<typeof TemplateFormSchema>;
