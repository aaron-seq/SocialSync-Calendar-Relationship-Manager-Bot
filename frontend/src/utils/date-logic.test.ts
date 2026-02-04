import { describe, it, expect } from 'vitest';
import { expandRecurringEvents, formatEventDate } from './date-logic';
import type { EventWithContact } from '@/types';

describe('expandRecurringEvents', () => {
  const mockEvent: EventWithContact = {
    id: '1',
    contactId: 'c1',
    contactName: 'Alice',
    eventType: 'BIRTHDAY',
    eventName: 'Birthday',
    eventDate: '2000-01-15T00:00:00.000Z',
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

  it('should expand yearly events correctly', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-12-31');
    
    const instances = expandRecurringEvents([mockEvent], start, end);
    
    expect(instances).toHaveLength(1);
    expect(instances[0].eventDate).toContain('2025-01-15');
    expect(instances[0].id).toBe('1_2025');
  });

  it('should not include events outside range', () => {
    const start = new Date('2025-02-01');
    const end = new Date('2025-12-31');
    
    const instances = expandRecurringEvents([mockEvent], start, end);
    
    expect(instances).toHaveLength(0);
  });
});

describe('formatEventDate', () => {
  it('should format date string correctly', () => {
    // Should reliably format regardless of timezone if using parseISO correctly
    // MMMM d, yyyy
    const dateStr = '2025-01-15T00:00:00.000Z';
    const formatted = formatEventDate(dateStr);
    
    expect(formatted).toBe('January 15, 2025');
  });
});
