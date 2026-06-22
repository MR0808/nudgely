import { describe, expect, it } from 'vitest';

import {
    convertTo24Hour,
    generateReminderToken,
    wouldOccurAfterEndDate
} from '@/lib/nudge-helpers';
import { EndType } from '@/generated/prisma/client';

describe('convertTo24Hour', () => {
    it('converts AM times', () => {
        expect(convertTo24Hour('9:00 AM')).toBe('09:00');
        expect(convertTo24Hour('12:00 AM')).toBe('00:00');
    });

    it('converts PM times', () => {
        expect(convertTo24Hour('3:30 PM')).toBe('15:30');
        expect(convertTo24Hour('12:00 PM')).toBe('12:00');
    });
});

describe('generateReminderToken', () => {
    it('returns a non-empty unique token', () => {
        const a = generateReminderToken();
        const b = generateReminderToken();
        expect(a).toBeTruthy();
        expect(b).toBeTruthy();
        expect(a).not.toBe(b);
    });
});

describe('wouldOccurAfterEndDate', () => {
    it('returns false when no end date is set', () => {
        const next = new Date('2030-01-01');
        expect(
            wouldOccurAfterEndDate(next, {
                endType: EndType.NEVER,
                endDate: null
            })
        ).toBe(false);
    });

    it('returns true when next occurrence is after end date', () => {
        const next = new Date('2030-06-01');
        expect(
            wouldOccurAfterEndDate(next, {
                endType: EndType.ON_DATE,
                endDate: new Date('2030-01-01')
            })
        ).toBe(true);
    });
});
