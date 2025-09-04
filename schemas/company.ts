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

export const EditCompanySchema = z.object({
    name: z
        .string()
        .min(1, 'Company name is required')
        .min(2, 'Company name must be at least 2 characters')
        .max(100, 'Company name must be less than 100 characters'),
    contactEmail: z.email('Please enter a valid email address'),
    contactPhone: phoneNumberSchema,
    address1: z.string().max(200, 'Address must be less than 200 characters'),
    address2: z
        .string()
        .max(200, 'Address must be less than 200 characters')
        .optional(),
    city: z.string().max(100, 'City must be less than 100 characters'),
    region: z.string(),
    country: z.string(),
    postalCode: z
        .string()
        .max(50, 'Postal code must be less than 50 characters'),
    website: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val.trim() === '') return true; // Optional field
            try {
                new URL(val);
                return true;
            } catch {
                return false;
            }
        }, 'Please enter a valid website URL'),
    industry: z.string(),
    companySize: z.string()
});
