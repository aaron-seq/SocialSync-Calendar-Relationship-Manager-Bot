import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Calendar } from './calendar';

vi.mock('@/services/supabase.service', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient('http://localhost:54321', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (...args) => fetch(...args) },
  });
  return { getSupabaseClient: () => client, isSupabaseConfigured: () => true };
});

vi.mock('@/hooks/useRealtime', () => ({ useRealtime: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('shows an old weekly recurrence and a one-time SQL date together on their local day', async () => {
  vi.setSystemTime(new Date(2026, 6, 25, 12));

  const contact = { id: 'c1', full_name: 'Alice', health_score: 80, default_auto_policy: 'ALWAYS_REVIEW' };
  const once = {
    id: 'once',
    contact_id: contact.id,
    event_type: 'CUSTOM',
    event_name: 'One-time call',
    event_date: '2026-07-25',
    recurrence_rule: 'ONCE',
    significance_level: 'MEDIUM',
    automation_override: 'USE_CONTACT_DEFAULT',
    contacts: contact,
  };
  const weekly = {
    ...once,
    id: 'weekly',
    event_name: 'Weekly check-in',
    event_date: '2000-01-01',
    recurrence_rule: 'WEEKLY',
  };
  const responses: Record<string, unknown[]> = {
    '/rest/v1/events': [once, weekly],
    '/rest/v1/contacts': [contact],
  };
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname;
    const rows = responses[path];
    if (!rows) throw new Error('Unexpected request to ' + path);
    return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
  }));

  render(<Calendar />);

  const oneTimeEvent = await screen.findByText('One-time call');
  expect(screen.queryAllByText('Weekly check-in').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('heading', { name: 'Today' })).toHaveLength(1);
  expect(screen.getByText('2 events')).toBeInTheDocument();

  fireEvent.click(oneTimeEvent);
  expect(screen.getByRole('heading', { name: 'Event Details' })).toBeInTheDocument();
  expect(screen.getByText('July 25, 2026')).toBeInTheDocument();
  expect(screen.getByText('Today!')).toBeInTheDocument();
});
