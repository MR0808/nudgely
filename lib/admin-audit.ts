'use server';

import { logAuditEvent } from '@/actions/audit/audit';
import type { AuditAction } from '@/types/audit';

export async function logAdminAction(
    adminUserId: string,
    action: AuditAction,
    description: string,
    metadata?: Record<string, unknown>
) {
    await logAuditEvent({
        userId: adminUserId,
        action,
        category: 'admin',
        description,
        metadata: metadata ?? {}
    });
}
