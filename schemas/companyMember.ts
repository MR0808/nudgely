import { z } from 'zod';

export const InviteCompanyAdminSchema = z.object({
    email: z.email({
        message: 'Email must be valid'
    }),
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
});
