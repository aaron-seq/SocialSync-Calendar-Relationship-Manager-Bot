import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useMessages } from './messages.bloc';
import { MessagesSDK } from '@/services/messagesSDK';
import type { DraftWithContext } from '@/types';

vi.mock('@/services/messagesSDK', () => ({ MessagesSDK: {
  getPendingDrafts: vi.fn(), updateDraft: vi.fn(),
} }));
vi.mock('@/hooks/useRealtime', () => ({ useRealtime: vi.fn() }));

it('updates the displayed edited text and returns an approved draft to review', async () => {
  const draft: DraftWithContext = {
    id: 'draft-1', contactId: 'contact-1', contactName: 'Alex', healthScore: 80,
    generatedContent: 'Original', editedContent: 'First edit', userEdited: true,
    status: 'APPROVED_WAITING', createdAt: '', updatedAt: '',
  };
  vi.mocked(MessagesSDK.getPendingDrafts).mockResolvedValue({ success: true, data: [draft], error: null });
  vi.mocked(MessagesSDK.updateDraft).mockResolvedValue({ success: true, data: undefined, error: null });
  const { result } = renderHook(() => useMessages());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => { await result.current.updateDraft(draft.id, ' Second edit '); });
  expect(result.current.drafts[0]).toMatchObject({
    generatedContent: 'Second edit', editedContent: 'Second edit', status: 'WAITING_FOR_REVIEW',
  });
});
