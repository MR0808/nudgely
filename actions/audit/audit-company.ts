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
