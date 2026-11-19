import { format, parseISO } from 'date-fns';
import { describe, it, expect } from 'vitest';
import { expandRecurringEvents, formatEventDate } from './date-logic';
import type { EventWithContact } from '@/types';

const mockEvent: EventWithContact = {
  id: '1',
  contactId: 'c1',
  contactName: 'Alice',
  eventType: 'BIRTHDAY',
  eventName: 'Birthday',
  eventDate: '2000-01-15',
  recurrenceRule: 'YEARLY',
  significanceLevel: 'HIGH',
  createdAt: '',
  updatedAt: '',
  originalYear: 2000,
  contactHealthScore: 80,
  contactAutoPolicy: 'ALWAYS_REVIEW',
  contactAvatar: '',
  reminderDaysBefore: [],
  automationOverride: 'USE_CONTACT_DEFAULT',
  notes: '',
};

function localDates(events: EventWithContact[]): string[] {
  return events.map(event => format(parseISO(event.eventDate), 'yyyy-MM-dd'));
}

describe('expandRecurringEvents', () => {
  it('projects annual events onto the selected year and preserves their virtual IDs', () => {
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 11, 31);

    const instances = expandRecurringEvents([mockEvent], start, end);

    expect(localDates(instances)).toEqual(['2025-01-15']);
    expect(instances[0]).toMatchObject({ id: '1_2025', originalYear: 2000 });
    expect(expandRecurringEvents([mockEvent], new Date(2025, 1, 1), end)).toEqual([]);
  });

  it('projects annual leap-day events backwards and rolls over to March 1 in non-leap years', () => {
    const event = { ...mockEvent, eventDate: '2028-02-29', originalYear: 2028 };

    expect(localDates(expandRecurringEvents(
      [event], new Date(2023, 1, 28), new Date(2024, 1, 29),
    ))).toEqual(['2023-03-01', '2024-02-29']);
  });

  it.each(['ONCE', 'YEARLY', 'MONTHLY', 'WEEKLY'] as const)(
    'includes %s events in a single-day range regardless of the boundary times',
    recurrenceRule => {
      const event = { ...mockEvent, eventDate: '2026-05-15', recurrenceRule };
      const instances = expandRecurringEvents([event], new Date(2026, 4, 15, 14), new Date(2026, 4, 15, 15));

      expect(localDates(instances)).toEqual(['2026-05-15']);
      if (recurrenceRule === 'ONCE') expect(instances[0]).toBe(event);
    },
  );

  it('includes weekly occurrences on both ends of the range', () => {
    const event = { ...mockEvent, eventDate: '2020-01-01', recurrenceRule: 'WEEKLY' } as const;
    const instances = expandRecurringEvents([event], new Date(2020, 0, 1), new Date(2020, 0, 8));

    expect(localDates(instances)).toEqual(['2020-01-01', '2020-01-08']);
    expect(instances.map(instance => instance.id)).toEqual(
      instances.map(instance => event.id + '_' + instance.eventDate),
    );
  });

  it('finds weekly occurrences more than 1,000 weeks after the anchor', () => {
    const event = { ...mockEvent, eventDate: '2000-01-01', recurrenceRule: 'WEEKLY' } as const;
    const instances = expandRecurringEvents([event], new Date(2026, 0, 1), new Date(2026, 0, 31));

    expect(localDates(instances)).toEqual([
      '2026-01-03', '2026-01-10', '2026-01-17', '2026-01-24', '2026-01-31',
    ]);
  });

  it.each([[2026, '2026-02-28'], [2024, '2024-02-29']] as const)(
    'clamps a January 31 monthly recurrence in %s and restores the anchor day when possible',
    (year, februaryDate) => {
      const event = { ...mockEvent, eventDate: year + '-01-31', recurrenceRule: 'MONTHLY' } as const;
      const instances = expandRecurringEvents([event], new Date(year, 0, 1), new Date(year, 3, 30));

      expect(localDates(instances)).toEqual([
        year + '-01-31', februaryDate, year + '-03-31', year + '-04-30',
      ]);
    },
  );

  it('finds monthly occurrences more than 1,000 months after the anchor', () => {
    const event = { ...mockEvent, eventDate: '1900-01-31', recurrenceRule: 'MONTHLY' } as const;

    expect(localDates(expandRecurringEvents(
      [event], new Date(2026, 1, 1), new Date(2026, 2, 31),
    ))).toEqual(['2026-02-28', '2026-03-31']);
  });

  it.each(['MONTHLY', 'WEEKLY'] as const)(
    'does not project %s events back before their anchor',
    recurrenceRule => {
      const event = { ...mockEvent, eventDate: '2026-01-31', recurrenceRule };

      expect(expandRecurringEvents([event], new Date(2025, 11, 1), new Date(2026, 0, 30))).toEqual([]);
    },
  );

  it('returns mixed events in local chronological order and skips invalid dates', () => {
    const events: EventWithContact[] = [
      { ...mockEvent, eventDate: '2026-03-03', recurrenceRule: 'ONCE' },
      { ...mockEvent, id: '2', eventDate: 'invalid', recurrenceRule: 'YEARLY' },
      { ...mockEvent, id: '3', eventDate: '2026-02-30', recurrenceRule: 'ONCE' },
      { ...mockEvent, id: '4', eventDate: '2026-02-01', recurrenceRule: 'MONTHLY' },
    ];

    expect(localDates(expandRecurringEvents(
      events, new Date(2026, 2, 1), new Date(2026, 2, 3, 12),
    ))).toEqual(['2026-03-01', '2026-03-03']);
  });

  it.each([
    [new Date(NaN), new Date(2026, 11, 31)],
    [new Date(2026, 0, 1), new Date(NaN)],
    [new Date(2026, 11, 31), new Date(2026, 0, 1)],
    [new Date(2026, 0, 15, 18), new Date(2026, 0, 15, 8)],
  ])('returns no occurrences for an invalid or reversed range', (start, end) => {
    expect(expandRecurringEvents([mockEvent], start, end)).toEqual([]);
  });
});

describe('formatEventDate', () => {
  it('formats a database date on the same day in the local calendar', () => {
    expect(formatEventDate('2025-01-15')).toBe('January 15, 2025');
  });

  it('formats ISO timestamps in local time', () => {
    expect(formatEventDate(new Date(2025, 0, 15, 12).toISOString())).toBe('January 15, 2025');
  });
});
