import { getSupabaseClient } from './supabase.service';
import { telemetry } from '@/utils/telemetry';
import { expandRecurringEvents } from '@/utils/date-logic';
import type { Event, EventWithContact } from '@/types';
import type { SDKResponse } from './contactsSDK';

export class EventsSDK {
  private static get client() {
    return getSupabaseClient();
  }

  /**
   * Fetch events with associated contact details.
   * Useful for calendar views.
   */
  static async getEvents(
    startDate?: Date, 
    endDate?: Date
  ): Promise<SDKResponse<EventWithContact[]>> {
    return telemetry.measure('EventsSDK.getEvents', async () => {
      try {
        // Fetch all events to handle recurrence properly
        // In a larger app, we'd use more complex query filtering
        const { data, error } = await this.client
          .from('events')
          .select(`
            *,
            contacts (
              full_name,
              nickname,
              avatar_url,
              health_score,
              default_auto_policy
            )
          `);

        if (error) throw error;

        const rawEvents = data.map((row: any) => ({
          ...this.mapDatabaseToEvent(row),
          contactName: row.contacts.full_name,
          contactNickname: row.contacts.nickname,
          contactAvatar: row.contacts.avatar_url,
          contactHealthScore: row.contacts.health_score,
          contactAutoPolicy: row.contacts.default_auto_policy,
        }));

        // Default range: Today - 1 month to Today + 1 year if not specified
        const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));

        const expandedEvents = expandRecurringEvents(rawEvents, start, end);

        return { success: true, data: expandedEvents, error: null };
      } catch (err) {
        telemetry.trackError(err as Error, 'EventsSDK.getEvents');
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  static async createEvent(eventData: Partial<Event>): Promise<SDKResponse<Event>> {
    return telemetry.measure('EventsSDK.createEvent', async () => {
      try {
        // Map frontend camelCase to DB snake_case
        const dbPayload: any = {
           contact_id: eventData.contactId,
           event_type: eventData.eventType,
           event_name: eventData.eventName,
           event_date: eventData.eventDate,
           original_year: eventData.originalYear,
           recurrence_rule: eventData.recurrenceRule || 'YEARLY',
           significance_level: eventData.significanceLevel || 'MEDIUM',
           automation_override: eventData.automationOverride || 'USE_CONTACT_DEFAULT',
           reminder_days_before: eventData.reminderDaysBefore,
           notes: eventData.notes
        };

        const { data, error } = await this.client
          .from('events')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        telemetry.track('event.created', { type: data.event_type });

        return { success: true, data: this.mapDatabaseToEvent(data), error: null };
      } catch (err) {
        telemetry.trackError(err as Error, 'EventsSDK.createEvent');
        return { success: false, data: null, error: err as Error };
      }
    });
  }

  // --- Mappers ---

  private static mapDatabaseToEvent(row: any): Event {
    return {
      id: row.id,
      contactId: row.contact_id,
      eventType: row.event_type,
      eventName: row.event_name,
      eventDate: row.event_date,
      originalYear: row.original_year,
      recurrenceRule: row.recurrence_rule,
      significanceLevel: row.significance_level,
      automationOverride: row.automation_override,
      reminderDaysBefore: row.reminder_days_before || [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
