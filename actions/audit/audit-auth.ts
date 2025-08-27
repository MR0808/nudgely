'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult } from '@/types/audit';

/**
 * Authentication audit actions
 */
export async function logUserRegistered(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.registered',
        category: 'authentication',
        description: 'User registered successfully',
        metadata
    });
}

export async function logEmailVerifyRequested(
    userId: string,
    email: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.email_verify_requested',
        category: 'authentication',
        description: 'User reuqested to verify their email address',
        metadata: { ...metadata, email }
    });
}

export async function logEmailVerified(
    userId: string,
    email: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.email_verified',
        category: 'authentication',
        description: 'User verified their email address',
        metadata: { ...metadata, email }
    });
}

export async function logPhoneVerifyRequested(
    userId: string,
    phoneNumber: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.phone_verify_requested',
        category: 'authentication',
        description: 'User reuqested to verify their phone',
        metadata: { ...metadata, phoneNumber }
    });
}

export async function logPhoneVerified(
    userId: string,
    phoneNumber: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.phone_verified',
        category: 'authentication',
        description: 'User verified their phone',
        metadata: { ...metadata, phoneNumber }
    });
}

export async function logUserLogin(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.login',
        category: 'authentication',
        description: 'User logged in successfully',
        metadata
    });
}

export async function logUserLogout(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.logout',
        category: 'authentication',
        description: 'User logged out',
        metadata
    });
}

export async function logLoginFailed(
    email: string,
    ipAddress?: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        action: 'user.login_failed',
        category: 'authentication',
        description: `Failed login attempt for ${email}`,
        ipAddress,
        metadata: { ...metadata, email }
    });
}

export async function logAccountLocked(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.account_locked',
        category: 'authentication',
        description:
            'User account was locked due to multiple failed login attempts',
        metadata
    });
}

export async function logPasswordResetRequested(
    email: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        action: 'user.password_reset_requested',
        category: 'authentication',
        description: `Password reset requested for ${email}`,
        metadata: { ...metadata, email }
    });
}

export async function logPasswordResetCompleted(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.password_reset_completed',
        category: 'authentication',
        description: 'Password reset completed successfully',
        metadata
    });
}
