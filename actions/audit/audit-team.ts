'use server';

import { logAuditEvent } from './audit';
import type { AuditLogResult, AuditAction } from '@/types/audit';

export async function logTeamCreated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_created',
        category: 'team',
        description: `Team created`,
        metadata: { ...metadata }
    });
}

export async function logTeamUpdated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_updated',
        category: 'team',
        description: `Team updated`,
        metadata: { ...metadata }
    });
}

export async function logTeamMemberInvited(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_member_invited',
        category: 'team',
        description: `Team member invited`,
        metadata: { ...metadata }
    });
}

export async function logTeamMemberAdded(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_member_added',
        category: 'team',
        description: `Team member added`,
        metadata: { ...metadata }
    });
}

export async function logTeamMemberRoleUpdated(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_member_role_updated',
        category: 'team',
        description: `Team member role updated`,
        metadata: { ...metadata }
    });
}

export async function logTeamMemberRemoved(
    userId: string,
    metadata?: Record<string, any>
): Promise<AuditLogResult> {
    return await logAuditEvent({
        userId,
        action: 'team.team_member_removed',
        category: 'team',
        description: `Team member removed`,
        metadata: { ...metadata }
    });
}
