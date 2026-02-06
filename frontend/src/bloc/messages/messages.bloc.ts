import { useState, useEffect, useCallback } from 'react';
import { MessagesSDK } from '@/services/messagesSDK';
import { logger } from '@/lib/logger';
import { telemetry } from '@/utils/telemetry';
import { useRealtime } from '@/hooks/useRealtime';
import type { DraftWithContext, MessageStatus } from '@/types';

// =============================================================================
// UTILITIES
// =============================================================================

export function filterByStatus(drafts: DraftWithContext[], status: MessageStatus | 'all'): DraftWithContext[] {
  if (status === 'all') return drafts;
  return drafts.filter(d => d.status === status);
}

export function countByStatus(drafts: DraftWithContext[]): Record<string, number> {
  return drafts.reduce((acc, draft) => {
    acc[draft.status] = (acc[draft.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// =============================================================================
// REACT HOOKS
// =============================================================================

interface MessagesState {
  drafts: DraftWithContext[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

export function useMessages() {
  const [state, setState] = useState<MessagesState>({
    drafts: [],
    isLoading: true,
    isGenerating: false,
    error: null,
  });

  const fetchDrafts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await MessagesSDK.getPendingDrafts();

    if (result.success) {
      setState({
        drafts: result.data,
        isLoading: false,
        isGenerating: false,
        error: null,
      });
      telemetry.track('drafts.loaded', { count: result.data.length });
    } else {
      setState({
        drafts: [],
        isLoading: false,
        isGenerating: false,
        error: result.error.message,
      });
      logger.error('Failed to load drafts', { error: result.error });
    }
  }, []);

  // Subscribe to real-time changes
  useRealtime({
    table: 'message_queue',
    onInsert: () => { 
      logger.info('New draft generated');
      fetchDrafts(); 
    },
    onUpdate: () => {
      logger.info('Draft updated/approved');
      fetchDrafts();
    },
    onDelete: () => fetchDrafts(),
  });

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const approveDraft = useCallback(async (id: string) => {
    const result = await MessagesSDK.approveDraft(id);
    if (result.success) {
      // Optimistic update
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.map(d => 
          d.id === id ? { ...d, status: 'APPROVED_WAITING' } : d
        )
      }));
      return true;
    } else {
       // Revert or show error
       fetchDrafts();
       throw result.error;
    }
  }, [fetchDrafts]);

  const updateDraft = useCallback(async (id: string, content: string) => {
    const result = await MessagesSDK.updateDraft(id, content);
    if (result.success) {
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.map(d => 
          d.id === id ? { ...d, generatedContent: content, userEdited: true } : d
        )
      }));
      return true;
    } else {
      throw result.error;
    }
  }, []);

  const rejectDraft = useCallback(async (id: string) => {
    const result = await MessagesSDK.rejectDraft(id);
    if (result.success) {
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.filter(d => d.id !== id)
      }));
      return true;
    } else {
      throw result.error;
    }
  }, []);

  const generateDraft = useCallback(async (contactId: string) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      // Clean up previous implementation that used 'context' loosely
      // If context looks like an ID, treat it as event ID? 
      // For now, pass undefined for eventId unless explicitly handled
      const result = await MessagesSDK.generateDraft(contactId, undefined);
      
      if (!result.success) {
        throw result.error;
      }
      
      const newDraft = result.data;
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        drafts: [newDraft, ...prev.drafts]
      }));
      
      return newDraft;
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false }));
      logger.error('Failed to generate draft', { error: err });
      throw err;
    }
  }, []);

  return {
    ...state,
    refetch: fetchDrafts,
    approveDraft,
    updateDraft,
    rejectDraft,
    generateDraft
  };
}

export const useDrafts = useMessages;
