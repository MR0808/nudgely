'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult } from '@/types/audit';

export async function logPasswordChanged(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.password_changed',
        category: 'security',
        description: 'User changed their password',
        metadata
    });
}

export async function logEmailUpdated(
    userId: string,
    oldEmail: string,
    newEmail: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.email_updated',
        category: 'security',
        description: 'User updated their email address',
        metadata: { ...metadata, oldEmail, newEmail }
    });
}

export async function logPhoneUpdated(
    userId: string,
    oldPhone: string,
    newPhone: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.phone_updated',
        category: 'security',
        description: 'User updated their phone number',
        metadata: { ...metadata, oldPhone, newPhone }
    });
}

export async function logTwoFactorEnabled(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.two_factor_enabled',
        category: 'security',
        description: 'Two-factor authentication enabled',
        metadata
    });
}

export async function logTwoFactorDisabled(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'user.two_factor_disabled',
        category: 'security',
        description: 'Two-factor authentication disabled',
        metadata
    });
}
