export type AuditCategory =
    | 'authentication'
    | 'account'
    | 'security'
    | 'profile'
    | 'settings'
    | 'data'
    | 'system'
    | 'billing'
    | 'admin'
    | 'team'
    | 'company'
    | 'invite';

export type AuditAction =
    // Authentication actions
    | 'user.registered'
    | 'user.email_verify_requested'
    | 'user.email_verified'
    | 'user.phone_verify_requested'
    | 'user.phone_verified'
    | 'user.login'
    | 'user.logout'
    | 'user.login_failed'
    | 'user.account_locked'
    | 'user.account_unlocked'
    | 'user.password_reset_requested'
    | 'user.password_reset_completed'

    // Security actions
    | 'user.password_changed'
    | 'user.email_updated'
    | 'user.two_factor_enabled'
    | 'user.two_factor_disabled'
    | 'user.security_question_updated'
    | 'user.phone_updated'

    // Account actions
    | 'user.name_updated'
    | 'user.location_updated'
    | 'user.timezone_updated'
    | 'user.locale_updated'

    // Profile actions
    | 'user.gender_updated'
    | 'user.dateofbirth_updated'
    | 'user.picture_updated'
    | 'user.bio_updated'
    | 'user.jobTitle_updated'

    // Settings actions
    | 'user.preferences_updated'
    | 'user.notification_settings_updated'
    | 'user.privacy_settings_updated'

    // Team actions
    | 'team.team_created'
    | 'team.team_updated'
    | 'team.team_member_invited'
    | 'team.team_member_added'
    | 'team.team_member_role_updated'
    | 'team.team_member_removed'
    | 'team.team_deleted'

    // Company actions
    | 'company.company_created'
    | 'company.company_updated'
    | 'company.company_logo_updated'
    | 'company.company_admin_invited'
    | 'company.company_admin_added'
    | 'company.company_admin_removed'

    // Invite actions
    | 'invite.company_accept_invite'
    | 'invite.company_decline_invite'
    | 'invite.team_accept_invite'
    | 'invite.team_decline_invite'

    // Data actions
    | 'data.exported'
    | 'data.imported'
    | 'data.deleted'
    | 'data.backup_created'

    // System actions
    | 'system.maintenance_mode_enabled'
    | 'system.maintenance_mode_disabled'

    // Admin actions
    | 'admin.user_created'
    | 'admin.user_deleted'
    | 'admin.user_suspended'
    | 'admin.role_assigned'
    | 'admin.permission_granted';

export interface CreateAuditLogParams {
    userId?: string;
    action: AuditAction;
    category: AuditCategory;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    sessionId?: string;
}

export interface AuditLogFilters {
    userId?: string;
    category?: AuditCategory;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
    sessionId?: string;
    limit?: number;
    skip?: number;
}

export interface AuditLogResult {
    success: boolean;
    message?: string;
    error?: string;
}
