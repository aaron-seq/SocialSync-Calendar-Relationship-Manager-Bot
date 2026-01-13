/**
 * Contacts BLoC (Business Logic Component)
 * 
 * Encapsulates all business logic for contact management:
 * - Data fetching and caching
 * - State management
 * - Validation rules
 * - Computed values (health metrics, etc.)
 * 
 * Why BLoC pattern:
 * - Separates business logic from UI components
 * - Makes logic testable in isolation
 * - Enables reuse across different UI implementations
 * - UI components become purely presentational
 */

import { useState, useEffect, useCallback } from 'react';
import * as supabaseService from '@/services/supabase.service';
import { logger, startTimer } from '@/lib/logger';
import type { Contact, ContactWithMetrics, Result } from '@/types';

// =============================================================================
// DEMO DATA - Used when Supabase is not configured
// =============================================================================

const DEMO_CONTACTS: Contact[] = [
  { 
    id: '1', 
    userId: 'demo',
    fullName: 'Riya Sharma', 
    nickname: 'Riya', 
    healthScore: 85, 
    intimacyLevel: 9, 
    relationType: 'FRIEND',
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '2', 
    userId: 'demo',
    fullName: 'Michael Chen', 
    nickname: 'Mike', 
    healthScore: 35, 
    intimacyLevel: 6, 
    relationType: 'WORK',
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '3', 
    userId: 'demo',
    fullName: 'Sarah Johnson', 
    healthScore: 72, 
    intimacyLevel: 10, 
    relationType: 'PARTNER',
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
    ghostingRiskScore: 0.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '4', 
    userId: 'demo',
    fullName: 'David Williams', 
    healthScore: 45, 
    intimacyLevel: 4, 
    relationType: 'NETWORK',
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '5', 
    userId: 'demo',
    fullName: 'Emma Davis', 
    nickname: 'Em',
    healthScore: 90, 
    intimacyLevel: 8, 
    relationType: 'FAMILY',
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '6', 
    userId: 'demo',
    fullName: 'James Wilson', 
    healthScore: 28, 
    intimacyLevel: 3, 
    relationType: 'WORK',
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
 * Handles loading state, errors, and auto-refresh.
 * 
 * Usage:
 * ```typescript
 * const { contacts, isLoading, error, refetch } = useContacts();
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
        // Demo mode: use hardcoded data
        logger.info('Using demo contacts (Supabase not configured)');
        setState({
          contacts: DEMO_CONTACTS,
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
  
  return {
    ...state,
    refetch: fetchData,
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
