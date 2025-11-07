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

    // Get current date/time components in the nudge's timezone
    const nowInTimezone = getDateComponentsInTimezone(now, nudge.timezone);

    // Use last instance date or start date as reference point
    const referenceDate = nudge.lastInstanceCreatedAt || nudge.startDate;

    let nextDate: Date;

    if (nudge.frequency === Frequency.DAILY) {
        // Daily frequency: every X days from reference date
        nextDate = new Date(referenceDate);
        nextDate.setHours(hours, minutes, 0, 0);

        // Calculate how many intervals have passed since reference date
        const daysSinceReference = Math.floor(
            (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
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
        const nudgeTimeMs = now.getTime();
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
        if (nudge.monthlyType === MonthlyType.DAY_OF_MONTH) {
            if (!nudge.dayOfMonth) {
                return null;
            }

            // Get reference date components in the nudge's timezone
            const refComponents = getDateComponentsInTimezone(
                referenceDate,
                nudge.timezone
            );

            // Start with current month and the target day
            let candidateYear = nowInTimezone.year;
            let candidateMonth = nowInTimezone.month;
            const candidateDay = nudge.dayOfMonth;

            // If we're past the target day this month, or it's the target day but past the time, move to next month
            if (
                nowInTimezone.day > nudge.dayOfMonth ||
                (nowInTimezone.day === nudge.dayOfMonth &&
                    (nowInTimezone.hour > hours ||
                        (nowInTimezone.hour === hours &&
                            nowInTimezone.minute > minutes + 120)))
            ) {
                candidateMonth++;
                if (candidateMonth > 11) {
                    candidateMonth = 0;
                    candidateYear++;
                }
            }

            // Create the candidate date in the nudge's timezone
            let candidateDate = createDateInTimezone(
                candidateYear,
                candidateMonth,
                candidateDay,
                hours,
                minutes,
                nudge.timezone
            );

            // Handle months with fewer days (e.g., Feb 30 -> Feb 28/29)
            const candidateComponents = getDateComponentsInTimezone(
                candidateDate,
                nudge.timezone
            );
            if (candidateComponents.day !== nudge.dayOfMonth) {
                // Set to last day of the month
                candidateDate = createDateInTimezone(
                    candidateYear,
                    candidateMonth + 1,
                    0,
                    hours,
                    minutes,
                    nudge.timezone
                );
            }

            // If candidate is before reference date, move forward by interval
            if (candidateDate < referenceDate) {
                candidateMonth += nudge.interval;
                if (candidateMonth > 11) {
                    candidateYear += Math.floor(candidateMonth / 12);
                    candidateMonth = candidateMonth % 12;
                }
                candidateDate = createDateInTimezone(
                    candidateYear,
                    candidateMonth,
                    candidateDay,
                    hours,
                    minutes,
                    nudge.timezone
                );
            }

            // Calculate how many month-intervals have passed since candidate
            const refDate = getDateComponentsInTimezone(
                referenceDate,
                nudge.timezone
            );
            const candDate = getDateComponentsInTimezone(
                candidateDate,
                nudge.timezone
            );

            const monthsSinceRef =
                (candDate.year - refDate.year) * 12 +
                (candDate.month - refDate.month);
            const intervalsPassed = Math.floor(monthsSinceRef / nudge.interval);

            // If we need to skip intervals, calculate the next valid occurrence
            if (monthsSinceRef % nudge.interval !== 0) {
                const monthsToAdd =
                    nudge.interval - (monthsSinceRef % nudge.interval);
                candidateMonth += monthsToAdd;
                if (candidateMonth > 11) {
                    candidateYear += Math.floor(candidateMonth / 12);
                    candidateMonth = candidateMonth % 12;
                }
                candidateDate = createDateInTimezone(
                    candidateYear,
                    candidateMonth,
                    candidateDay,
                    hours,
                    minutes,
                    nudge.timezone
                );
            }

            nextDate = candidateDate;
        } else if (nudge.monthlyType === MonthlyType.NTH_DAY_OF_WEEK) {
            // Monthly frequency: every X months on nth occurrence of a day from reference date
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
                (now.getFullYear() - candidateDate.getFullYear()) * 12 +
                (now.getMonth() - candidateDate.getMonth());
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
 * Check if the next occurrence would be after the nudge's end date
 * This prevents creating instances that would occur after the end date
 */
export function wouldOccurAfterEndDate(
    nextOccurrence: Date,
    nudge: {
        endType: EndType;
        endDate?: Date | null;
    }
): boolean {
    if (nudge.endType === EndType.ON_DATE && nudge.endDate) {
        return nextOccurrence > nudge.endDate;
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
    endType: EndType;
    endDate?: Date | null;
}): boolean {
    // Calculate the next occurrence based on interval-aware logic
    const nextOccurrence = calculateNextOccurrence(nudge);

    if (!nextOccurrence) {
        return false;
    }

    if (wouldOccurAfterEndDate(nextOccurrence, nudge)) {
        return false;
    }

    // Check if we should create an instance for this occurrence
    return shouldCreateInstance(nudge, nextOccurrence);
}

/**
 * Get the current date/time components in a specific timezone
 * Returns an object with year, month, day, hour, minute in the target timezone
 */
function getDateComponentsInTimezone(
    date: Date,
    timezone: string
): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    weekday: number;
} {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'short'
    });

    const parts = formatter.formatToParts(date);
    const getValue = (type: string) => {
        const part = parts.find((p) => p.type === type);
        return part ? Number.parseInt(part.value) : 0;
    };

    const weekdayMap: { [key: string]: number } = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6
    };
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Sun';

    return {
        year: getValue('year'),
        month: getValue('month') - 1, // JavaScript months are 0-indexed
        day: getValue('day'),
        hour: getValue('hour'),
        minute: getValue('minute'),
        weekday: weekdayMap[weekdayStr] || 0
    };
}

/**
 * Create a Date object for a specific time in a specific timezone
 * This properly converts the local time to UTC
 */
function createDateInTimezone(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timezone: string
): Date {
    // Create a date string in ISO format without timezone
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    // Parse this as if it's in the target timezone by using toLocaleString
    // First create a UTC date, then adjust for timezone offset
    const testDate = new Date(dateStr + 'Z'); // Parse as UTC
    const testComponents = getDateComponentsInTimezone(testDate, timezone);

    // Calculate the offset between what we want and what we got
    const offsetHours = hour - testComponents.hour;
    const offsetMinutes = minute - testComponents.minute;
    const offsetDays = day - testComponents.day;

    // Apply the offset to get the correct UTC time
    const result = new Date(testDate);
    result.setUTCDate(result.getUTCDate() + offsetDays);
    result.setUTCHours(result.getUTCHours() + offsetHours);
    result.setUTCMinutes(result.getUTCMinutes() + offsetMinutes);

    return result;
}

export function formatScheduleInfo(nudge: {
    frequency: string;
    interval: number;
    dayOfWeek?: number | null;
    monthlyType?: string | null;
    dayOfMonth?: number | null;
    nthOccurrence?: number | null;
    dayOfWeekForMonthly?: number | null;
    timeOfDay: string;
}): string {
    const {
        frequency,
        interval,
        dayOfWeek,
        monthlyType,
        dayOfMonth,
        nthOccurrence,
        dayOfWeekForMonthly,
        timeOfDay
    } = nudge;

    const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];
    const ordinals = ['', 'first', 'second', 'third', 'fourth', 'last'];

    let scheduleText = '';

    // Frequency with interval
    if (frequency === 'DAILY') {
        scheduleText = interval === 1 ? 'Daily' : `Every ${interval} days`;
    } else if (frequency === 'WEEKLY') {
        const dayName =
            dayOfWeek !== null && dayOfWeek !== undefined
                ? dayNames[dayOfWeek]
                : 'Unknown';
        if (interval === 1) {
            scheduleText = `Weekly on ${dayName}`;
        } else {
            scheduleText = `Every ${interval} weeks on ${dayName}`;
        }
    } else if (frequency === 'MONTHLY') {
        if (monthlyType === 'DAY_OF_MONTH' && dayOfMonth) {
            const suffix =
                dayOfMonth === 1
                    ? 'st'
                    : dayOfMonth === 2
                      ? 'nd'
                      : dayOfMonth === 3
                        ? 'rd'
                        : 'th';
            if (interval === 1) {
                scheduleText = `Monthly on the ${dayOfMonth}${suffix}`;
            } else {
                scheduleText = `Every ${interval} months on the ${dayOfMonth}${suffix}`;
            }
        } else if (
            monthlyType === 'NTH_DAY_OF_WEEK' &&
            nthOccurrence &&
            dayOfWeekForMonthly !== null &&
            dayOfWeekForMonthly !== undefined
        ) {
            const ordinal =
                nthOccurrence === -1
                    ? 'last'
                    : ordinals[nthOccurrence] || 'unknown';
            const dayName = dayNames[dayOfWeekForMonthly] || 'Unknown';
            if (interval === 1) {
                scheduleText = `Monthly on the ${ordinal} ${dayName}`;
            } else {
                scheduleText = `Every ${interval} months on the ${ordinal} ${dayName}`;
            }
        }
    }

    // Add time
    scheduleText += ` at ${timeOfDay}`;

    return scheduleText;
}
