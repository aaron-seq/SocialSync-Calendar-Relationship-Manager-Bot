/**
 * Local Storage Service
 * 
 * Provides localStorage persistence for when Supabase is not configured.
 * Offers a fallback for development and offline usage.
 * 
 * Why this exists:
 * - Allows the app to function without Supabase configuration
 * - Persists user data across browser sessions in demo mode
 * - Provides a consistent API that mirrors the Supabase service
 */

import { logger } from '@/lib/logger';
import type { Contact, Event, Draft } from '@/types';

const STORAGE_KEYS = {
  CONTACTS: 'socialsync_contacts',
  EVENTS: 'socialsync_events',
  DRAFTS: 'socialsync_drafts',
} as const;

/**
 * Generic function to save data to localStorage.
 * Handles JSON serialization and error logging.
 */
function saveToStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    logger.debug(`Saved data to localStorage`, { key, itemCount: Array.isArray(data) ? data.length : 1 });
    return true;
  } catch (error) {
    logger.error('Failed to save to localStorage', { key, error });
    return false;
  }
}

/**
 * Generic function to load data from localStorage.
 * Handles JSON parsing and error recovery.
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    logger.error('Failed to load from localStorage', { key, error });
    return defaultValue;
  }
}

/**
 * Generate a unique ID for new records.
 * Format: timestamp-random to ensure uniqueness.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// =============================================================================
// CONTACTS
// =============================================================================

export function loadContacts(): Contact[] {
  return loadFromStorage<Contact[]>(STORAGE_KEYS.CONTACTS, []);
}

export function saveContacts(contacts: Contact[]): boolean {
  return saveToStorage(STORAGE_KEYS.CONTACTS, contacts);
}

export function addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
  const contacts = loadContacts();
  const now = new Date().toISOString();
  
  const newContact: Contact = {
    ...contact,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  contacts.push(newContact);
  saveContacts(contacts);
  
  logger.info('Contact added to localStorage', { contactId: newContact.id, name: newContact.fullName });
  return newContact;
}

export function updateContact(id: string, updates: Partial<Contact>): Contact | null {
  const contacts = loadContacts();
  const index = contacts.findIndex(c => c.id === id);
  
  if (index === -1) {
    logger.warn('Contact not found for update', { contactId: id });
    return null;
  }
  
  const updatedContact: Contact = {
    ...contacts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  contacts[index] = updatedContact;
  saveContacts(contacts);
  
  logger.info('Contact updated in localStorage', { contactId: id });
  return updatedContact;
}

export function deleteContact(id: string): boolean {
  const contacts = loadContacts();
  const filteredContacts = contacts.filter(c => c.id !== id);
  
  if (filteredContacts.length === contacts.length) {
    logger.warn('Contact not found for deletion', { contactId: id });
    return false;
  }
  
  // Also delete associated events
  const events = loadEvents();
  const filteredEvents = events.filter(e => e.contactId !== id);
  saveEvents(filteredEvents);
  
  saveContacts(filteredContacts);
  logger.info('Contact deleted from localStorage', { contactId: id });
  return true;
}

// =============================================================================
// EVENTS
// =============================================================================

export function loadEvents(): Event[] {
  return loadFromStorage<Event[]>(STORAGE_KEYS.EVENTS, []);
}

export function saveEvents(events: Event[]): boolean {
  return saveToStorage(STORAGE_KEYS.EVENTS, events);
}

export function addEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event {
  const events = loadEvents();
  const now = new Date().toISOString();
  
  const newEvent: Event = {
    ...event,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  events.push(newEvent);
  saveEvents(events);
  
  logger.info('Event added to localStorage', { eventId: newEvent.id, type: newEvent.eventType });
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<Event>): Event | null {
  const events = loadEvents();
  const index = events.findIndex(e => e.id === id);
  
  if (index === -1) {
    logger.warn('Event not found for update', { eventId: id });
    return null;
  }
  
  const updatedEvent: Event = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  events[index] = updatedEvent;
  saveEvents(events);
  
  logger.info('Event updated in localStorage', { eventId: id });
  return updatedEvent;
}

export function deleteEvent(id: string): boolean {
  const events = loadEvents();
  const filteredEvents = events.filter(e => e.id !== id);
  
  if (filteredEvents.length === events.length) {
    logger.warn('Event not found for deletion', { eventId: id });
    return false;
  }
  
  saveEvents(filteredEvents);
  logger.info('Event deleted from localStorage', { eventId: id });
  return true;
}

// =============================================================================
// DRAFTS
// =============================================================================

export function loadDrafts(): Draft[] {
  return loadFromStorage<Draft[]>(STORAGE_KEYS.DRAFTS, []);
}

export function saveDrafts(drafts: Draft[]): boolean {
  return saveToStorage(STORAGE_KEYS.DRAFTS, drafts);
}

export function addDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Draft {
  const drafts = loadDrafts();
  const now = new Date().toISOString();
  
  const newDraft: Draft = {
    ...draft,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  drafts.push(newDraft);
  saveDrafts(drafts);
  
  logger.info('Draft added to localStorage', { draftId: newDraft.id });
  return newDraft;
}

export function updateDraft(id: string, updates: Partial<Draft>): Draft | null {
  const drafts = loadDrafts();
  const index = drafts.findIndex(d => d.id === id);
  
  if (index === -1) {
    logger.warn('Draft not found for update', { draftId: id });
    return null;
  }
  
  const updatedDraft: Draft = {
    ...drafts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  drafts[index] = updatedDraft;
  saveDrafts(drafts);
  
  logger.info('Draft updated in localStorage', { draftId: id });
  return updatedDraft;
}

export function deleteDraft(id: string): boolean {
  const drafts = loadDrafts();
  const filteredDrafts = drafts.filter(d => d.id !== id);
  
  if (filteredDrafts.length === drafts.length) {
    logger.warn('Draft not found for deletion', { draftId: id });
    return false;
  }
  
  saveDrafts(filteredDrafts);
  logger.info('Draft deleted from localStorage', { draftId: id });
  return true;
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Clear all stored data.
 * Use for testing or reset functionality.
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  logger.info('All localStorage data cleared');
}

/**
 * Check if there is any stored data.
 * Useful for determining first-run state.
 */
export function hasStoredData(): boolean {
  return Object.values(STORAGE_KEYS).some(key => {
    const data = localStorage.getItem(key);
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
}
