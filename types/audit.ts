export type AuditCategory =
    | 'authentication'
    | 'security'
    | 'personal'
    | 'settings'
    | 'data'
    | 'system'
    | 'billing'
    | 'admin'
    | 'event';

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

    // Personal actions
    | 'user.name_updated'
    | 'user.location_updated'
    | 'user.gender_updated'
    | 'user.dateofbirth_updated'
    | 'user.picture_updated'
    | 'user.phone_updated'

    // Settings actions
    | 'user.preferences_updated'
    | 'user.notification_settings_updated'
    | 'user.privacy_settings_updated'

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
    | 'admin.permission_granted'

    // Event actions
    | 'event.event_created'
    | 'event.activity_created';

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
