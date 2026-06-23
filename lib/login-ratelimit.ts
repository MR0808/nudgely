export {
    checkLoginRateLimits,
    clearLoginRateLimit,
    recordFailedLoginAttempt
} from '@/lib/auth-ratelimit';

// Backwards-compatible alias
export { checkLoginRateLimits as checkLoginRateLimit } from '@/lib/auth-ratelimit';
