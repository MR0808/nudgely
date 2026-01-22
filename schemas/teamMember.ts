import { z } from 'zod';
import { TeamRole } from '@/lib/prisma-enums';

export const InviteTeamMemberSchema = z.object({
    email: z.email({
        message: 'Email must be valid'
    }),
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters'),
    role: z.enum(Object.values(TeamRole) as [string, ...string[]])
});

