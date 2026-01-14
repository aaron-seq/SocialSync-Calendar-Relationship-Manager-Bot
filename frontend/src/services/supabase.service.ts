/**
 * Supabase Service Layer
 * 
 * Provides a centralized interface for database operations with:
 * - Connection management and retry logic
 * - Error handling with structured logging
 * - Type-safe query builders
 * 
 * Why a service layer:
 * - Isolates third-party dependency (Supabase) from business logic
 * - Enables mocking for unit tests
 * - Centralizes error handling and retry policies
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type { Contact, Event, Draft, Result } from '@/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance.
 * Uses singleton pattern to prevent multiple connections.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      logger.warn('Supabase credentials not configured, using demo mode');
      // Return a mock client for development without Supabase
      return createMockClient();
    }
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
    
    logger.info('Supabase client initialized');
  }
  
  return supabaseClient;
}

/**
 * Creates a mock client for development when Supabase is not configured.
 * This allows the UI to function with demo data.
 */
function createMockClient(): SupabaseClient {
  // Return minimal mock - actual implementation would need full mock
  return {} as SupabaseClient;
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Execute a database operation with retry logic.
 * Implements exponential backoff for transient failures.
 * 
 * @param operation - Async function to execute
 * @param context - Description for error logging
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<Result<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error as Error;
      
      logger.warn(`${context} failed (attempt ${attempt}/${MAX_RETRIES})`, {
        error: lastError.message,
        attempt,
      });
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }
  
  logger.error(`${context} failed after ${MAX_RETRIES} attempts`, {
    error: lastError?.message,
    stack: lastError?.stack,
  });
  
  return {
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: lastError?.message || 'Unknown database error',
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// CONTACT OPERATIONS
// =============================================================================

/**
 * Fetch all contacts for the current user.
 */
export async function fetchContacts(): Promise<Result<Contact[]>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const { data, error } = await client
      .from('contacts')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) throw new Error(error.message);
    return transformContactsFromDb(data || []);
  }, 'fetchContacts');
}

/**
 * Fetch a single contact by ID.
 */
export async function fetchContactById(id: string): Promise<Result<Contact | null>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const { data, error } = await client
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }
    
    return transformContactFromDb(data);
  }, 'fetchContactById');
}

/**
 * Create a new contact.
 */
export async function createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Contact>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const { data, error } = await client
      .from('contacts')
      .insert(transformContactToDb(contact))
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return transformContactFromDb(data);
  }, 'createContact');
}

// =============================================================================
// EVENT OPERATIONS
// =============================================================================

/**
 * Fetch upcoming events with contact information.
 */
export async function fetchUpcomingEvents(limit: number = 10): Promise<Result<Event[]>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await client
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return transformEventsFromDb(data || []);
  }, 'fetchUpcomingEvents');
}

// =============================================================================
// DRAFT OPERATIONS
// =============================================================================

/**
 * Fetch drafts pending review.
 */
export async function fetchPendingDrafts(): Promise<Result<Draft[]>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const { data, error } = await client
      .from('message_queue')
      .select('*')
      .eq('status', 'WAITING_FOR_REVIEW')
      .order('scheduled_send_time', { ascending: true });
    
    if (error) throw new Error(error.message);
    return transformDraftsFromDb(data || []);
  }, 'fetchPendingDrafts');
}

/**
 * Approve a draft for sending.
 */
export async function approveDraft(id: string): Promise<Result<Draft>> {
  const client = getSupabaseClient();
  
  return withRetry(async () => {
    const { data, error } = await client
      .from('message_queue')
      .update({ status: 'APPROVED_WAITING' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    logger.info('Draft approved', { draftId: id });
    return transformDraftFromDb(data);
  }, 'approveDraft');
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

/**
 * Transform database snake_case to TypeScript camelCase.
 * Also handles type coercion for enums.
 */
function transformContactFromDb(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    fullName: row.full_name as string,
    nickname: row.nickname as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    relationType: row.relation_type as Contact['relationType'],
    intimacyLevel: row.intimacy_level as number,
    phoneNumber: row.phone_number as string | undefined,
    instagramHandle: row.instagram_handle as string | undefined,
    email: row.email as string | undefined,
    defaultChannel: row.default_channel as Contact['defaultChannel'],
    defaultAutoPolicy: row.default_auto_policy as Contact['defaultAutoPolicy'],
    healthScore: row.health_score as number,
    lastInteractionDate: row.last_interaction_date as string | undefined,
    ghostingRiskScore: row.ghosting_risk_score as number,
    notes: row.notes as string | undefined,
    tags: row.tags as string[] | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformContactsFromDb(rows: Record<string, unknown>[]): Contact[] {
  return rows.map(transformContactFromDb);
}

function transformContactToDb(contact: Partial<Contact>): Record<string, unknown> {
  return {
    full_name: contact.fullName,
    nickname: contact.nickname,
    avatar_url: contact.avatarUrl,
    relation_type: contact.relationType,
    intimacy_level: contact.intimacyLevel,
    phone_number: contact.phoneNumber,
    instagram_handle: contact.instagramHandle,
    email: contact.email,
    default_channel: contact.defaultChannel,
    default_auto_policy: contact.defaultAutoPolicy,
    notes: contact.notes,
    tags: contact.tags,
  };
}

function transformEventFromDb(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    eventType: row.event_type as Event['eventType'],
    eventName: row.event_name as string | undefined,
    eventDate: row.event_date as string,
    originalYear: row.original_year as number | undefined,
    recurrenceRule: row.recurrence_rule as Event['recurrenceRule'],
    significanceLevel: row.significance_level as Event['significanceLevel'],
    automationOverride: row.automation_override as Event['automationOverride'],
    reminderDaysBefore: row.reminder_days_before as number[],
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformEventsFromDb(rows: Record<string, unknown>[]): Event[] {
  return rows.map(transformEventFromDb);
}

function transformDraftFromDb(row: Record<string, unknown>): Draft {
  return {
    id: row.id as string,
    eventId: row.event_id as string | undefined,
    contactId: row.contact_id as string,
    generatedContent: row.generated_content as string,
    generatedGifQuery: row.generated_gif_query as string | undefined,
    generatedGifUrl: row.generated_gif_url as string | undefined,
    aiRationale: row.ai_rationale as string | undefined,
    aiModelUsed: row.ai_model_used as string | undefined,
    alternativeDrafts: row.alternative_drafts as Draft['alternativeDrafts'],
    status: row.status as Draft['status'],
    scheduledSendTime: row.scheduled_send_time as string | undefined,
    actualSentTime: row.actual_sent_time as string | undefined,
    platformUsed: row.platform_used as Draft['platformUsed'],
    deliveryStatus: row.delivery_status as string | undefined,
    errorMessage: row.error_message as string | undefined,
    userEdited: row.user_edited as boolean,
    editedContent: row.edited_content as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformDraftsFromDb(rows: Record<string, unknown>[]): Draft[] {
  return rows.map(transformDraftFromDb);
}
