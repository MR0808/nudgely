import { z } from 'zod';

export const isValidEmail = (email: string): boolean => {
    const emailSchema = z.email();
    try {
        emailSchema.parse(email);
        return true;
    } catch {
        return false;
    }
};
