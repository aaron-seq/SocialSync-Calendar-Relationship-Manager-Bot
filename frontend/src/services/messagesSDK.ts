import { getSupabaseClient } from './supabase.service';
import { telemetry } from '@/utils/telemetry';
import type { Draft, DraftWithContext, Contact } from '@/types';
import type { SDKResponse } from './contactsSDK';
import { AIService } from './ai.service';

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
    // context?: string // Not used currently
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
        let event: any = undefined;
        if (eventId) {
          const { data: eventData } = await this.client
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          event = eventData;
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
          // ... map other strictly required fields for AI
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

        const { content, rationale } = await AIService.generateMessage({
          contact: contactModel,
          event: event ? { ...event, eventType: event.event_type } : undefined, // Partial map
          eventType: event?.event_type || 'CUSTOM',
        });

        // 4. Determine Status (Auto-send logic)
        let status = 'WAITING_FOR_REVIEW';
        if (contact.default_auto_policy === 'ALWAYS_AUTO_SEND') {
          status = 'APPROVED_WAITING';
        }
        // Could check event significance too

        // 5. Save to Queue
        const { data: draft, error: insertError } = await this.client
          .from('message_queue')
          .insert({
            contact_id: contactId,
            event_id: eventId,
            generated_content: content,
            ai_rationale: rationale,
            status,
            ai_model_used: 'template-v1',
            platform_used: contact.default_channel || 'WHATSAPP',
            scheduled_send_time: event?.event_date || new Date().toISOString() // Should actually be calculated
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return { success: true, data: this.mapDatabaseToDraft(draft) as DraftWithContext, error: null };
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
        const { error } = await this.client
          .from('message_queue')
          .update({ status: 'APPROVED_WAITING' })
          .eq('id', draftId);

        if (error) throw error;
        
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
        const { error } = await this.client
          .from('message_queue')
          .update({ 
            generated_content: content,
            user_edited: true,
            edited_content: content 
          })
          .eq('id', draftId);

        if (error) throw error;
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
        const { error } = await this.client
          .from('message_queue')
          .update({ status: 'CANCELLED' })
          .eq('id', draftId);

        if (error) throw error;
        
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
