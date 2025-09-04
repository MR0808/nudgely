import { z } from 'zod';

import libphonenumber from 'google-libphonenumber';

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const phoneNumberSchema = z
    .string()
    .nonempty({ message: 'Phone number is required' })
    .refine(
        (number) => {
            try {
                const phoneNumber = phoneUtil.parse(number);
                return phoneUtil.isValidNumber(phoneNumber);
            } catch (error) {
                return false;
            }
        },
        { message: 'Phone mobile number' }
    );

export const CompanyOnboardingSchema = z.object({
    // Step 1: Basic Information
    logo: z.string().optional(),
    name: z
        .string()
        .min(1, 'Company name is required')
        .max(100, 'Company name must be less than 100 characters'),

    // Step 2: Address Information
    address1: z
        .string()
        .min(1, 'Address line 1 is required')
        .max(200, 'Address must be less than 200 characters'),
    address2: z
        .string()
        .max(200, 'Address must be less than 200 characters')
        .optional(),
    city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City must be less than 100 characters'),
    state: z
        .string()
        .min(1, 'State/Province is required')
        .max(100, 'State must be less than 100 characters'),
    postalCode: z
        .string()
        .min(1, 'Postal code is required')
        .max(20, 'Postal code must be less than 20 characters'),
    country: z.string().min(1, 'Country is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    locale: z.string({ message: 'Locale/Language is required' }),

    // Step 3: Contact Information
    contactEmail: z.email('Please enter a valid email address'),
    contactPhone: phoneNumberSchema,

    // Step 4: Additional Information
    website: z
        .string()
        .url('Please enter a valid URL')
        .optional()
        .or(z.literal('')),
    companySize: z.string().optional(),
    industry: z.string().optional()
});

export type CompanyOnboardingData = z.infer<typeof CompanyOnboardingSchema>;

// Individual step schemas for validation
export const step1Schema = CompanyOnboardingSchema.pick({
    logo: true,
    name: true
});

export const step2Schema = CompanyOnboardingSchema.pick({
    address1: true,
    address2: true,
    city: true,
    state: true,
    postalCode: true,
    country: true,
    timezone: true,
    locale: true
});

export const step3Schema = CompanyOnboardingSchema.pick({
    contactEmail: true,
    contactPhone: true
});

export const step4Schema = CompanyOnboardingSchema.pick({
    website: true,
    companySize: true,
    industry: true
});
