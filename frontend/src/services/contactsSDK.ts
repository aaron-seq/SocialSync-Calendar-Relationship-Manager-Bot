
import { getSupabaseClient, getUserId } from './supabase.service';
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
        // contacts.user_id is NOT NULL with no DB default, and RLS checks
        // auth.uid() = user_id, so the insert must carry it explicitly.
        const userId = await getUserId();
        if (!userId) throw new Error('Not signed in');

        const dbPayload = { ...this.mapContactToDatabase(contactData), user_id: userId };

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
   * Update an existing contact. Only supplied fields are written.
   */
  static async updateContact(
    id: string,
    updates: Partial<Contact>
  ): Promise<SDKResponse<Contact>> {
    return telemetry.measure('ContactsSDK.updateContact', async () => {
      try {
        const payload = {
          ...this.mapContactToDatabase(updates),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await this.client
          .from('contacts')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        telemetry.track('contact.updated', { contactId: id });
        return { success: true, data: this.mapDatabaseToContact(data), error: null };
      } catch (err) {
        const error = err as Error;
        telemetry.trackError(error, 'ContactsSDK.updateContact');
        return { success: false, data: null, error };
      }
    });
  }

  /**
   * Delete a contact. Events, drafts and logs cascade via the FK constraints
   * in database/schema.sql.
   */
  static async deleteContact(id: string): Promise<SDKResponse<void>> {
    return telemetry.measure('ContactsSDK.deleteContact', async () => {
      try {
        const { error } = await this.client.from('contacts').delete().eq('id', id);
        if (error) throw error;

        telemetry.track('contact.deleted', { contactId: id });
        return { success: true, data: undefined, error: null };
      } catch (err) {
        const error = err as Error;
        telemetry.trackError(error, 'ContactsSDK.deleteContact');
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
      phoneNumber: row.phone_number,
      email: row.email,
      instagramHandle: row.instagram_handle,
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

    // Recalculate from decay so stale DB values self-correct (no backend cron).
    // Only meaningful once there's an interaction to decay from — without one
    // the formula returns a flat 50 and would silently overwrite the score the
    // user set on the contact form.
    if (contact.lastInteractionDate) {
      contact.healthScore = calculateHealthScore(contact);
    }
    contact.ghostingRiskScore = calculateGhostingRisk(contact);

    return contact;
  }

  private static mapContactToDatabase(contact: Partial<Contact>): any {
    // Every column the contact form collects. Anything missing here is
    // silently dropped on save — the form accepts it and it never lands.
    const columns: [keyof Contact, string][] = [
      ['fullName', 'full_name'],
      ['nickname', 'nickname'],
      ['avatarUrl', 'avatar_url'],
      ['relationType', 'relation_type'],
      ['intimacyLevel', 'intimacy_level'],
      ['phoneNumber', 'phone_number'],
      ['email', 'email'],
      ['instagramHandle', 'instagram_handle'],
      ['defaultChannel', 'default_channel'],
      ['defaultAutoPolicy', 'default_auto_policy'],
      ['healthScore', 'health_score'],
      ['lastInteractionDate', 'last_interaction_date'],
      ['notes', 'notes'],
      ['tags', 'tags'],
    ];

    const payload: any = {};
    for (const [field, column] of columns) {
      // undefined means "not supplied"; null and 0 are meaningful values.
      if (contact[field] !== undefined) payload[column] = contact[field];
    }
    return payload;
  }
}
