import { z } from 'zod';

export const CompletionSchema = z.object({
    comments: z.string().optional()
});
