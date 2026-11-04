import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReviewQueue } from './review-queue';

vi.mock('@/services/supabase.service', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient('http://localhost:54321', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (...args) => fetch(...args) },
  });
  return { getSupabaseClient: () => client };
});
// Live subscriptions require a running Supabase instance; HTTP stays real up to fetch.
vi.mock('@/hooks/useRealtime', () => ({ useRealtime: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());

it('reviews, edits twice, reapproves, and cancels through /review and the real BLoC/SDK', async () => {
  const row = {
    id: 'draft-1', contact_id: 'contact-1', status: 'WAITING_FOR_REVIEW',
    generated_content: 'Original message', edited_content: '', user_edited: false,
    contacts: { full_name: 'Alex', health_score: 80 }, events: null,
  };
  const patches: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (init?.method === 'PATCH') {
      if (!url.searchParams.get('status')?.includes(row.status)) {
        return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
      }
      const change = JSON.parse(String(init.body));
      patches.push(change);
      Object.assign(row, change);
      return new Response(JSON.stringify([{ id: row.id }]), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(row.status === 'CANCELLED' ? [] : [row]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }));

  render(<MemoryRouter initialEntries={['/review']}>
    <Routes><Route path="/review" element={<ReviewQueue />} /></Routes>
  </MemoryRouter>);
  const approve = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approve);
  await waitFor(() => expect(row.status).toBe('APPROVED_WAITING'));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument());

  for (const text of ['First revision', 'Second revision']) {
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(row.edited_content).toBe(text));
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(row.status).toBe('WAITING_FOR_REVIEW');
  }
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() => expect(row.status).toBe('APPROVED_WAITING'));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel draft' }));
  expect(await screen.findByText('No drafts yet')).toBeInTheDocument();
  expect(row.status).toBe('CANCELLED');
  expect(patches).toHaveLength(5);
  expect(within(screen.getByText('No drafts yet').parentElement!).getByText(/Generate a draft/)).toBeInTheDocument();
});
