import * as z from 'zod';

export const NameSchema = z.object({
    name: z.string().min(1, {
        message: 'First name is required'
    }),
    lastName: z.string().min(1, {
        message: 'Last name is required'
    })
});

export const LocationSchema = z.object({
    country: z.string({ message: 'Country is required' }),
    region: z.optional(z.string({ message: 'State is required' }))
});

export const TimezoneSchema = z.object({
    timezone: z.string({ message: 'Timezone is required' })
});

export const LocaleSchema = z.object({
    locale: z.string({ message: 'Locale/Language is required' })
});
