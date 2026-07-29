import { useState, useEffect, useCallback } from 'react';
import { ContactsSDK } from '@/services/contactsSDK';
import { logger } from '@/lib/logger';
import { telemetry } from '@/utils/telemetry';
import { useRealtime } from '@/hooks/useRealtime';
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

export function calculateContactMetrics(contact: Contact): ContactWithMetrics {
  const daysSinceLastInteraction = contact.lastInteractionDate
    ? Math.floor((Date.now() - new Date(contact.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  return {
    ...contact,
    upcomingEventsCount: 0, // In real app, join with events
    pendingMessagesCount: 0, // In real app, join with queue
    daysSinceLastInteraction,
  };
}

export function filterContactsByQuery(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return contacts;
  const lowerQuery = query.toLowerCase();
  return contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(lowerQuery) ||
    contact.nickname?.toLowerCase().includes(lowerQuery)
  );
}

export function countCriticalContacts(contacts: Contact[]): number {
  return contacts.filter(c => c.healthScore < 40).length;
}

export function calculateAverageHealth(contacts: Contact[]): number {
  if (contacts.length === 0) return 0;
  const total = contacts.reduce((sum, c) => sum + c.healthScore, 0);
  return Math.round(total / contacts.length);
}

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

export function useContacts() {
  const [state, setState] = useState<ContactsState>({
    contacts: [],
    isLoading: true,
    error: null,
  });

  const fetchContacts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Use SDK
    const result = await ContactsSDK.getContacts();

    if (result.success) {
      setState({
        contacts: result.data,
        isLoading: false,
        error: null,
      });
      telemetry.track('contacts.loaded', { count: result.data.length });
    } else {
      setState({
        contacts: [],
        isLoading: false,
        error: result.error.message,
      });
      logger.error('Failed to load contacts', { error: result.error });
    }
  }, []);

  // Subscribe to real-time changes
  useRealtime({
    table: 'contacts',
    onInsert: () => {
      logger.info('Realtime: Contact added');
      fetchContacts();
    },
    onUpdate: () => {
      logger.info('Realtime: Contact updated');
      fetchContacts();
    },
    onDelete: () => {
      logger.info('Realtime: Contact deleted');
      fetchContacts();
    },
  });

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = useCallback(async (data: Partial<Contact>) => {
    const result = await ContactsSDK.createContact(data);
    if (result.success) {
      fetchContacts(); 
      return result.data;
    } else {
      throw result.error;
    }
  }, [fetchContacts]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const result = await ContactsSDK.updateContact(id, updates);
    if (!result.success) throw result.error;
    fetchContacts();
    return result.data;
  }, [fetchContacts]);

  const deleteContact = useCallback(async (id: string) => {
    const result = await ContactsSDK.deleteContact(id);
    if (!result.success) throw result.error;
    fetchContacts();
    return true;
  }, [fetchContacts]);

  return {
    ...state,
    refetch: fetchContacts,
    addContact,
    updateContact,
    deleteContact
  };
}

export function useSelectedContact() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const select = useCallback((contact: Contact) => {
    telemetry.track('contact.selected', { contactId: contact.id });
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
