import * as z from 'zod';

export const GenderSchema = z.object({
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOTSAY'], {
        message: 'Gender is required'
    })
});

export const DateOfBirthSchema = z.object({
    dateOfBirth: z.date({ message: 'Date of birth is required' })
});

export const ProfilePictureSchema = z.object({
    image: typeof window === 'undefined' ? z.any() : z.instanceof(FileList)
});

export const BioSchema = z.object({
    bio: z.string({ message: 'Bio is required' })
});

export const JobTitleSchema = z.object({
    jobTitle: z.string({ message: 'Job title is required' })
});
