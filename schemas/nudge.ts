import { z } from 'zod';

// export const CreateNudgeSchema = z.object({
//     name: z.string().min(1, 'Nudge name is required').max(100).trim(),
//     description: z.string().min(1, 'Description is required').max(100).trim(),
//     team: z.string().min(1, 'Team is required').max(100).trim(),
//     frequency: z.enum(Object.values(NudgeFrequency) as [string, ...string[]]),
//     hasEndDate: z.boolean(),
//     endDate: z.date().optional(),
//     intervalCount: z.number().gte(1),
//     intervalUnit: z.enum(Object.values(IntervalUnit) as [string, ...string[]]),
//     dueHour: z.number().gte(0).lte(24),
//     timezone: z.string().min(1, 'Timezone is required').max(100).trim()
// });

export const CreateNudgeSchema = z
    .object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        teamId: z.string().min(1, 'Team is required'),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
        interval: z
            .number()
            .min(1, 'Interval must be at least 1')
            .max(365, 'Interval must be less than a year'),
        dayOfWeek: z.number().min(0).max(6).optional(),
        monthlyType: z.enum(['DAY_OF_MONTH', 'NTH_DAY_OF_WEEK']).optional(),
        dayOfMonth: z.number().min(1).max(28).optional(),
        nthOccurrence: z.number().optional(),
        dayOfWeekForMonthly: z.number().min(0).max(6).optional(),
        timeOfDay: z.string().min(1, 'Time is required'),
        timezone: z.string().min(1, 'Timezone is required'),
        endType: z.enum(['NEVER', 'ON_DATE', 'AFTER_OCCURRENCES']),
        endDate: z.string().optional(),
        endAfterOccurrences: z.number().min(1).optional(),
        recipients: z
            .array(
                z.object({
                    firstName: z.string().min(1, 'First name is required'),
                    email: z.string().email('Invalid email address')
                })
            )
            .min(1, 'At least one recipient is required')
    })
    .refine(
        (data) => {
            // Validate weekly requires dayOfWeek
            if (data.frequency === 'WEEKLY' && data.dayOfWeek === undefined) {
                return false;
            }
            return true;
        },
        {
            message: 'Day of week is required for weekly reminders',
            path: ['dayOfWeek']
        }
    )
    .refine(
        (data) => {
            // Validate monthly requires monthlyType
            if (data.frequency === 'MONTHLY' && !data.monthlyType) {
                return false;
            }
            return true;
        },
        {
            message: 'Monthly type is required for monthly reminders',
            path: ['monthlyType']
        }
    )
    .refine(
        (data) => {
            // Validate DAY_OF_MONTH requires dayOfMonth
            if (data.monthlyType === 'DAY_OF_MONTH' && !data.dayOfMonth) {
                return false;
            }
            return true;
        },
        {
            message: 'Day of month is required',
            path: ['dayOfMonth']
        }
    )
    .refine(
        (data) => {
            // Validate NTH_DAY_OF_WEEK requires nthOccurrence and dayOfWeekForMonthly
            if (
                data.monthlyType === 'NTH_DAY_OF_WEEK' &&
                (!data.nthOccurrence || data.dayOfWeekForMonthly === undefined)
            ) {
                return false;
            }
            return true;
        },
        {
            message: 'Occurrence and day of week are required',
            path: ['nthOccurrence']
        }
    )
    .refine(
        (data) => {
            // Validate ON_DATE requires endDate
            if (data.endType === 'ON_DATE' && !data.endDate) {
                return false;
            }
            return true;
        },
        {
            message: 'End date is required',
            path: ['endDate']
        }
    )
    .refine(
        (data) => {
            // Validate AFTER_OCCURRENCES requires endAfterOccurrences
            if (
                data.endType === 'AFTER_OCCURRENCES' &&
                !data.endAfterOccurrences
            ) {
                return false;
            }
            return true;
        },
        {
            message: 'Number of occurrences is required',
            path: ['endAfterOccurrences']
        }
    );

export type CreateNudgeSchemaData = z.infer<typeof CreateNudgeSchema>;
