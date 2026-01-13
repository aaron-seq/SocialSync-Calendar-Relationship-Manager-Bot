/**
 * Events BLoC (Business Logic Component)
 * 
 * Encapsulates all business logic for event management:
 * - Fetching upcoming events
 * - Grouping events by date
 * - Calculating days until event
 * - Determining automation policy
 */

import { useState, useEffect, useCallback } from 'react';
import { logger, startTimer } from '@/lib/logger';
import type { Event, EventWithContact, SignificanceLevel } from '@/types';

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_EVENTS: EventWithContact[] = [
  { 
    id: '1', 
    contactId: '1', 
    eventType: 'BIRTHDAY', 
    eventDate: '2026-01-15', 
    significanceLevel: 'MEDIUM',
    automationOverride: 'USE_CONTACT_DEFAULT',
    recurrenceRule: 'YEARLY',
    reminderDaysBefore: [1, 7],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Riya Sharma',
    contactHealthScore: 85,
    contactAutoPolicy: 'AUTO_SEND_LOW_RISK',
  },
  { 
    id: '2', 
    contactId: '3', 
    eventType: 'ANNIVERSARY', 
    eventDate: '2026-01-18', 
    significanceLevel: 'HIGH',
    automationOverride: 'USE_CONTACT_DEFAULT',
    recurrenceRule: 'YEARLY',
    reminderDaysBefore: [1, 7],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Sarah Johnson',
    contactHealthScore: 72,
    contactAutoPolicy: 'ALWAYS_AUTO_SEND',
  },
  { 
    id: '3', 
    contactId: '5', 
    eventType: 'BIRTHDAY', 
    eventDate: '2026-01-20', 
    significanceLevel: 'MEDIUM',
    automationOverride: 'USE_CONTACT_DEFAULT',
    recurrenceRule: 'YEARLY',
    reminderDaysBefore: [1, 7],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Emma Davis',
    contactHealthScore: 90,
    contactAutoPolicy: 'AUTO_SEND_LOW_RISK',
  },
  { 
    id: '4', 
    contactId: '2', 
    eventType: 'PROMOTION', 
    eventName: 'VP Promotion',
    eventDate: '2026-01-22', 
    significanceLevel: 'HIGH',
    automationOverride: 'FORCE_REVIEW',
    recurrenceRule: 'ONCE',
    reminderDaysBefore: [1, 3],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Michael Chen',
    contactHealthScore: 35,
    contactAutoPolicy: 'ALWAYS_REVIEW',
  },
  { 
    id: '5', 
    contactId: '4', 
    eventType: 'BIRTHDAY', 
    eventDate: '2026-02-05', 
    significanceLevel: 'LOW',
    automationOverride: 'USE_CONTACT_DEFAULT',
    recurrenceRule: 'YEARLY',
    reminderDaysBefore: [1, 7],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'David Williams',
    contactHealthScore: 45,
    contactAutoPolicy: 'ALWAYS_REVIEW',
  },
  { 
    id: '6', 
    contactId: '6', 
    eventType: 'NEW_JOB', 
    eventDate: '2026-02-10', 
    significanceLevel: 'MEDIUM',
    automationOverride: 'USE_CONTACT_DEFAULT',
    recurrenceRule: 'ONCE',
    reminderDaysBefore: [1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'James Wilson',
    contactHealthScore: 28,
    contactAutoPolicy: 'ALWAYS_REVIEW',
  },
];

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

/**
 * Calculate days until an event from today.
 */
export function calculateDaysUntil(eventDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  
  const diffTime = event.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Group events by their date for timeline display.
 */
export function groupEventsByDate(events: EventWithContact[]): Record<string, EventWithContact[]> {
  return events.reduce((acc, event) => {
    const date = event.eventDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, EventWithContact[]>);
}

/**
 * Get events for the next N days.
 */
export function getEventsInRange(events: EventWithContact[], days: number): EventWithContact[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  return events.filter(event => {
    const eventDate = new Date(event.eventDate);
    return eventDate >= today && eventDate <= endDate;
  });
}

/**
 * Count events by significance level.
 */
export function countBySignificance(events: EventWithContact[]): Record<SignificanceLevel, number> {
  return events.reduce((acc, event) => {
    acc[event.significanceLevel] = (acc[event.significanceLevel] || 0) + 1;
    return acc;
  }, {} as Record<SignificanceLevel, number>);
}

/**
 * Count events by type.
 */
export function countByEventType(events: EventWithContact[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// =============================================================================
// REACT HOOKS
// =============================================================================

interface EventsState {
  events: EventWithContact[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing events.
 */
export function useEvents() {
  const [state, setState] = useState<EventsState>({
    events: [],
    isLoading: true,
    error: null,
  });
  
  const fetchData = useCallback(async () => {
    const timer = startTimer('useEvents.fetchData');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Demo mode for now
      logger.info('Using demo events');
      setState({
        events: DEMO_EVENTS,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch events', { error: error.message });
      setState({
        events: [],
        isLoading: false,
        error: error.message,
      });
    } finally {
      timer.end();
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for selected event state.
 */
export function useSelectedEvent() {
  const [selectedEvent, setSelectedEvent] = useState<EventWithContact | null>(null);
  
  const select = useCallback((event: EventWithContact) => {
    logger.debug('Event selected', { eventId: event.id, type: event.eventType });
    setSelectedEvent(event);
  }, []);
  
  const clear = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  
  return {
    selectedEvent,
    select,
    clear,
  };
}
