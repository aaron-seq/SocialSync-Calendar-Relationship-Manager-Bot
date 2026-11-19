import type { EventWithContact } from '@/types';
import {
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfDay,
  format,
  isValid,
  parseISO,
  setYear,
  startOfDay,
} from 'date-fns';

/**
 * Expands events over both local calendar days at the ends of the range.
 * SQL date-only values are local dates. ISO timestamps retain their instant.
 */
export function expandRecurringEvents(
  events: EventWithContact[],
  start: Date,
  end: Date,
): EventWithContact[] {
  if (!isValid(start) || !isValid(end) || start > end) return [];

  const firstDay = startOfDay(start);
  const lastDay = endOfDay(end);
  const instances: EventWithContact[] = [];

  for (const event of events) {
    const anchor = parseISO(event.eventDate);
    if (!isValid(anchor)) continue;

    const { recurrenceRule } = event;
    if (!recurrenceRule || recurrenceRule === 'ONCE') {
      if (anchor >= firstDay && anchor <= lastDay) instances.push(event);
      continue;
    }

    if (recurrenceRule === 'YEARLY') {
      // Annual events can appear before their original year. Feb 29 rolls to Mar 1 in non-leap years.
      for (let year = firstDay.getFullYear(); year <= lastDay.getFullYear(); year++) {
        const date = setYear(anchor, year);
        if (date >= firstDay && date <= lastDay) {
          instances.push({ ...event, id: event.id + '_' + year, eventDate: date.toISOString() });
        }
      }
      continue;
    }

    const weekly = recurrenceRule === 'WEEKLY';
    let offset = weekly
      ? Math.max(0, Math.ceil(differenceInCalendarDays(firstDay, anchor) / 7))
      : Math.max(0, differenceInCalendarMonths(firstDay, anchor));
    const addInterval = weekly ? addWeeks : addMonths;

    // Always add to the anchor so a short month clamps only its own occurrence.
    let date = addInterval(anchor, offset);
    while (date <= lastDay) {
      if (date >= firstDay) {
        const eventDate = date.toISOString();
        instances.push({ ...event, id: event.id + '_' + eventDate, eventDate });
      }
      offset += 1;
      date = addInterval(anchor, offset);
    }
  }

  return instances.sort((a, b) => parseISO(a.eventDate).getTime() - parseISO(b.eventDate).getTime());
}

/** Formats a date-only value or ISO timestamp in the local calendar. */
export function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}
