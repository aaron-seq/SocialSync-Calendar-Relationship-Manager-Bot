/**
 * SocialSync Type Definitions
 * 
 * Centralized TypeScript interfaces following the principle of
 * single source of truth for data structures across the application.
 * 
 * Why centralized types:
 * - Ensures consistency between UI components and API responses
 * - Makes refactoring safer with compile-time checks
 * - Provides documentation for data structures
 */

// =============================================================================
// ENUMS - Constrained string types for type safety
// =============================================================================

/**
 * Relationship classification between user and contact.
 * Used for UI grouping and automation policy defaults.
 */
export type RelationType = 'FAMILY' | 'FRIEND' | 'PARTNER' | 'WORK' | 'NETWORK';

/**
 * Event categories that trigger automated messages.
 * Each type has different significance defaults.
 */
export type EventType =
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'PROMOTION'
  | 'WEDDING'
  | 'GRADUATION'
  | 'NEW_JOB'
  | 'NEW_BABY'
  | 'HOUSE_WARMING'
  | 'NAME_DAY'
  | 'CUSTOM';

/**
 * Significance determines review requirements for low-risk policies.
 * HIGH = Always review (promotions, weddings)
 * MEDIUM = Context-dependent (birthdays)
 * LOW = Safe for automation (name days)
 */
export type SignificanceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Contact-level automation policy (default behavior).
 */
export type AutoPolicy = 'ALWAYS_REVIEW' | 'AUTO_SEND_LOW_RISK' | 'ALWAYS_AUTO_SEND';

/**
 * Event-level automation override (takes precedence over contact policy).
 */
export type AutomationOverride = 'FORCE_REVIEW' | 'FORCE_AUTO' | 'USE_CONTACT_DEFAULT';

/**
 * Message queue status workflow.
 */
export type MessageStatus =
  | 'PENDING_GENERATION'
  | 'WAITING_FOR_REVIEW'
  | 'APPROVED_WAITING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Communication channel for message delivery.
 */
export type Channel = 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'SMS';

// =============================================================================
// ENTITY INTERFACES - Core data models
// =============================================================================

/**
 * Contact entity representing a person in the user's network.
 * Maps to the `contacts` table in Supabase.
 */
export interface Contact {
  id: string;
  userId: string;
  
  // Basic Information
  fullName: string;
  nickname?: string;
  avatarUrl?: string;
  
  // Relationship
  relationType: RelationType;
  intimacyLevel: number; // 1-10 scale
  
  // Contact Details
  phoneNumber?: string;
  instagramHandle?: string;
  email?: string;
  
  // Automation
  defaultChannel: Channel;
  defaultAutoPolicy: AutoPolicy;
  
  // Health Metrics (calculated by system)
  healthScore: number; // 0-100
  lastInteractionDate?: string;
  ghostingRiskScore: number; // 0-1
  
  // Metadata
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Event entity representing a trigger for automated messages.
 * Maps to the `events` table in Supabase.
 */
export interface Event {
  id: string;
  contactId: string;
  
  // Event Details
  eventType: EventType;
  eventName?: string;
  eventDate: string;
  originalYear?: number;
  
  // Recurrence
  recurrenceRule: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'ONCE';
  
  // Automation
  significanceLevel: SignificanceLevel;
  automationOverride: AutomationOverride;
  
  // Metadata
  reminderDaysBefore: number[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Draft message in the approval queue.
 * Maps to the `message_queue` table in Supabase.
 */
export interface Draft {
  id: string;
  eventId?: string;
  contactId: string;
  
  // AI Generated Content
  generatedContent: string;
  generatedGifQuery?: string;
  generatedGifUrl?: string;
  aiRationale?: string;
  aiModelUsed?: string;
  
  // Alternative Drafts
  alternativeDrafts?: Array<{
    content: string;
    rationale: string;
  }>;
  
  // Workflow
  status: MessageStatus;
  scheduledSendTime?: string;
  actualSentTime?: string;
  
  // Delivery
  platformUsed?: Channel;
  deliveryStatus?: string;
  errorMessage?: string;
  
  // User Edits
  userEdited: boolean;
  editedContent?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Interaction log for AI context memory.
 * Maps to the `interaction_logs` table in Supabase.
 */
export interface InteractionLog {
  id: string;
  contactId: string;
  
  interactionType: 'MESSAGE_SENT' | 'MESSAGE_RECEIVED' | 'CALL' | 'VIDEO_CALL' | 'MEETING' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'NOTE';
  
  summary?: string;
  topics?: string[];
  
  // Sentiment Analysis
  sentimentScore?: number; // -1 to 1
  emotionalTone?: string;
  
  platform?: Channel | 'IN_PERSON' | 'PHONE' | 'VIDEO';
  interactionDate: string;
  createdAt: string;
}

// =============================================================================
// VIEW MODELS - Transformed data for UI consumption
// =============================================================================

/**
 * Contact with additional computed fields for UI display.
 */
export interface ContactWithMetrics extends Contact {
  upcomingEventsCount: number;
  pendingMessagesCount: number;
  daysSinceLastInteraction?: number;
}

/**
 * Event with contact information for calendar views.
 */
export interface EventWithContact extends Event {
  contactName: string;
  contactNickname?: string;
  contactAvatar?: string;
  contactHealthScore: number;
  contactAutoPolicy: AutoPolicy;
}

/**
 * Draft with full context for review UI.
 */
export interface DraftWithContext extends Draft {
  contactName: string;
  contactAvatar?: string;
  eventType?: EventType;
  eventName?: string;
  healthScore: number;
}

// =============================================================================
// API TYPES - Request/Response shapes
// =============================================================================

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * API error response structure.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result type for operations that can fail.
 * Follows the Result pattern for explicit error handling.
 */
export type Result<T, E = ApiError> =
  | { success: true; data: T }
  | { success: false; error: E };
