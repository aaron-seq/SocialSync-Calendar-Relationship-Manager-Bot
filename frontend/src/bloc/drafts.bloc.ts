/**
 * Drafts BLoC (Business Logic Component)
 * 
 * Encapsulates business logic for AI message draft management:
 * - Draft generation workflow
 * - Approval/rejection actions
 * - Automation policy evaluation
 */

import { useState, useEffect, useCallback } from 'react';
import { logger, startTimer } from '@/lib/logger';
import type { Draft, DraftWithContext, AutoPolicy, AutomationOverride, SignificanceLevel } from '@/types';

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_DRAFTS: DraftWithContext[] = [
  {
    id: '1',
    contactId: '1',
    eventId: 'evt-1',
    generatedContent: "Happy Birthday, Riya! Hope your special day is filled with all the joy and happiness you bring to everyone around you. Here's to another amazing year of adventures and achievements!",
    aiRationale: "Selected warm, emoji-rich tone based on high intimacy level (9) and past interaction patterns showing frequent use of emojis.",
    status: 'WAITING_FOR_REVIEW',
    scheduledSendTime: '2026-01-15T09:00:00Z',
    userEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Riya Sharma',
    eventType: 'BIRTHDAY',
    eventName: "Riya's Birthday",
    healthScore: 85,
  },
  {
    id: '2',
    contactId: '2',
    eventId: 'evt-4',
    generatedContent: "Congratulations on your well-deserved promotion to VP, Michael! Your dedication and leadership have truly paid off. Excited to see what you'll accomplish in this new role.",
    aiRationale: "Used professional tone due to WORK relation type. Avoided emojis per user preferences for work contacts.",
    status: 'WAITING_FOR_REVIEW',
    scheduledSendTime: '2026-01-22T10:00:00Z',
    userEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Michael Chen',
    eventType: 'PROMOTION',
    eventName: 'VP Promotion',
    healthScore: 35,
  },
  {
    id: '3',
    contactId: '3',
    eventId: 'evt-2',
    generatedContent: "Happy Anniversary to my favorite person! Every day with you is a gift. Can't wait for many more years of love and laughter together.",
    aiRationale: "Maximum warmth applied for PARTNER relation with intimacy level 10. Personal tone with romantic undertones.",
    status: 'APPROVED_WAITING',
    scheduledSendTime: '2026-01-18T08:00:00Z',
    userEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Sarah Johnson',
    eventType: 'ANNIVERSARY',
    healthScore: 72,
  },
];

// =============================================================================
// AUTOMATION POLICY LOGIC
// =============================================================================

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
 */
export function filterByStatus(
  drafts: DraftWithContext[],
  status: 'all' | 'review' | 'approved'
): DraftWithContext[] {
  if (status === 'all') return drafts;
  if (status === 'review') return drafts.filter(d => d.status === 'WAITING_FOR_REVIEW');
  if (status === 'approved') return drafts.filter(d => d.status === 'APPROVED_WAITING');
  return drafts;
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

// =============================================================================
// REACT HOOKS
// =============================================================================

interface DraftsState {
  drafts: DraftWithContext[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing drafts list and actions.
 */
export function useDrafts() {
  const [state, setState] = useState<DraftsState>({
    drafts: [],
    isLoading: true,
    error: null,
  });
  
  const fetchData = useCallback(async () => {
    const timer = startTimer('useDrafts.fetchData');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      logger.info('Using demo drafts');
      setState({
        drafts: DEMO_DRAFTS,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch drafts', { error: error.message });
      setState({
        drafts: [],
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
  
  const approve = useCallback(async (id: string) => {
    logger.info('Approving draft', { draftId: id });
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, status: 'APPROVED_WAITING' as const } : d
      ),
    }));
  }, []);
  
  const reject = useCallback(async (id: string) => {
    logger.info('Rejecting draft', { draftId: id });
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, status: 'CANCELLED' as const } : d
      ),
    }));
  }, []);
  
  const edit = useCallback(async (id: string, content: string) => {
    logger.info('Editing draft', { draftId: id });
    
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.map(d =>
        d.id === id ? { ...d, editedContent: content, userEdited: true } : d
      ),
    }));
  }, []);
  
  return {
    ...state,
    refetch: fetchData,
    approve,
    reject,
    edit,
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
