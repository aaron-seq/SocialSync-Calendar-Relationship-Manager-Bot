
import { getSupabaseClient } from './supabase.service';
import { telemetry } from '@/utils/telemetry';
import { calculateHealthScore, calculateGhostingRisk } from '@/utils/relationship-math';
import type { Contact } from '@/types';
// import { Database } from '@/types/database.types'; // Not used in this file yet
export type SDKResponse<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: Error };

export class ContactsSDK {
  private static get client() {
    return getSupabaseClient();
  }

  /**
   * Fetches all contacts for the current user.
   * Includes error handling and telemetry.
   */
  static async getContacts(): Promise<SDKResponse<Contact[]>> {
    return telemetry.measure('ContactsSDK.getContacts', async () => {
      try {
        const { data, error } = await this.client
          .from('contacts')
          .select('*')
          .order('health_score', { ascending: true }); // Prioritize low health

        if (error) throw error;

        // Map database naming to frontend camelCase if needed
        // Assuming types match or using a mapper
        const contacts: Contact[] = data.map(this.mapDatabaseToContact);

        return { success: true, data: contacts, error: null };
      } catch (err) {
        const error = err as Error;
        telemetry.trackError(error, 'ContactsSDK.getContacts');
        return { success: false, data: null, error };
      }
    });
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: Partial<Contact>): Promise<SDKResponse<Contact>> {
    return telemetry.measure('ContactsSDK.createContact', async () => {
      try {
        // Prepare data for DB (snake_case conversion if needed)
        const dbPayload = this.mapContactToDatabase(contactData);

        const { data, error } = await this.client
          .from('contacts')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        telemetry.track('contact.created', {
          relationType: data.relation_type,
          autoPolicy: data.default_auto_policy
        });

        return { success: true, data: this.mapDatabaseToContact(data), error: null };
      } catch (err) {
        const error = err as Error;
        telemetry.trackError(error, 'ContactsSDK.createContact');
        return { success: false, data: null, error };
      }
    });
  }

  /**
   * Update interaction - updates last_interaction_date and health_score
   * This is a critical business logic often shared
   */
  static async updateInteraction(
    contactId: string, 
    date: Date, 
    type: string
  ): Promise<SDKResponse<void>> {
    return telemetry.measure('ContactsSDK.updateInteraction', async () => {
      try {
        // 1. Log interaction
        const { error: logError } = await this.client
          .from('interaction_logs')
          .insert({
            contact_id: contactId,
            interaction_date: date.toISOString(),
            interaction_type: type
          });

        if (logError) throw logError;

        // 2. Update contact last interaction
        // Note: Health score calculation might happen via Edge Function or Trigger
        // For now, we update the timestamp
        const { error: updateError } = await this.client
          .from('contacts')
          .update({ 
            last_interaction_date: date.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId);

        if (updateError) throw updateError;

        return { success: true, data: undefined, error: null };
      } catch (err) {
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  // --- Mappers ---



  private static mapDatabaseToContact(row: any): Contact {
    const contact: Contact = {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      nickname: row.nickname,
      avatarUrl: row.avatar_url,
      relationType: row.relation_type,
      intimacyLevel: row.intimacy_level,
      defaultChannel: row.default_channel,
      defaultAutoPolicy: row.default_auto_policy,
      healthScore: row.health_score, // Use DB value initially
      lastInteractionDate: row.last_interaction_date,
      ghostingRiskScore: row.ghosting_risk_score,
      notes: row.notes,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Dynamically recalculate to ensure freshness
    // This handles the case where DB values are stale (no backend cron)
    contact.healthScore = calculateHealthScore(contact);
    contact.ghostingRiskScore = calculateGhostingRisk(contact);

    return contact;
  }

  private static mapContactToDatabase(contact: Partial<Contact>): any {
    // Only map fields that are present
    const payload: any = {};
    if (contact.fullName) payload.full_name = contact.fullName;
    if (contact.nickname) payload.nickname = contact.nickname;
    if (contact.relationType) payload.relation_type = contact.relationType;
    if (contact.intimacyLevel) payload.intimacy_level = contact.intimacyLevel;
    if (contact.defaultChannel) payload.default_channel = contact.defaultChannel;
    if (contact.defaultAutoPolicy) payload.default_auto_policy = contact.defaultAutoPolicy;
    // ... add other fields as needed
    return payload;
  }
}
