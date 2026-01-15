/**
 * Drafts BLoC (Business Logic Component)
 * 
 * Encapsulates business logic for AI message draft management:
 * - Draft generation workflow
 * - Approval/rejection actions
 * - Automation policy evaluation
 * - CRUD operations with localStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import * as storageService from '@/services/storage.service';
import { generateDraftContent, generateDraftWithContext } from '@/services/llm.service';
import { logger, startTimer } from '@/lib/logger';
import type { Draft, DraftWithContext, AutoPolicy, AutomationOverride, SignificanceLevel, Contact, Event } from '@/types';

// =============================================================================
// AUTOMATION POLICY LOGIC
// =============================================================================

/**
 * Determine if Supabase is configured.
 */
function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL);
}

/**
 * Determine message status based on hierarchical automation policy.
 * This is the core "Safety Check" algorithm.
 * 
 * Hierarchy:
 * 1. Event Override (FORCE_REVIEW | FORCE_AUTO | USE_CONTACT_DEFAULT)
 * 2. Contact Default (ALWAYS_REVIEW | ALWAYS_AUTO_SEND | AUTO_SEND_LOW_RISK)
 * 3. Significance Level (HIGH requires review, MEDIUM/LOW can auto-send)
 */
export function determineAutomationStatus(
  eventOverride: AutomationOverride,
  contactPolicy: AutoPolicy,
  significance: SignificanceLevel
): 'WAITING_FOR_REVIEW' | 'APPROVED_WAITING' {
  // Level 1: Check event override
  if (eventOverride === 'FORCE_REVIEW') {
    logger.debug('Automation status: FORCE_REVIEW from event override');
    return 'WAITING_FOR_REVIEW';
  }
  if (eventOverride === 'FORCE_AUTO') {
    logger.debug('Automation status: FORCE_AUTO from event override');
    return 'APPROVED_WAITING';
  }
  
  // Level 2: Check contact default policy
  if (contactPolicy === 'ALWAYS_REVIEW') {
    logger.debug('Automation status: ALWAYS_REVIEW from contact policy');
    return 'WAITING_FOR_REVIEW';
  }
  if (contactPolicy === 'ALWAYS_AUTO_SEND') {
    logger.debug('Automation status: ALWAYS_AUTO_SEND from contact policy');
    return 'APPROVED_WAITING';
  }
  
  // Level 3: AUTO_SEND_LOW_RISK - check significance
  if (significance === 'HIGH') {
    logger.debug('Automation status: HIGH significance requires review');
    return 'WAITING_FOR_REVIEW';
  }
  
  logger.debug('Automation status: LOW/MEDIUM significance allows auto-send');
  return 'APPROVED_WAITING';
}

// =============================================================================
// BUSINESS LOGIC
// =============================================================================

/**
 * Count drafts by status.
 */
export function countByStatus(drafts: DraftWithContext[]): Record<string, number> {
  return drafts.reduce((acc, draft) => {
    acc[draft.status] = (acc[draft.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Filter drafts by status.
 * Active filter excludes CANCELLED and SENT drafts.
 */
export function filterByStatus(
  drafts: DraftWithContext[],
  status: 'all' | 'review' | 'approved'
): DraftWithContext[] {
  // First filter out cancelled and sent drafts
  const activeDrafts = drafts.filter(d => 
    d.status !== 'CANCELLED' && d.status !== 'SENT' && d.status !== 'FAILED'
  );
  
  if (status === 'all') return activeDrafts;
  if (status === 'review') return activeDrafts.filter(d => d.status === 'WAITING_FOR_REVIEW');
  if (status === 'approved') return activeDrafts.filter(d => d.status === 'APPROVED_WAITING');
  return activeDrafts;
}

/**
 * Sort drafts by scheduled send time.
 */
export function sortByScheduledTime(drafts: DraftWithContext[]): DraftWithContext[] {
  return [...drafts].sort((a, b) => {
    const timeA = a.scheduledSendTime ? new Date(a.scheduledSendTime).getTime() : Infinity;
    const timeB = b.scheduledSendTime ? new Date(b.scheduledSendTime).getTime() : Infinity;
    return timeA - timeB;
  });
}

/**
 * Enrich drafts with contact and event information.
 */
export function enrichDraftsWithContext(drafts: Draft[], contacts: Contact[]): DraftWithContext[] {
  const contactMap = new Map(contacts.map(c => [c.id, c]));
  
  return drafts.map(draft => {
    const contact = contactMap.get(draft.contactId);
    return {
      ...draft,
      contactName: contact?.fullName || 'Unknown Contact',
      eventType: 'CUSTOM' as const, // Would be fetched from event
      healthScore: contact?.healthScore || 50,
    };
  });
}

// =============================================================================
// REACT HOOKS
// =============================================================================

interface DraftsState {
  drafts: DraftWithContext[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

/**
 * Hook for managing drafts list and actions.
 * Uses localStorage when Supabase is not configured.
 */
export function useDrafts() {
  const [state, setState] = useState<DraftsState>({
    drafts: [],
    isLoading: true,
    isGenerating: false,
    error: null,
  });
  
  const fetchData = useCallback(async () => {
    const timer = startTimer('useDrafts.fetchData');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (!isSupabaseConfigured()) {
        // Local mode: use localStorage
        logger.info('Using localStorage for drafts (Supabase not configured)');
        const drafts = storageService.loadDrafts();
        const contacts = storageService.loadContacts();
        const enrichedDrafts = enrichDraftsWithContext(drafts, contacts);
        
        setState({
          drafts: enrichedDrafts,
          isLoading: false,
          isGenerating: false,
          error: null,
        });
        return;
      }
      
      // Supabase mode would go here
      setState({
        drafts: [],
        isLoading: false,
        isGenerating: false,
        error: null,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch drafts', { error: error.message });
      setState({
        drafts: [],
        isLoading: false,
        isGenerating: false,
        error: error.message,
      });
    } finally {
      timer.end();
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const approve = useCallback(async (id: string) => {
    logger.info('Approving draft', { draftId: id });
    
    if (!isSupabaseConfigured()) {
      storageService.updateDraft(id, { status: 'APPROVED_WAITING' });
    }
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, status: 'APPROVED_WAITING' as const } : d
      ),
    }));
  }, []);
  
  const reject = useCallback(async (id: string) => {
    logger.info('Rejecting draft', { draftId: id });
    
    if (!isSupabaseConfigured()) {
      storageService.updateDraft(id, { status: 'CANCELLED' });
    }
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, status: 'CANCELLED' as const } : d
      ),
    }));
  }, []);
  
  const edit = useCallback(async (id: string, content: string) => {
    logger.info('Editing draft', { draftId: id });
    
    if (!isSupabaseConfigured()) {
      storageService.updateDraft(id, { editedContent: content, userEdited: true });
    }
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, editedContent: content, userEdited: true } : d
      ),
    }));
  }, []);
  
  /**
   * Generate a new draft using local LLM for a specific contact.
   * Optionally accepts an event or custom context for personalization.
   */
  const generateDraft = useCallback(async (
    contactId: string,
    options?: { eventId?: string; context?: string }
  ): Promise<DraftWithContext | null> => {
    const timer = startTimer('useDrafts.generateDraft');
    logger.info('Generating draft', { contactId, options });
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      // Get contact data
      const contacts = storageService.loadContacts();
      const contact = contacts.find(c => c.id === contactId);
      
      if (!contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }
      
      // Get event data if provided
      let event: Event | null = null;
      if (options?.eventId) {
        const events = storageService.loadEvents();
        event = events.find(e => e.id === options.eventId) || null;
      }
      
      // Generate content using LLM
      let result;
      if (options?.context) {
        result = await generateDraftWithContext(contact, options.context);
      } else {
        result = await generateDraftContent(contact, event);
      }
      
      // Determine scheduled time (default: 9 AM tomorrow)
      const scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(9, 0, 0, 0);
      
      // Create the draft
      const newDraft = storageService.addDraft({
        eventId: options?.eventId,
        contactId: contact.id,
        generatedContent: result.content,
        aiRationale: result.rationale,
        aiModelUsed: result.modelUsed,
        status: 'WAITING_FOR_REVIEW',
        scheduledSendTime: scheduledTime.toISOString(),
        userEdited: false,
      });
      
      // Enrich with context for UI
      const enrichedDraft: DraftWithContext = {
        ...newDraft,
        contactName: contact.fullName,
        contactAvatar: contact.avatarUrl,
        eventType: event?.eventType || 'CUSTOM',
        eventName: event?.eventName,
        healthScore: contact.healthScore,
      };
      
      // Update state with new draft
      setState(prev => ({
        ...prev,
        drafts: [enrichedDraft, ...prev.drafts],
        isGenerating: false,
      }));
      
      timer.end();
      return enrichedDraft;
      
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to generate draft', { error: error.message });
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error.message,
      }));
      timer.end();
      return null;
    }
  }, []);
  
  return {
    ...state,
    refetch: fetchData,
    approve,
    reject,
    edit,
    generateDraft,
  };
}

/**
 * Hook for selected draft state.
 */
export function useSelectedDraft() {
  const [selectedDraft, setSelectedDraft] = useState<DraftWithContext | null>(null);
  
  const select = useCallback((draft: DraftWithContext) => {
    logger.debug('Draft selected', { draftId: draft.id });
    setSelectedDraft(draft);
  }, []);
  
  const clear = useCallback(() => {
    setSelectedDraft(null);
  }, []);
  
  return {
    selectedDraft,
    select,
    clear,
  };
}
