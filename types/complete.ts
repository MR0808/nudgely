export interface CompleteNudgeResult {
    success: boolean;
    message: string;
    error?:
        | 'TOKEN_NOT_FOUND'
        | 'TOKEN_EXPIRED'
        | 'ALREADY_COMPLETED'
        | 'DATABASE_ERROR';
    nudgeName?: string;
    nudgeDescription?: string;
    completedAt?: string;
    completedBy?: string;
    nextScheduled?: string;
}

export interface CompletionFormProps {
    token: string;
    nudgeName: string;
    nudgeDescription: string | null;
    recipientName: string;
    scheduledFor: Date;
}
