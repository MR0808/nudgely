export const CRON_BUDGET_MS = parseInt(
    process.env.CRON_BUDGET_MS ?? '50000',
    10
);

export const NUDGE_BATCH_SIZE = parseInt(
    process.env.CRON_NUDGE_BATCH_SIZE ?? '40',
    10
);

export const REMINDER_BATCH_SIZE = parseInt(
    process.env.CRON_REMINDER_BATCH_SIZE ?? '50',
    10
);

export const RECIPIENT_CONCURRENCY = parseInt(
    process.env.CRON_RECIPIENT_CONCURRENCY ?? '6',
    10
);
