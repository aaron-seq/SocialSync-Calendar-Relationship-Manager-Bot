/**
 * Unit Tests: LLM Service
 * 
 * Tests the local LLM integration service with mocked Ollama responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateDraftContent,
  generateDraftWithContext,
  buildPrompt,
  isLLMConfigured
} from '@/services/llm.service';
import type { Contact, Event } from '@/types';

// =============================================================================
// TEST DATA
// =============================================================================

const mockContact: Contact = {
  id: 'contact-1',
  userId: 'user-1',
  fullName: 'Priya Sharma',
  nickname: 'Pri',
  email: 'priya@example.com',
  phoneNumber: '+1 555-0101',
  relationType: 'FRIEND',
  intimacyLevel: 8,
  healthScore: 85,
  defaultChannel: 'WHATSAPP',
  defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
  ghostingRiskScore: 0.1,
  notes: 'Best friend from college. Loves hiking.',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockEvent: Event = {
  id: 'event-1',
  contactId: 'contact-1',
  eventType: 'BIRTHDAY',
  eventName: undefined,
  eventDate: '2024-03-15',
  originalYear: 1992,
  recurrenceRule: 'YEARLY',
  significanceLevel: 'MEDIUM',
  automationOverride: 'USE_CONTACT_DEFAULT',
  reminderDaysBefore: [1, 7],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// =============================================================================
// TESTS: buildPrompt
// =============================================================================

describe('buildPrompt', () => {
  it('should include contact name in prompt', () => {
    const prompt = buildPrompt(mockContact, null);
    expect(prompt).toContain('Priya Sharma');
    expect(prompt).toContain('Pri');
  });

  it('should include relationship type and intimacy level', () => {
    const prompt = buildPrompt(mockContact, null);
    expect(prompt).toContain('FRIEND');
    expect(prompt).toContain('8/10');
  });

  it('should include event details when provided', () => {
    const prompt = buildPrompt(mockContact, mockEvent);
    expect(prompt).toContain('BIRTHDAY');
    expect(prompt).toContain('2024-03-15');
    expect(prompt).toContain('1992');
  });

  it('should include custom context when provided instead of event', () => {
    const prompt = buildPrompt(mockContact, null, 'Congratulations on the new job');
    expect(prompt).toContain('Congratulations on the new job');
  });

  it('should include contact notes for personalization', () => {
    const prompt = buildPrompt(mockContact, null);
    expect(prompt).toContain('Best friend from college');
    expect(prompt).toContain('hiking');
  });
});

// =============================================================================
// TESTS: isLLMConfigured
// =============================================================================

describe('isLLMConfigured', () => {
  it('should return true when an API key is present', () => {
    expect(isLLMConfigured('gsk_testkey')).toBe(true);
  });

  it('should return false when the API key is empty', () => {
    expect(isLLMConfigured('')).toBe(false);
  });
});

// =============================================================================
// TESTS: generateDraftContent (with mocked Ollama)
// =============================================================================

describe('generateDraftContent', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should use fallback template when the API is unreachable', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

    const result = await generateDraftContent(mockContact, mockEvent, { apiKey: 'gsk_test' });

    expect(result.success).toBe(true);
    expect(result.content).toContain('Pri'); // Uses nickname
    expect(result.content).toContain('Happy Birthday');
    expect(result.modelUsed).toBe('fallback-template');
  });

  it('should use fallback template when no API key is configured', async () => {
    const result = await generateDraftContent(mockContact, mockEvent, { apiKey: '' });

    expect(result.modelUsed).toBe('fallback-template');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return the model completion when Groq responds', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama-3.3-70b-versatile',
        choices: [
          {
            message: {
              content: JSON.stringify({
                message: 'Happy Birthday Pri! Hope today is wonderful.',
                rationale: 'Warm, playful tone for a close friend.',
              }),
            },
          },
        ],
      }),
    });

    const result = await generateDraftContent(mockContact, mockEvent, { apiKey: 'gsk_test' });

    expect(result.success).toBe(true);
    expect(result.content).toBe('Happy Birthday Pri! Hope today is wonderful.');
    expect(result.rationale).toContain('close friend');
    expect(result.modelUsed).toBe('llama-3.3-70b-versatile');
  });

  it('should fall back when Groq returns a non-OK status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'invalid api key',
    });

    const result = await generateDraftContent(mockContact, mockEvent, { apiKey: 'gsk_bad' });

    expect(result.modelUsed).toBe('fallback-template');
    expect(result.error).toContain('401');
  });

  it('should handle general check-in when no event provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

    const result = await generateDraftContent(mockContact, null, { apiKey: 'gsk_test' });

    expect(result.success).toBe(true);
    expect(result.content).toContain('Pri');
    expect(result.content.toLowerCase()).toContain('caught up');
  });
});

// =============================================================================
// TESTS: generateDraftWithContext
// =============================================================================

describe('generateDraftWithContext', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate draft with custom context', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

    const result = await generateDraftWithContext(mockContact, 'Congrats on finishing the marathon!', {
      apiKey: 'gsk_test',
    });

    expect(result.success).toBe(true);
    expect(result.content).toContain('Pri');
    expect(result.modelUsed).toBe('fallback-template');
  });
});
