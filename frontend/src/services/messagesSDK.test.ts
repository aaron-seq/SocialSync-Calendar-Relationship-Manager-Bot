import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesSDK } from './messagesSDK';
import { generateDraftContent } from './llm.service';
import type { AutoPolicy, AutomationOverride, MessageStatus, SignificanceLevel } from '@/types';

// Exercise the real Supabase query builder against a disposable HTTP fixture.
vi.mock('./supabase.service', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient('http://localhost:54321', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (...args) => fetch(...args) },
  });
  return { getSupabaseClient: () => client };
});
vi.mock('./llm.service', () => ({ generateDraftContent: vi.fn() }));
vi.mock('@/utils/telemetry', () => ({
  telemetry: { measure: (_name: string, fn: () => unknown) => fn(), track: vi.fn(), trackError: vi.fn() },
}));

const contact = {
  id: 'contact-1', user_id: 'user-1', full_name: 'Alex Doe', avatar_url: 'avatar.png',
  intimacy_level: 7, relation_type: 'FRIEND', default_auto_policy: 'ALWAYS_AUTO_SEND',
  default_channel: 'EMAIL', health_score: 80, ghosting_risk_score: 0.1,
};
const event = {
  id: 'event-1', contact_id: contact.id, event_type: 'BIRTHDAY', event_name: 'Birthday',
  event_date: '2026-11-20', significance_level: 'HIGH', automation_override: 'FORCE_REVIEW',
  recurrence_rule: 'YEARLY', reminder_days_before: [1], notes: 'Keep it brief',
};
const generated = { content: 'Happy birthday, Alex!', rationale: 'Warm greeting', success: true, modelUsed: 'test-model' };

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('MessagesSDK generation', () => {
  let saved: Record<string, unknown>;
  let contactRow: Record<string, unknown>;
  let eventRow: Record<string, unknown>;
  let eventFailure: boolean;
  let missingEvent: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    saved = {};
    contactRow = { ...contact };
    eventRow = { ...event };
    eventFailure = false;
    missingEvent = false;
    vi.mocked(generateDraftContent).mockResolvedValue({ ...generated });
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/contacts')) return json(contactRow);
      if (url.pathname.endsWith('/events')) {
        if (eventFailure) return json({ message: 'Event unavailable' }, 403);
        return json(missingEvent ? null : eventRow);
      }
      saved = JSON.parse(String(init?.body));
      return json({ ...saved, id: 'draft-1' });
    }));
  });

  const policies: AutoPolicy[] = ['ALWAYS_REVIEW', 'AUTO_SEND_LOW_RISK', 'ALWAYS_AUTO_SEND'];
  const overrides: AutomationOverride[] = ['FORCE_REVIEW', 'FORCE_AUTO', 'USE_CONTACT_DEFAULT'];
  const levels: SignificanceLevel[] = ['HIGH', 'MEDIUM', 'LOW'];
  for (const policy of policies) for (const override of overrides) for (const level of levels) {
    const approved = override === 'FORCE_AUTO' || (override === 'USE_CONTACT_DEFAULT' &&
      (policy === 'ALWAYS_AUTO_SEND' || (policy === 'AUTO_SEND_LOW_RISK' && level !== 'HIGH')));
    it(`${policy} / ${override} / ${level} ${approved ? 'approves' : 'requires review'}`, async () => {
      contactRow.default_auto_policy = policy;
      eventRow.automation_override = override;
      eventRow.significance_level = level;
      const result = await MessagesSDK.generateDraft(contact.id, event.id);
      expect(result.success).toBe(true);
      expect(saved.status).toBe(approved ? 'APPROVED_WAITING' : 'WAITING_FOR_REVIEW');
    });
  }

  it('passes full event context to generation and returns usable contact context', async () => {
    const result = await MessagesSDK.generateDraft(contact.id, event.id);
    expect(generateDraftContent).toHaveBeenCalledWith(expect.objectContaining({ fullName: contact.full_name }),
      expect.objectContaining({ eventDate: event.event_date, significanceLevel: 'HIGH', notes: event.notes }));
    expect(result.data).toMatchObject({ contactName: contact.full_name, contactAvatar: contact.avatar_url, healthScore: 80, eventName: 'Birthday' });
  });

  it.each(['FORCE_AUTO', 'USE_CONTACT_DEFAULT'])('requires review for fallback templates even with %s', async override => {
    eventRow.automation_override = override;
    vi.mocked(generateDraftContent).mockResolvedValue({ ...generated, modelUsed: 'fallback-template' });
    await MessagesSDK.generateDraft(contact.id, event.id);
    expect(saved.status).toBe('WAITING_FOR_REVIEW');
  });

  it.each(['error', 'missing', 'wrong-contact'])('does not generate or save when event context is %s', async failure => {
    if (failure === 'error') eventFailure = true;
    if (failure === 'missing') missingEvent = true;
    if (failure === 'wrong-contact') eventRow.contact_id = 'another-contact';
    const result = await MessagesSDK.generateDraft(contact.id, event.id);
    expect(result.success).toBe(false);
    expect(generateDraftContent).not.toHaveBeenCalled();
    expect(saved).toEqual({});
  });

  it('does not save unsuccessful or empty generation', async () => {
    vi.mocked(generateDraftContent).mockResolvedValue({ ...generated, success: false, content: '' });
    expect((await MessagesSDK.generateDraft(contact.id)).success).toBe(false);
    expect(saved).toEqual({});
  });

  it('requires review for a check-in without event risk context under low-risk policy', async () => {
    contactRow.default_auto_policy = 'AUTO_SEND_LOW_RISK';
    const result = await MessagesSDK.generateDraft(contact.id);
    expect(result.success).toBe(true);
    expect(saved.status).toBe('WAITING_FOR_REVIEW');
    expect(result.data?.contactName).toBe(contact.full_name);
  });
});

describe('MessagesSDK queue transitions', () => {
  let row: { id: string; status: MessageStatus; generated_content: string; edited_content?: string };
  beforeEach(() => {
    row = { id: 'draft-1', status: 'WAITING_FOR_REVIEW', generated_content: 'Original' };
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const matchesStatus = !url.searchParams.has('status') ||
        url.searchParams.get('status')!.includes(row.status);
      if (url.searchParams.get('id') !== `eq.${row.id}` || !matchesStatus) return json([]);
      Object.assign(row, JSON.parse(String(init?.body)));
      return json([{ id: row.id }]);
    }));
  });

  it('approves a draft awaiting review', async () => {
    expect((await MessagesSDK.approveDraft(row.id)).success).toBe(true);
    expect(row.status).toBe('APPROVED_WAITING');
  });

  for (const status of ['SENT', 'CANCELLED', 'FAILED', 'PENDING_GENERATION'] as const) {
    it(`does not approve, edit, or cancel a ${status} draft`, async () => {
      row.status = status;
      const before = { ...row };
      expect((await MessagesSDK.approveDraft(row.id)).success).toBe(false);
      expect((await MessagesSDK.updateDraft(row.id, 'Changed')).success).toBe(false);
      expect((await MessagesSDK.rejectDraft(row.id)).success).toBe(false);
      expect(row).toEqual(before);
    });
  }

  it('detects a missing or RLS-hidden draft for every action', async () => {
    expect((await MessagesSDK.approveDraft('missing')).success).toBe(false);
    expect((await MessagesSDK.updateDraft('missing', 'Changed')).success).toBe(false);
    expect((await MessagesSDK.rejectDraft('missing')).success).toBe(false);
  });

  it('requires a fresh approval after editing an approved draft', async () => {
    row.status = 'APPROVED_WAITING';
    expect((await MessagesSDK.updateDraft(row.id, ' Changed ')).success).toBe(true);
    expect(row).toMatchObject({ status: 'WAITING_FOR_REVIEW', edited_content: 'Changed' });
  });

  it('rejects blank edits without changing the row', async () => {
    expect((await MessagesSDK.updateDraft(row.id, '  ')).success).toBe(false);
    expect(row.generated_content).toBe('Original');
  });

  it('allows cancellation after approval', async () => {
    row.status = 'APPROVED_WAITING';
    expect((await MessagesSDK.rejectDraft(row.id)).success).toBe(true);
    expect(row.status).toBe('CANCELLED');
  });
});
