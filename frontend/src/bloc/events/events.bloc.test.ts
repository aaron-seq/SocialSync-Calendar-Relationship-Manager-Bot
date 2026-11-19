import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EventWithContact } from '@/types';
import { calculateDaysUntil, getEventsInRange } from './events.bloc';

const event: EventWithContact = {
  id: 'one-time',
  contactId: 'c1',
  contactName: 'Alice',
  eventType: 'CUSTOM',
  eventDate: '2026-11-01',
  recurrenceRule: 'ONCE',
  significanceLevel: 'MEDIUM',
  automationOverride: 'USE_CONTACT_DEFAULT',
  reminderDaysBefore: [],
  createdAt: '',
  updatedAt: '',
  contactHealthScore: 80,
  contactAutoPolicy: 'ALWAYS_REVIEW',
};

afterEach(() => vi.useRealTimers());

describe('calendar day calculations', () => {
  it('uses local calendar days for date-only events', () => {
    vi.setSystemTime(new Date(2026, 10, 1, 12));
    expect(calculateDaysUntil('2026-11-01')).toBe(0);
    expect(calculateDaysUntil('2026-11-02')).toBe(1);
    expect(calculateDaysUntil('2026-10-31')).toBe(-1);
  });

  it('counts calendar days across the fall clock change', () => {
    vi.setSystemTime(new Date(2026, 10, 1, 12));
    expect(calculateDaysUntil(new Date(2026, 10, 2, 23).toISOString())).toBe(1);
  });

  it('includes the entire final day and accepts both date-only and timestamp events', () => {
    vi.setSystemTime(new Date(2026, 10, 1, 12));
    const final = { ...event, id: 'final', eventDate: new Date(2026, 10, 2, 23).toISOString() };
    const before = { ...event, id: 'before', eventDate: '2026-10-31' };
    const after = { ...event, id: 'after', eventDate: '2026-11-03' };

    expect(getEventsInRange([before, event, final, after], 1)).toEqual([event, final]);
  });
});
