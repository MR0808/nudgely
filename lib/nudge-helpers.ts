import { Frequency, MonthlyType, EndType } from '@/generated/prisma';

/**
 * Calculate the next occurrence date for a nudge based on its frequency settings
 * Now properly accounts for intervals by calculating from the last occurrence
 */
export function calculateNextOccurrence(nudge: {
    frequency: Frequency;
    interval: number;
    timeOfDay: string;
    timezone: string;
    dayOfWeek?: number | null;
    monthlyType?: MonthlyType | null;
    dayOfMonth?: number | null;
    nthOccurrence?: number | null;
    dayOfWeekForMonthly?: number | null;
    lastInstanceCreatedAt?: Date | null;
    startDate: Date;
}): Date | null {
    const now = new Date();

    let timeString = nudge.timeOfDay;
    if (timeString.includes('AM') || timeString.includes('PM')) {
        timeString = convertTo24Hour(timeString);
    }
    const [hours, minutes] = timeString.split(':').map(Number);

    // Convert current time to nudge's timezone
    const nudgeTime = new Date(
        now.toLocaleString('en-US', { timeZone: nudge.timezone })
    );

    // Use last instance date or start date as reference point
    const referenceDate = nudge.lastInstanceCreatedAt || nudge.startDate;

    let nextDate: Date;

    if (nudge.frequency === Frequency.DAILY) {
        // Daily frequency: every X days from reference date
        nextDate = new Date(referenceDate);
        nextDate.setHours(hours, minutes, 0, 0);

        // Calculate how many intervals have passed since reference date
        const daysSinceReference = Math.floor(
            (nudgeTime.getTime() - referenceDate.getTime()) /
                (1000 * 60 * 60 * 24)
        );
        const intervalsPassed = Math.floor(daysSinceReference / nudge.interval);

        // Calculate next occurrence based on intervals
        const daysToAdd = (intervalsPassed + 1) * nudge.interval;
        nextDate = new Date(referenceDate);
        nextDate.setDate(referenceDate.getDate() + daysToAdd);
        nextDate.setHours(hours, minutes, 0, 0);
    } else if (nudge.frequency === Frequency.WEEKLY) {
        // Weekly frequency: every X weeks on specific day from reference date
        if (nudge.dayOfWeek === null || nudge.dayOfWeek === undefined) {
            return null;
        }

        // Find the first occurrence of target day on or after reference date
        const candidateDate = new Date(referenceDate);
        candidateDate.setHours(hours, minutes, 0, 0);

        const refDay = candidateDate.getDay();
        const targetDay = nudge.dayOfWeek;
        const daysToAdd = (targetDay - refDay + 7) % 7;

        candidateDate.setDate(candidateDate.getDate() + daysToAdd);

        // Check if candidateDate is today and within a reasonable window (past 2 hours)
        const nudgeTimeMs = nudgeTime.getTime();
        const candidateDateMs = candidateDate.getTime();
        const hoursSinceCandidate =
            (nudgeTimeMs - candidateDateMs) / (1000 * 60 * 60);

        // If we're on the same day as the candidate and within 2 hours after scheduled time,
        // this IS the occurrence we should process
        if (hoursSinceCandidate >= 0 && hoursSinceCandidate < 2) {
            nextDate = candidateDate;
        } else {
            // Calculate how many week-intervals have passed since the first occurrence
            const weeksSinceFirst = Math.floor(
                (nudgeTimeMs - candidateDateMs) / (1000 * 60 * 60 * 24 * 7)
            );
            const intervalsPassed = Math.floor(
                weeksSinceFirst / nudge.interval
            );

            // Calculate next occurrence
            nextDate = new Date(candidateDate);
            nextDate.setDate(
                candidateDate.getDate() +
                    (intervalsPassed + 1) * nudge.interval * 7
            );
        }
    } else if (nudge.frequency === Frequency.MONTHLY) {
        // Monthly frequency: every X months on specific day or nth occurrence from reference date
        nextDate = new Date(referenceDate);
        nextDate.setHours(hours, minutes, 0, 0);

        if (nudge.monthlyType === MonthlyType.DAY_OF_MONTH) {
            // Specific day of month (e.g., 15th of every month)
            if (!nudge.dayOfMonth) {
                return null;
            }

            // Find first occurrence on or after reference date
            const candidateDate = new Date(referenceDate);
            candidateDate.setDate(nudge.dayOfMonth);
            candidateDate.setHours(hours, minutes, 0, 0);

            if (candidateDate < referenceDate) {
                candidateDate.setMonth(candidateDate.getMonth() + 1);
                candidateDate.setDate(nudge.dayOfMonth);
            }

            // Handle months with fewer days
            if (candidateDate.getDate() !== nudge.dayOfMonth) {
                candidateDate.setDate(0); // Last day of previous month
            }

            // Calculate how many month-intervals have passed
            const monthsSinceFirst =
                (nudgeTime.getFullYear() - candidateDate.getFullYear()) * 12 +
                (nudgeTime.getMonth() - candidateDate.getMonth());
            const intervalsPassed = Math.floor(
                monthsSinceFirst / nudge.interval
            );

            // Calculate next occurrence
            nextDate = new Date(candidateDate);
            nextDate.setMonth(
                candidateDate.getMonth() +
                    (intervalsPassed + 1) * nudge.interval
            );
            nextDate.setDate(nudge.dayOfMonth);

            // Handle months with fewer days again
            if (nextDate.getDate() !== nudge.dayOfMonth) {
                nextDate.setDate(0);
            }
        } else if (nudge.monthlyType === MonthlyType.NTH_DAY_OF_WEEK) {
            // Nth occurrence of a day (e.g., 3rd Wednesday of every month)
            if (
                nudge.nthOccurrence === null ||
                nudge.nthOccurrence === undefined ||
                nudge.dayOfWeekForMonthly === null ||
                nudge.dayOfWeekForMonthly === undefined
            ) {
                return null;
            }

            // Find first occurrence on or after reference date
            let candidateDate = new Date(referenceDate);
            candidateDate = findNthDayOfWeek(
                candidateDate,
                nudge.nthOccurrence,
                nudge.dayOfWeekForMonthly
            );
            candidateDate.setHours(hours, minutes, 0, 0);

            if (candidateDate < referenceDate) {
                candidateDate.setMonth(candidateDate.getMonth() + 1);
                candidateDate = findNthDayOfWeek(
                    candidateDate,
                    nudge.nthOccurrence,
                    nudge.dayOfWeekForMonthly
                );
                candidateDate.setHours(hours, minutes, 0, 0);
            }

            // Calculate how many month-intervals have passed
            const monthsSinceFirst =
                (nudgeTime.getFullYear() - candidateDate.getFullYear()) * 12 +
                (nudgeTime.getMonth() - candidateDate.getMonth());
            const intervalsPassed = Math.floor(
                monthsSinceFirst / nudge.interval
            );

            // Calculate next occurrence
            nextDate = new Date(candidateDate);
            nextDate.setMonth(
                candidateDate.getMonth() +
                    (intervalsPassed + 1) * nudge.interval
            );
            nextDate = findNthDayOfWeek(
                nextDate,
                nudge.nthOccurrence,
                nudge.dayOfWeekForMonthly
            );
            nextDate.setHours(hours, minutes, 0, 0);
        } else {
            return null;
        }
    } else {
        return null;
    }

    // Ensure we don't return a date before the start date
    if (nextDate < nudge.startDate) {
        return nudge.startDate;
    }

    return nextDate;
}

/**
 * Find the nth occurrence of a specific day of week in a month
 * @param date - Base date (month/year will be used)
 * @param nth - Which occurrence (1 = first, 2 = second, 3 = third, 4 = fourth, -1 = last)
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, etc.)
 */
export function findNthDayOfWeek(
    date: Date,
    nth: number,
    dayOfWeek: number
): Date {
    const result = new Date(date);
    const month = result.getMonth();

    // Start at first day of month
    result.setDate(1);

    // Find first occurrence of the target day
    while (result.getDay() !== dayOfWeek) {
        result.setDate(result.getDate() + 1);
    }

    // Handle last occurrence (-1)
    if (nth === -1) {
        // Keep moving forward by weeks until we're in the next month
        let lastOccurrence = new Date(result);
        while (true) {
            const nextWeek = new Date(lastOccurrence);
            nextWeek.setDate(nextWeek.getDate() + 7);
            if (nextWeek.getMonth() !== month) {
                break;
            }
            lastOccurrence = nextWeek;
        }
        return lastOccurrence;
    } else {
        // Move to nth occurrence (1-indexed)
        result.setDate(result.getDate() + (nth - 1) * 7);

        // Verify we're still in the same month
        if (result.getMonth() !== month) {
            throw new Error(
                `No ${nth}th ${getDayName(dayOfWeek)} in this month`
            );
        }

        return result;
    }
}

/**
 * Check if a nudge has reached its end condition
 */
export async function hasNudgeEnded(
    nudge: {
        endType: EndType;
        endDate?: Date | null;
        endAfterOccurrences?: number | null;
    },
    instanceCount: number
): Promise<boolean> {
    if (nudge.endType === EndType.NEVER) {
        return false;
    }

    if (nudge.endType === EndType.ON_DATE && nudge.endDate) {
        return new Date() > nudge.endDate;
    }

    if (
        nudge.endType === EndType.AFTER_OCCURRENCES &&
        nudge.endAfterOccurrences
    ) {
        return instanceCount >= nudge.endAfterOccurrences;
    }

    return false;
}

/**
 * Generate a unique token for reminder events
 */
export function generateReminderToken(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    const randomStr2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}${randomStr2}`;
}

/**
 * Convert 12-hour time format to 24-hour format
 * @param time12h - Time in "HH:mm AM/PM" format
 * @returns Time in "HH:mm" 24-hour format
 */
export function convertTo24Hour(time12h: string): string {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get day name from day number
 */
function getDayName(dayOfWeek: number): string {
    const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];
    return days[dayOfWeek] || 'Unknown';
}

/**
 * Format a date in a specific timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
    return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Check if we should create a new instance for a nudge
 */
export function shouldCreateInstance(
    nudge: {
        startDate: Date;
        lastInstanceCreatedAt?: Date | null;
    },
    nextOccurrence: Date
): boolean {
    // Don't create if before start date
    if (nextOccurrence < nudge.startDate) {
        return false;
    }

    // Don't create if we already created an instance very recently (within last hour)
    // This prevents duplicate instances if cron runs multiple times
    if (nudge.lastInstanceCreatedAt) {
        const hoursSinceLastCreation =
            (Date.now() - nudge.lastInstanceCreatedAt.getTime()) /
            (1000 * 60 * 60);
        if (hoursSinceLastCreation < 1) {
            return false;
        }
    }

    // This accounts for cron delays, server time drift, and processing time
    const hoursUntilOccurrence =
        (nextOccurrence.getTime() - Date.now()) / (1000 * 60 * 60);

    // Accept occurrences from 2 hours ago up to 24 hours in the future
    if (hoursUntilOccurrence < -2 || hoursUntilOccurrence > 24) {
        return false;
    }

    return true;
}

/**
 * Check if a nudge should be sent now based on its schedule and interval
 * This is the main function the cron job uses to determine if a nudge is due
 */
export function shouldSendNudge(nudge: {
    frequency: Frequency;
    interval: number;
    timeOfDay: string;
    timezone: string;
    dayOfWeek?: number | null;
    monthlyType?: MonthlyType | null;
    dayOfMonth?: number | null;
    nthOccurrence?: number | null;
    dayOfWeekForMonthly?: number | null;
    lastInstanceCreatedAt?: Date | null;
    startDate: Date;
}): boolean {
    // Calculate the next occurrence based on interval-aware logic
    const nextOccurrence = calculateNextOccurrence(nudge);

    if (!nextOccurrence) {
        return false;
    }

    // Check if we should create an instance for this occurrence
    return shouldCreateInstance(nudge, nextOccurrence);
}
