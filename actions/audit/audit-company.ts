'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logCompanyCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_created',
        category: 'company',
        description: `Company created`,
        metadata: { ...metadata }
    });
}

export async function logCompanyUpdated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_updated',
        category: 'company',
        description: `Company updated`,
        metadata: { ...metadata }
    });
}

export async function logCompanyLogoUpdated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_logo_updated',
        category: 'company',
        description: `Company logo updated`,
        metadata: { ...metadata }
    });
}

export async function logCompanyAdminAdded(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_admin_added',
        category: 'company',
        description: `Company admin added`,
        metadata: { ...metadata }
    });
}

export async function logCompanyAdminRemoved(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_admin_removed',
        category: 'company',
        description: `Company admin removed`,
        metadata: { ...metadata }
    });
}

export async function logCompanyAdminInvited(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'company.company_admin_invited',
        category: 'company',
        description: `Company admin invited`,
        metadata: { ...metadata }
    });
}
