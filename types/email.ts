export interface SendDailySummaryEmailOptions {
    adminEmail: string;
    date: string;
    totalNudgesSent: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalCompletions: number;
    totalActiveNudges: number;
    totalFinishedNudges: number;
    teamStats: Array<{
        teamName: string;
        nudgesSent: number;
        emailsSent: number;
        emailsFailed: number;
        completions: number;
    }>;
}
