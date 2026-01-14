/**
 * Contacts BLoC (Business Logic Component)
 * 
 * Encapsulates all business logic for contact management:
 * - Data fetching and caching
 * - State management
 * - Validation rules
 * - Computed values (health metrics, etc.)
 * - CRUD operations with localStorage fallback
 * 
 * Why BLoC pattern:
 * - Separates business logic from UI components
 * - Makes logic testable in isolation
 * - Enables reuse across different UI implementations
 * - UI components become purely presentational
 */

import { useState, useEffect, useCallback } from 'react';
import * as supabaseService from '@/services/supabase.service';
import * as storageService from '@/services/storage.service';
import { logger, startTimer } from '@/lib/logger';
import type { Contact, ContactWithMetrics } from '@/types';

// =============================================================================
// STATE TYPES
// =============================================================================

interface ContactsState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// BUSINESS LOGIC FUNCTIONS
// =============================================================================

/**
 * Determine if Supabase is configured.
 * Used to switch between demo mode and production mode.
 */
function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL);
}

/**
 * Calculate computed metrics for a contact.
 * These are derived values used for UI display.
 */
export function calculateContactMetrics(contact: Contact): ContactWithMetrics {
  const daysSinceLastInteraction = contact.lastInteractionDate
    ? Math.floor((Date.now() - new Date(contact.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  return {
    ...contact,
    upcomingEventsCount: 0, // Would be joined from events table
    pendingMessagesCount: 0, // Would be joined from message_queue
    daysSinceLastInteraction,
  };
}

/**
 * Count contacts that need attention (health < 40).
 */
export function countCriticalContacts(contacts: Contact[]): number {
  return contacts.filter(c => c.healthScore < 40).length;
}

/**
 * Calculate average health score across all contacts.
 */
export function calculateAverageHealth(contacts: Contact[]): number {
  if (contacts.length === 0) return 0;
  const total = contacts.reduce((sum, c) => sum + c.healthScore, 0);
  return Math.round(total / contacts.length);
}

/**
 * Filter contacts by search query.
 * Matches against name and nickname.
 */
export function filterContactsByQuery(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return contacts;
  
  const lowerQuery = query.toLowerCase();
  return contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(lowerQuery) ||
    contact.nickname?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort contacts by specified field.
 */
export function sortContacts(
  contacts: Contact[],
  field: 'name' | 'health' | 'intimacy',
  direction: 'asc' | 'desc' = 'asc'
): Contact[] {
  const sorted = [...contacts].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'health':
        comparison = a.healthScore - b.healthScore;
        break;
      case 'intimacy':
        comparison = a.intimacyLevel - b.intimacyLevel;
        break;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook for fetching and managing contacts list.
 * Handles loading state, errors, CRUD operations, and auto-refresh.
 * Uses localStorage when Supabase is not configured.
 * 
 * Usage:
 * ```typescript
 * const { contacts, isLoading, error, addContact, updateContact, deleteContact, refetch } = useContacts();
 * ```
 */
export function useContacts() {
  const [state, setState] = useState<ContactsState>({
    contacts: [],
    isLoading: true,
    error: null,
  });
  
  const fetchData = useCallback(async () => {
    const timer = startTimer('useContacts.fetchData');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (!isSupabaseConfigured()) {
        // Local mode: use localStorage
        logger.info('Using localStorage for contacts (Supabase not configured)');
        const contacts = storageService.loadContacts();
        setState({
          contacts,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      const result = await supabaseService.fetchContacts();
      
      if (result.success) {
        setState({
          contacts: result.data,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          contacts: [],
          isLoading: false,
          error: result.error.message,
        });
      }
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch contacts', { error: error.message, stack: error.stack });
      setState({
        contacts: [],
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
  
  const addContact = useCallback((contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newContact = storageService.addContact(contactData);
        setState(prev => ({
          ...prev,
          contacts: [...prev.contacts, newContact],
        }));
        return newContact;
      }
      // For Supabase mode, refetch after API call
      // (API call would be made in the calling code)
      fetchData();
      return null;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to add contact', { error: error.message });
      throw error;
    }
  }, [fetchData]);
  
  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    try {
      if (!isSupabaseConfigured()) {
        const updatedContact = storageService.updateContact(id, updates);
        if (updatedContact) {
          setState(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => c.id === id ? updatedContact : c),
          }));
        }
        return updatedContact;
      }
      fetchData();
      return null;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to update contact', { error: error.message, contactId: id });
      throw error;
    }
  }, [fetchData]);
  
  const deleteContact = useCallback((id: string) => {
    try {
      if (!isSupabaseConfigured()) {
        const success = storageService.deleteContact(id);
        if (success) {
          setState(prev => ({
            ...prev,
            contacts: prev.contacts.filter(c => c.id !== id),
          }));
        }
        return success;
      }
      fetchData();
      return true;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to delete contact', { error: error.message, contactId: id });
      throw error;
    }
  }, [fetchData]);
  
  return {
    ...state,
    refetch: fetchData,
    addContact,
    updateContact,
    deleteContact,
  };
}

/**
 * Hook for managing selected contact state.
 * Provides a controlled pattern for contact selection.
 */
export function useSelectedContact() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const select = useCallback((contact: Contact) => {
    logger.debug('Contact selected', { contactId: contact.id, name: contact.fullName });
    setSelectedContact(contact);
  }, []);
  
  const clear = useCallback(() => {
    setSelectedContact(null);
  }, []);
  
  return {
    selectedContact,
    select,
    clear,
  };
}

