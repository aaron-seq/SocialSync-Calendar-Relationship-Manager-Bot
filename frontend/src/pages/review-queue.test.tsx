import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewQueue } from './review-queue';
import { useDrafts } from '@/bloc/messages/messages.bloc';
import type { DraftWithContext } from '@/types';

vi.mock('@/bloc/messages/messages.bloc', async importOriginal => ({
  ...await importOriginal<typeof import('@/bloc/messages/messages.bloc')>(),
  useDrafts: vi.fn(),
}));

const draft: DraftWithContext = {
  id: 'draft-1', contactId: 'contact-1', contactName: 'Alex', healthScore: 80,
  generatedContent: 'Original message', status: 'WAITING_FOR_REVIEW',
  userEdited: false, createdAt: '', updatedAt: '',
};
const approveDraft = vi.fn();
const rejectDraft = vi.fn();
const updateDraft = vi.fn();
const refetch = vi.fn();

describe('ReviewQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDrafts).mockReturnValue({
      drafts: [draft], isLoading: false, isGenerating: false, error: null,
      approveDraft, rejectDraft, updateDraft, refetch, generateDraft: vi.fn(),
    });
  });

  it('shows a load failure and offers retry instead of an empty queue', () => {
    vi.mocked(useDrafts).mockReturnValue({ ...useDrafts(), drafts: [], error: 'Database unavailable' });
    render(<ReviewQueue />);
    expect(screen.getByRole('alert')).toHaveTextContent('Database unavailable');
    expect(screen.queryByText('No drafts yet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows approval failure without a success message and unlocks the action', async () => {
    approveDraft.mockRejectedValue(new Error('Draft was already sent'));
    render(<ReviewQueue />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('Draft was already sent')).toBeInTheDocument();
    expect(screen.queryByText('Draft approved')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  it('shows cancellation failure', async () => {
    rejectDraft.mockRejectedValue(new Error('Cancellation failed'));
    render(<ReviewQueue />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel draft' }));
    expect(await screen.findByText('Cancellation failed')).toBeInTheDocument();
    expect(screen.queryByText('Draft cancelled')).not.toBeInTheDocument();
  });

  it('keeps unsaved text available after an edit fails', async () => {
    updateDraft.mockRejectedValue(new Error('Save failed'));
    render(<ReviewQueue />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Revised message' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Revised message');
    expect(screen.getByRole('button', { name: /Save Changes/ })).toBeEnabled();
  });

  it('prevents duplicate approvals until the request finishes', async () => {
    let finish!: () => void;
    approveDraft.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<ReviewQueue />);
    const approve = screen.getByRole('button', { name: 'Approve' });
    fireEvent.click(approve);
    fireEvent.click(approve);
    expect(approveDraft).toHaveBeenCalledTimes(1);
    expect(approve).toBeDisabled();
    finish();
    await waitFor(() => expect(approve).toBeEnabled());
  });
});
