import { useState, useEffect, useCallback } from 'react';
import { EventsSDK } from '@/services/eventsSDK';
import { logger } from '@/lib/logger';
import { telemetry } from '@/utils/telemetry';
import { useRealtime } from '@/hooks/useRealtime';
import { isSupabaseConfigured } from '@/services/supabase.service';
import type { Event, EventWithContact, SignificanceLevel } from '@/types';

// =============================================================================
// UTILITIES
// =============================================================================

export function calculateDaysUntil(eventDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diffTime = event.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function groupEventsByDate(events: EventWithContact[]): Record<string, EventWithContact[]> {
  return events.reduce((acc, event) => {
    const date = event.eventDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, EventWithContact[]>);
}

export function countBySignificance(events: EventWithContact[]): Record<SignificanceLevel, number> {
  return events.reduce((acc, event) => {
    acc[event.significanceLevel] = (acc[event.significanceLevel] || 0) + 1;
    return acc;
  }, {} as Record<SignificanceLevel, number>);
}

export function countByEventType(events: EventWithContact[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

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

// =============================================================================
// REACT HOOKS
// =============================================================================

interface EventsState {
  events: EventWithContact[];
  isLoading: boolean;
  error: string | null;
}

export function useEvents() {
  const [state, setState] = useState<EventsState>({
    events: [],
    isLoading: true,
    error: null,
  });

  const fetchEvents = useCallback(async () => {
    // Nothing to fetch without a database. Avoids a throw-and-log storm on
    // first paint when the app is unconfigured.
    if (!isSupabaseConfigured()) {
      setState({ events: [], isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // SDK handles mapping and error normalization
    const result = await EventsSDK.getEvents();

    if (result.success) {
      setState({
        events: result.data,
        isLoading: false,
        error: null,
      });
      telemetry.track('events.loaded', { count: result.data.length });
    } else {
      setState({
        events: [],
        isLoading: false,
        error: result.error.message,
      });
      logger.error('Failed to load events', { error: result.error });
    }
  }, []);

  // Subscribe to real-time changes
  useRealtime({
    table: 'events',
    onInsert: () => fetchEvents(),
    onUpdate: () => fetchEvents(),
    onDelete: () => fetchEvents(),
  });

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(async (data: Partial<Event>) => {
    const result = await EventsSDK.createEvent(data);
    if (result.success) {
      fetchEvents();
      return result.data;
    } else {
      throw result.error;
    }
  }, [fetchEvents]);

  const updateEvent = useCallback(async (_id: string, _updates: Partial<Event>) => {
    // TODO: Implement in SDK
    fetchEvents();
    return null;
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (_id: string) => {
    // TODO: Implement in SDK
    fetchEvents();
    return true;
  }, [fetchEvents]);

  return {
    ...state,
    refetch: fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
}

export function useSelectedEvent() {
  const [selectedEvent, setSelectedEvent] = useState<EventWithContact | null>(null);
  
  const select = useCallback((event: EventWithContact) => {
    telemetry.track('event.selected', { eventId: event.id });
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
