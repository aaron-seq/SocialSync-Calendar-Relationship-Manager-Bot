/**
 * Events BLoC (Business Logic Component)
 * 
 * Encapsulates all business logic for event management:
 * - Fetching upcoming events
 * - Grouping events by date
 * - Calculating days until event
 * - Determining automation policy
 * - CRUD operations with localStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import * as storageService from '@/services/storage.service';
import { logger, startTimer } from '@/lib/logger';
import type { Event, EventWithContact, SignificanceLevel, Contact } from '@/types';

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

/**
 * Determine if Supabase is configured.
 */
function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL);
}

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

/**
 * Enrich events with contact information.
 * Joins events with contacts to create EventWithContact objects.
 */
export function enrichEventsWithContacts(events: Event[], contacts: Contact[]): EventWithContact[] {
  const contactMap = new Map(contacts.map(c => [c.id, c]));
  
  return events.map(event => {
    const contact = contactMap.get(event.contactId);
    return {
      ...event,
      contactName: contact?.fullName || 'Unknown Contact',
      contactNickname: contact?.nickname,
      contactAvatar: contact?.avatarUrl,
      contactHealthScore: contact?.healthScore || 50,
      contactAutoPolicy: contact?.defaultAutoPolicy || 'ALWAYS_REVIEW',
    };
  }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
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
 * Uses localStorage when Supabase is not configured.
 * 
 * Usage:
 * ```typescript
 * const { events, isLoading, error, addEvent, updateEvent, deleteEvent, refetch } = useEvents();
 * ```
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
      if (!isSupabaseConfigured()) {
        // Local mode: use localStorage
        logger.info('Using localStorage for events (Supabase not configured)');
        const events = storageService.loadEvents();
        const contacts = storageService.loadContacts();
        const enrichedEvents = enrichEventsWithContacts(events, contacts);
        
        setState({
          events: enrichedEvents,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      // Supabase mode would go here
      logger.info('Supabase events not yet implemented');
      setState({
        events: [],
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
  
  const addEvent = useCallback((eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newEvent = storageService.addEvent(eventData);
        // Refetch to get enriched data
        fetchData();
        return newEvent;
      }
      fetchData();
      return null;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to add event', { error: error.message });
      throw error;
    }
  }, [fetchData]);
  
  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    try {
      if (!isSupabaseConfigured()) {
        const updatedEvent = storageService.updateEvent(id, updates);
        fetchData();
        return updatedEvent;
      }
      fetchData();
      return null;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to update event', { error: error.message, eventId: id });
      throw error;
    }
  }, [fetchData]);
  
  const deleteEvent = useCallback((id: string) => {
    try {
      if (!isSupabaseConfigured()) {
        const success = storageService.deleteEvent(id);
        if (success) {
          setState(prev => ({
            ...prev,
            events: prev.events.filter(e => e.id !== id),
          }));
        }
        return success;
      }
      fetchData();
      return true;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to delete event', { error: error.message, eventId: id });
      throw error;
    }
  }, [fetchData]);
  
  return {
    ...state,
    refetch: fetchData,
    addEvent,
    updateEvent,
    deleteEvent,
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
