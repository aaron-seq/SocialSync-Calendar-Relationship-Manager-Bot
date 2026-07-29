import type { EventWithContact } from '@/types';
import { addMonths, addWeeks, isBefore, setYear, parseISO, format } from 'date-fns';

/**
 * Expands recurring events into instances within the given range.
 */
export function expandRecurringEvents(
  events: EventWithContact[], 
  start: Date, 
  end: Date
): EventWithContact[] {
  const instances: EventWithContact[] = [];

  events.forEach(event => {
    const eventDate = new Date(event.eventDate);
    
    // 1. Non-recurring: Add if within range
    if (!event.recurrenceRule || event.recurrenceRule === 'ONCE') {
      if (eventDate >= start && eventDate <= end) {
        instances.push(event);
      }
      return;
    }

    // 2. Recurring: Generate instances
    let current = eventDate;
    
    // If event is in past, fast-forward to start date (optimization)
    // For YEARLY, simpler approach: check matching dates in range years
    if (event.recurrenceRule === 'YEARLY') {
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const instanceDate = setYear(eventDate, year);
        
        // Handle leap years if needed (Feb 29 -> Feb 28 or Mar 1) 
        // date-fns setYear handles this reasonably well
        
        if (instanceDate >= start && instanceDate <= end) {
          instances.push({
            ...event,
            id: `${event.id}_${year}`, // Virtual ID
            eventDate: instanceDate.toISOString(),
            // originalYear preserved usually
          });
        }
      }
    } else {
      // MONTHLY, WEEKLY - iterate
      // Safety break
      let count = 0;
      while (isBefore(current, end) && count < 1000) {
        if (current >= start) {
          instances.push({
            ...event,
            id: `${event.id}_${current.toISOString()}`,
            eventDate: current.toISOString(),
          });
        }
        
        // Next instance
        if (event.recurrenceRule === 'MONTHLY') current = addMonths(current, 1);
        else if (event.recurrenceRule === 'WEEKLY') current = addWeeks(current, 1);
        else break; 
        
        count++;
      }
    }
  });

  return instances.sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );
}

/**
 * Formats a date string for display, handling timezone issues for birthdays.
 * Assumes YYYY-MM-DD strings should be treated as local dates.
 */
export function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  // Append T00:00:00 to ensure it's treated as local midnight, not UTC
  // logic depends on how it's stored, but usually safe for display
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}
