/**
 * LLM Service - Groq Integration
 *
 * Generates personalized message drafts from contact and event context
 * using Groq's OpenAI-compatible chat completions API.
 *
 * Falls back to hardcoded templates whenever the API is unreachable or
 * unconfigured, so the app always produces something usable.
 *
 * SECURITY: VITE_ vars are inlined into the client bundle at build time,
 * so VITE_GROQ_API_KEY is readable by anyone who opens devtools on a
 * deployed site. That is acceptable for local/personal use only. Before
 * deploying publicly, move this call behind a Supabase Edge Function and
 * keep the key server-side.
 */

import { logger, startTimer } from '@/lib/logger';
import type { Contact, Event } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface LLMConfig {
  /** Groq API base URL */
  baseUrl?: string;
  /** Model to use (default: llama-3.3-70b-versatile) */
  model?: string;
  /** Temperature for generation (0-1, default: 0.7) */
  temperature?: number;
  /** Max tokens to generate (default: 256) */
  maxTokens?: number;
  /** API key. Defaults to VITE_GROQ_API_KEY. */
  apiKey?: string;
}

export interface DraftGenerationResult {
  /** Generated message content */
  content: string;
  /** AI's rationale for the generated content */
  rationale: string;
  /** Whether generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Model used for generation */
  modelUsed?: string;
}

interface GroqResponse {
  model: string;
  choices: { message: { content: string } }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: Required<LLMConfig> = {
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 256,
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
};

// =============================================================================
// PROMPT BUILDING
// =============================================================================

/**
 * Build a context-rich prompt for generating personalized messages.
 */
export function buildPrompt(
  contact: Contact,
  event: Event | null,
  eventContext?: string
): string {
  const relationshipContext = `
Contact Information:
- Name: ${contact.fullName}${contact.nickname ? ` (nickname: ${contact.nickname})` : ''}
- Relationship Type: ${contact.relationType}
- Intimacy Level: ${contact.intimacyLevel}/10
- Health Score: ${contact.healthScore}%
${contact.notes ? `- Notes: ${contact.notes}` : ''}
`.trim();

  const eventInfo = event ? `
Event Information:
- Type: ${event.eventType}
${event.eventName ? `- Name: ${event.eventName}` : ''}
- Date: ${event.eventDate}
${event.originalYear ? `- Original Year: ${event.originalYear} (${new Date().getFullYear() - event.originalYear} years)` : ''}
- Significance: ${event.significanceLevel}
${event.notes ? `- Notes: ${event.notes}` : ''}
`.trim() : eventContext ? `Event Context: ${eventContext}` : 'No specific event - general check-in message.';

  const toneGuidance = getToneGuidance(contact.relationType, contact.intimacyLevel);

  return `You are a thoughtful relationship assistant helping someone maintain meaningful connections.

${relationshipContext}

${eventInfo}

Tone Guidelines:
${toneGuidance}

Generate a warm, personalized message for ${contact.fullName}. The message should:
1. Feel genuine and personal, not generic
2. Match the relationship type and intimacy level
3. Be appropriate for the occasion
4. Be concise (2-4 sentences)

Respond in this exact JSON format:
{
  "message": "Your generated message here",
  "rationale": "Brief explanation of why you chose this tone and content"
}`;
}

/**
 * Get tone guidance based on relationship type and intimacy level.
 */
function getToneGuidance(relationType: Contact['relationType'], intimacyLevel: number): string {
  const toneMap: Record<Contact['relationType'], string[]> = {
    FAMILY: [
      'Warm and loving tone',
      'Can use family-specific references',
      'Express genuine care and affection',
    ],
    FRIEND: [
      intimacyLevel >= 8 ? 'Casual and playful tone' : 'Friendly but not overly casual',
      'Reference shared experiences if possible',
      'Use humor appropriately based on intimacy',
    ],
    PARTNER: [
      'Intimate and romantic tone',
      'Express deep affection',
      'Personal and meaningful',
    ],
    WORK: [
      'Professional yet warm tone',
      'Avoid overly casual language',
      'Respectful but not cold',
    ],
    NETWORK: [
      'Professional and polished tone',
      'Maintain appropriate distance',
      'Focus on value and mutual benefit',
    ],
  };

  return toneMap[relationType].join('\n- ');
}

// =============================================================================
// GROQ API
// =============================================================================

/**
 * Whether an API key is present. No network call — an unconfigured key is
 * the only failure we can detect without spending a request.
 */
export function isLLMConfigured(apiKey: string = DEFAULT_CONFIG.apiKey): boolean {
  if (!apiKey) {
    logger.warn('VITE_GROQ_API_KEY is not set; drafts will use fallback templates');
    return false;
  }
  return true;
}

/**
 * Generate text using Groq's chat completions API.
 *
 * Uses JSON mode so the model returns the {message, rationale} shape
 * parseResponse expects rather than prose we have to scrape.
 */
async function callGroq(
  prompt: string,
  config: Required<LLMConfig>
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a thoughtful relationship assistant. Respond ONLY with JSON of the form {"message": string, "rationale": string}.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Groq API error: ${response.status} ${response.statusText} ${body}`.trim());
  }

  const data: GroqResponse = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned no completion');
  return content;
}

/**
 * Parse LLM response to extract message and rationale.
 */
function parseResponse(response: string): { message: string; rationale: string } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || parsed.content || response,
        rationale: parsed.rationale || parsed.reason || 'Generated based on contact and event context.',
      };
    }
  } catch {
    logger.debug('Failed to parse JSON from LLM response, using raw text');
  }

  // Fallback: use the response as-is
  return {
    message: response.trim(),
    rationale: 'Generated based on contact and event context.',
  };
}

// =============================================================================
// FALLBACK TEMPLATES
// =============================================================================

/**
 * Generate a fallback message when the LLM is unavailable.
 */
function generateFallback(
  contact: Contact,
  event: Event | null
): { content: string; rationale: string } {
  const name = contact.nickname || contact.fullName.split(' ')[0];
  
  if (!event) {
    return {
      content: `Hey ${name}! It's been a while since we last caught up. Would love to hear what you've been up to. Coffee sometime?`,
      rationale: 'Fallback template: General check-in message (LLM unavailable).',
    };
  }

  const templates: Record<string, { content: string; rationale: string }> = {
    BIRTHDAY: {
      content: `Happy Birthday, ${name}! 🎂 Wishing you an amazing day filled with joy and all your favorite things. Hope this year brings you everything you deserve!`,
      rationale: 'Fallback template: Birthday greeting (LLM unavailable).',
    },
    ANNIVERSARY: {
      content: `Happy Anniversary, ${name}! 💕 Another beautiful milestone together. Here's to many more years of love, laughter, and wonderful memories!`,
      rationale: 'Fallback template: Anniversary greeting (LLM unavailable).',
    },
    PROMOTION: {
      content: `Congratulations on your promotion, ${name}! 🎉 Your hard work and dedication truly deserve this recognition. Excited to see you excel in your new role!`,
      rationale: 'Fallback template: Promotion congratulations (LLM unavailable).',
    },
    GRADUATION: {
      content: `Congratulations on your graduation, ${name}! 🎓 All that hard work has paid off. So proud of everything you've accomplished. The future is bright!`,
      rationale: 'Fallback template: Graduation congratulations (LLM unavailable).',
    },
    NEW_JOB: {
      content: `Congrats on the new role, ${name}! 🚀 This is such an exciting opportunity. Wishing you all the best as you start this new chapter!`,
      rationale: 'Fallback template: New job congratulations (LLM unavailable).',
    },
    NEW_BABY: {
      content: `Congratulations on the wonderful news, ${name}! 👶 So excited for you as you embark on this amazing journey. Can't wait to meet the little one!`,
      rationale: 'Fallback template: New baby congratulations (LLM unavailable).',
    },
    WEDDING: {
      content: `Congratulations on your wedding, ${name}! 💒 Wishing you a lifetime of love, happiness, and beautiful moments together!`,
      rationale: 'Fallback template: Wedding congratulations (LLM unavailable).',
    },
    HOUSE_WARMING: {
      content: `Congrats on the new place, ${name}! 🏠 May your new home be filled with warmth, love, and wonderful memories!`,
      rationale: 'Fallback template: Housewarming congratulations (LLM unavailable).',
    },
  };

  const template = templates[event.eventType] || {
    content: `Hey ${name}! Just wanted to reach out and see how you're doing. ${event.eventName ? `Hope the ${event.eventName} goes well!` : 'Hope everything is going great!'}`,
    rationale: 'Fallback template: Generic event message (LLM unavailable).',
  };

  return template;
}

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Generate personalized draft content using local LLM.
 * Falls back to templates if the LLM is unavailable.
 */
export async function generateDraftContent(
  contact: Contact,
  event: Event | null,
  options?: LLMConfig
): Promise<DraftGenerationResult> {
  const timer = startTimer('llm.generateDraftContent');
  const config: Required<LLMConfig> = { ...DEFAULT_CONFIG, ...options };

  logger.info('Generating draft content', {
    contactId: contact.id,
    contactName: contact.fullName,
    eventType: event?.eventType,
    model: config.model,
  });

  try {
    if (!isLLMConfigured(config.apiKey)) {
      const fallback = generateFallback(contact, event);
      return {
        content: fallback.content,
        rationale: fallback.rationale,
        success: true,
        modelUsed: 'fallback-template',
      };
    }

    const prompt = buildPrompt(contact, event);
    const response = await callGroq(prompt, config);
    const parsed = parseResponse(response);

    timer.end();

    return {
      content: parsed.message,
      rationale: parsed.rationale,
      success: true,
      modelUsed: config.model,
    };
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to generate draft content', { error: err.message });
    timer.end();

    // Fall back to templates on error
    const fallback = generateFallback(contact, event);
    return {
      content: fallback.content,
      rationale: `${fallback.rationale} (Error: ${err.message})`,
      success: true, // Still return content via fallback
      error: err.message,
      modelUsed: 'fallback-template',
    };
  }
}

/**
 * Generate draft content with a custom context string instead of an Event object.
 * Useful for ad-hoc messages without a formal event.
 */
export async function generateDraftWithContext(
  contact: Contact,
  context: string,
  options?: LLMConfig
): Promise<DraftGenerationResult> {
  const timer = startTimer('llm.generateDraftWithContext');
  const config: Required<LLMConfig> = { ...DEFAULT_CONFIG, ...options };

  logger.info('Generating draft with custom context', {
    contactId: contact.id,
    contactName: contact.fullName,
    context,
    model: config.model,
  });

  try {
    if (!isLLMConfigured(config.apiKey)) {
      const name = contact.nickname || contact.fullName.split(' ')[0];
      return {
        content: `Hey ${name}! ${context ? `Re: ${context} - ` : ''}Just wanted to reach out and see how you're doing!`,
        rationale: 'Fallback template: Custom context message (LLM unavailable).',
        success: true,
        modelUsed: 'fallback-template',
      };
    }

    const prompt = buildPrompt(contact, null, context);
    const response = await callGroq(prompt, config);
    const parsed = parseResponse(response);

    timer.end();

    return {
      content: parsed.message,
      rationale: parsed.rationale,
      success: true,
      modelUsed: config.model,
    };
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to generate draft with context', { error: err.message });
    timer.end();

    const name = contact.nickname || contact.fullName.split(' ')[0];
    return {
      content: `Hey ${name}! Just wanted to reach out and say hi!`,
      rationale: `Fallback template (Error: ${err.message})`,
      success: true,
      error: err.message,
      modelUsed: 'fallback-template',
    };
  }
}
