export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          user_id: string
          full_name: string
          nickname: string | null
          avatar_url: string | null
          relation_type: 'FAMILY' | 'FRIEND' | 'PARTNER' | 'WORK' | 'NETWORK'
          intimacy_level: number
          phone_number: string | null
          instagram_handle: string | null
          email: string | null
          default_channel: 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'SMS'
          default_auto_policy: 'ALWAYS_REVIEW' | 'AUTO_SEND_LOW_RISK' | 'ALWAYS_AUTO_SEND'
          health_score: number
          last_interaction_date: string | null
          ghosting_risk_score: number
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          full_name: string
          nickname?: string | null
          avatar_url?: string | null
          relation_type: 'FAMILY' | 'FRIEND' | 'PARTNER' | 'WORK' | 'NETWORK'
          intimacy_level?: number
          phone_number?: string | null
          instagram_handle?: string | null
          email?: string | null
          default_channel?: 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'SMS'
          default_auto_policy?: 'ALWAYS_REVIEW' | 'AUTO_SEND_LOW_RISK' | 'ALWAYS_AUTO_SEND'
          health_score?: number
          last_interaction_date?: string | null
          ghosting_risk_score?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          nickname?: string | null
          avatar_url?: string | null
          relation_type?: 'FAMILY' | 'FRIEND' | 'PARTNER' | 'WORK' | 'NETWORK'
          intimacy_level?: number
          phone_number?: string | null
          instagram_handle?: string | null
          email?: string | null
          default_channel?: 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'SMS'
          default_auto_policy?: 'ALWAYS_REVIEW' | 'AUTO_SEND_LOW_RISK' | 'ALWAYS_AUTO_SEND'
          health_score?: number
          last_interaction_date?: string | null
          ghosting_risk_score?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          contact_id: string
          event_type: string
          event_name: string | null
          event_date: string
          original_year: number | null
          recurrence_rule: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'ONCE'
          significance_level: 'LOW' | 'MEDIUM' | 'HIGH'
          automation_override: 'FORCE_REVIEW' | 'FORCE_AUTO' | 'USE_CONTACT_DEFAULT'
          reminder_days_before: number[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          event_type: string
          event_name?: string | null
          event_date: string
          original_year?: number | null
          recurrence_rule?: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'ONCE'
          significance_level?: 'LOW' | 'MEDIUM' | 'HIGH'
          automation_override?: 'FORCE_REVIEW' | 'FORCE_AUTO' | 'USE_CONTACT_DEFAULT'
          reminder_days_before?: number[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          event_type?: string
          event_name?: string | null
          event_date?: string
          original_year?: number | null
          recurrence_rule?: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'ONCE'
          significance_level?: 'LOW' | 'MEDIUM' | 'HIGH'
          automation_override?: 'FORCE_REVIEW' | 'FORCE_AUTO' | 'USE_CONTACT_DEFAULT'
          reminder_days_before?: number[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interaction_logs: {
        Row: {
          id: string
          contact_id: string
          interaction_type: string
          summary: string | null
          topics: string[] | null
          sentiment_score: number | null
          emotional_tone: string | null
          platform: string | null
          interaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          interaction_type: string
          summary?: string | null
          topics?: string[] | null
          sentiment_score?: number | null
          emotional_tone?: string | null
          platform?: string | null
          interaction_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          interaction_type?: string
          summary?: string | null
          topics?: string[] | null
          sentiment_score?: number | null
          emotional_tone?: string | null
          platform?: string | null
          interaction_date?: string
          created_at?: string
        }
      }
    }
  }
}
