import { z } from 'zod';

export const TeamSchema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(100).trim(),
    description: z.string().optional()
});
