import { getSupabaseClient } from './supabase.service';
import { telemetry } from '@/utils/telemetry';
import type { Draft, DraftWithContext, Contact, Event } from '@/types';
import type { SDKResponse } from './contactsSDK';
import { generateDraftContent } from './llm.service';
import { determineDraftStatus } from '@/utils/automation-policy';

export class MessagesSDK {
  private static get client() {
    return getSupabaseClient();
  }

  /**
   * Generate a new draft for a contact/event.
   * Fetches context, calls AI service, and saves to queue.
   */
  static async generateDraft(
    contactId: string, 
    eventId?: string,
  ): Promise<SDKResponse<DraftWithContext>> {
    return telemetry.measure('MessagesSDK.generateDraft', async () => {
      try {
        // 1. Fetch Contact Context
        const { data: contact, error: contactError } = await this.client
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();
          
        if (contactError || !contact) throw new Error('Contact not found');

        // 2. Fetch Event Context (if applicable)
        let event: Event | null = null;
        if (eventId) {
          const { data: eventData, error: eventError } = await this.client
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          if (eventError) throw new Error(`Could not load event: ${eventError.message}`);
          if (!eventData || eventData.contact_id !== contactId) {
            throw new Error('Event not found for this contact');
          }
          event = {
            id: eventData.id,
            contactId: eventData.contact_id,
            eventType: eventData.event_type,
            eventName: eventData.event_name,
            eventDate: eventData.event_date,
            originalYear: eventData.original_year,
            recurrenceRule: eventData.recurrence_rule,
            significanceLevel: eventData.significance_level,
            automationOverride: eventData.automation_override,
            reminderDaysBefore: eventData.reminder_days_before,
            notes: eventData.notes,
            createdAt: eventData.created_at,
            updatedAt: eventData.updated_at,
          };
        }

        // 3. Generate Content
        // Map snake_case DB to camelCase for AI Service
        const contactModel: Contact = {
          id: contact.id,
          userId: contact.user_id,
          fullName: contact.full_name,
          nickname: contact.nickname,
          intimacyLevel: contact.intimacy_level,
          lastInteractionDate: contact.last_interaction_date,
          relationType: contact.relation_type,
          defaultAutoPolicy: contact.default_auto_policy,
          healthScore: contact.health_score,
          ghostingRiskScore: contact.ghosting_risk_score,
          avatarUrl: contact.avatar_url,
          defaultChannel: contact.default_channel,
          notes: contact.notes,
          tags: contact.tags || [],
          createdAt: contact.created_at,
          updatedAt: contact.updated_at
        };

        const generation = await generateDraftContent(contactModel, event);
        const { content, rationale, modelUsed } = generation;
        if (!generation.success || typeof content !== 'string' || !content.trim()) {
          throw new Error(generation.error || 'Draft generation returned no usable message');
        }

        // 4. Determine Status (Auto-send logic)
        const status = determineDraftStatus(contactModel.defaultAutoPolicy, event, modelUsed);

        // 5. Save to Queue
        const { data: draft, error: insertError } = await this.client
          .from('message_queue')
          .insert({
            contact_id: contactId,
            event_id: eventId,
            generated_content: content,
            ai_rationale: rationale,
            status,
            ai_model_used: modelUsed || 'unknown',
            platform_used: contact.default_channel || 'WHATSAPP',
            scheduled_send_time: event?.eventDate || new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return { success: true, data: {
          ...this.mapDatabaseToDraft(draft),
          contactName: contactModel.fullName,
          contactAvatar: contactModel.avatarUrl,
          healthScore: contactModel.healthScore,
          eventType: event?.eventType,
          eventName: event?.eventName,
        }, error: null };
      } catch (err) {
        telemetry.trackError(err as Error, 'MessagesSDK.generateDraft');
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  /**
   * Fetch pending drafts needing review.
   */
  static async getPendingDrafts(): Promise<SDKResponse<DraftWithContext[]>> {
    return telemetry.measure('MessagesSDK.getPendingDrafts', async () => {
      try {
        const { data, error } = await this.client
          .from('message_queue')
          .select(`
            *,
            contacts (
              full_name,
              avatar_url,
              health_score
            ),
            events (
              event_type,
              event_name
            )
          `)
          .in('status', ['WAITING_FOR_REVIEW', 'APPROVED_WAITING'])
          .order('scheduled_send_time', { ascending: true });

        if (error) throw error;

        const drafts = data.map((row: any) => ({
          ...this.mapDatabaseToDraft(row),
          contactName: row.contacts.full_name,
          contactAvatar: row.contacts.avatar_url,
          healthScore: row.contacts.health_score,
          eventType: row.events?.event_type,
          eventName: row.events?.event_name,
          // Explicitly map these fields to ensure frontend gets them
          aiRationale: row.ai_rationale,
          generatedGifUrl: row.generated_gif_url
        }));

        return { success: true, data: drafts, error: null };
      } catch (err) {
        telemetry.trackError(err as Error, 'MessagesSDK.getPendingDrafts');
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  /**
   * Approve a draft for sending.
   */
  static async approveDraft(draftId: string): Promise<SDKResponse<void>> {
    return telemetry.measure('MessagesSDK.approveDraft', async () => {
      try {
        const { data, error } = await this.client
          .from('message_queue')
          .update({ status: 'APPROVED_WAITING' })
          .eq('id', draftId)
          .eq('status', 'WAITING_FOR_REVIEW')
          .select('id');

        if (error) throw error;
        if (data?.length !== 1) throw new Error('Draft is unavailable or no longer awaiting review. Refresh the queue.');
        
        telemetry.track('message.approved', { draftId });
        return { success: true, data: undefined, error: null };
      } catch (err) {
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  /**
   * Update draft content (user edit).
   */
  static async updateDraft(draftId: string, content: string): Promise<SDKResponse<void>> {
    return telemetry.measure('MessagesSDK.updateDraft', async () => {
      try {
        const trimmedContent = content.trim();
        if (!trimmedContent) throw new Error('Draft content cannot be empty');
        const { data, error } = await this.client
          .from('message_queue')
          .update({ 
            generated_content: trimmedContent,
            user_edited: true,
            edited_content: trimmedContent,
            status: 'WAITING_FOR_REVIEW',
          })
          .eq('id', draftId)
          .in('status', ['WAITING_FOR_REVIEW', 'APPROVED_WAITING'])
          .select('id');

        if (error) throw error;
        if (data?.length !== 1) throw new Error('Draft is unavailable or no longer editable. Refresh the queue.');
        return { success: true, data: undefined, error: null };
      } catch (err) {
        return { success: false, data: null, error: err as Error };
      }
    });
  }
  
  /**
   * Reject/Cancel a draft.
   */
  static async rejectDraft(draftId: string): Promise<SDKResponse<void>> {
    return telemetry.measure('MessagesSDK.rejectDraft', async () => {
      try {
        const { data, error } = await this.client
          .from('message_queue')
          .update({ status: 'CANCELLED' })
          .eq('id', draftId)
          .in('status', ['WAITING_FOR_REVIEW', 'APPROVED_WAITING'])
          .select('id');

        if (error) throw error;
        if (data?.length !== 1) throw new Error('Draft is unavailable or no longer cancellable. Refresh the queue.');
        
        telemetry.track('message.rejected', { draftId });
        return { success: true, data: undefined, error: null };
      } catch (err) {
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  // --- Mappers ---

  private static mapDatabaseToDraft(row: any): Draft {
    return {
      id: row.id,
      eventId: row.event_id,
      contactId: row.contact_id,
      generatedContent: row.generated_content,
      generatedGifQuery: row.generated_gif_query,
      generatedGifUrl: row.generated_gif_url,
      aiRationale: row.ai_rationale,
      aiModelUsed: row.ai_model_used,
      alternativeDrafts: row.alternative_drafts,
      status: row.status,
      scheduledSendTime: row.scheduled_send_time,
      actualSentTime: row.actual_sent_time,
      platformUsed: row.platform_used,
      deliveryStatus: row.delivery_status,
      errorMessage: row.error_message,
      userEdited: row.user_edited,
      editedContent: row.edited_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
