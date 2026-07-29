-- ============================================================
-- SocialSync: Calendar Relationship Manager Bot
-- PostgreSQL Schema for Supabase
-- ============================================================
-- This schema implements a hierarchical automation policy:
-- Event Override > Contact Default > Significance Level
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CONTACTS TABLE
-- ============================================================
-- The core relationship table storing contact info and 
-- automation defaults (the "General Rule" for this person)
-- ============================================================

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  
  -- Basic Information
  full_name text not null,
  nickname text,
  avatar_url text,
  
  -- Relationship Classification
  relation_type text check (relation_type in (
    'FAMILY', 
    'FRIEND', 
    'PARTNER', 
    'WORK', 
    'NETWORK'
  )),
  
  -- 10 = Soulmate, 1 = Acquaintance
  intimacy_level int check (intimacy_level between 1 and 10) default 5,
  
  -- Contact Channels
  phone_number text,           -- E.164 format for WhatsApp
  instagram_handle text,
  email text,
  
  -- AUTOMATION DEFAULTS: The "General Rule" for this person
  default_channel text check (default_channel in (
    'WHATSAPP', 
    'INSTAGRAM', 
    'EMAIL',
    'SMS'
  )) default 'WHATSAPP',
  
  -- Auto-Send Policy Hierarchy:
  -- ALWAYS_REVIEW: Always require human approval
  -- AUTO_SEND_LOW_RISK: Auto-send for LOW/MEDIUM significance events
  -- ALWAYS_AUTO_SEND: Never require approval (trusted contacts)
  default_auto_policy text check (default_auto_policy in (
    'ALWAYS_REVIEW', 
    'AUTO_SEND_LOW_RISK', 
    'ALWAYS_AUTO_SEND'
  )) default 'ALWAYS_REVIEW',
  
  -- Relationship Health Metrics (calculated by AI)
  health_score int check (health_score between 0 and 100) default 50,
  last_interaction_date timestamptz,
  ghosting_risk_score float check (ghosting_risk_score between 0 and 1) default 0,
  
  -- Metadata
  notes text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient user queries
create index idx_contacts_user_id on contacts(user_id);
create index idx_contacts_health_score on contacts(health_score);

-- ============================================================
-- 2. EVENTS TABLE
-- ============================================================
-- Event triggers (birthdays, anniversaries, promotions)
-- with specific automation overrides
-- ============================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts on delete cascade not null,
  
  -- Event Details
  event_type text not null check (event_type in (
    'BIRTHDAY',
    'ANNIVERSARY', 
    'PROMOTION',
    'WEDDING',
    'GRADUATION',
    'NEW_JOB',
    'NEW_BABY',
    'HOUSE_WARMING',
    'NAME_DAY',
    'CUSTOM'
  )),
  event_name text,                    -- Custom event name
  event_date date not null,           -- Next occurrence date
  original_year int,                  -- Original year (for age calculation)
  
  -- Recurrence
  recurrence_rule text check (recurrence_rule in (
    'YEARLY', 
    'MONTHLY',
    'WEEKLY',
    'ONCE'
  )) default 'YEARLY',
  
  -- Significance determines fallback behavior
  -- HIGH = Marriage, Promotion (too risky to botch)
  -- MEDIUM = Birthday, Anniversary
  -- LOW = Name Day, casual events
  significance_level text check (significance_level in (
    'LOW', 
    'MEDIUM', 
    'HIGH'
  )) default 'MEDIUM',
  
  -- SPECIFIC OVERRIDE: Does this event need review?
  -- FORCE_REVIEW: Always require approval for this event
  -- FORCE_AUTO: Always auto-send for this event
  -- USE_CONTACT_DEFAULT: Inherit from contact's policy
  automation_override text check (automation_override in (
    'FORCE_REVIEW', 
    'FORCE_AUTO', 
    'USE_CONTACT_DEFAULT'
  )) default 'USE_CONTACT_DEFAULT',
  
  -- Reminder Settings
  reminder_days_before int[] default array[1, 7],
  
  -- Metadata
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient date queries
create index idx_events_contact_id on events(contact_id);
create index idx_events_date on events(event_date);
create index idx_events_type on events(event_type);

-- ============================================================
-- 3. INTERACTION LOGS TABLE
-- ============================================================
-- Memory for Context Engineering - the AI uses this to
-- personalize messages based on conversation history
-- ============================================================

create table interaction_logs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts on delete cascade not null,
  
  -- Interaction Details
  interaction_type text not null check (interaction_type in (
    'MESSAGE_SENT',
    'MESSAGE_RECEIVED',
    'CALL',
    'VIDEO_CALL',
    'MEETING',
    'GIFT_SENT',
    'GIFT_RECEIVED',
    'NOTE'
  )),
  
  -- Content Summary (for AI context)
  summary text,                       -- "Discussed marathon training, stressed about knee"
  topics text[],                      -- ['fitness', 'health', 'running']
  
  -- Sentiment Analysis (populated by AI)
  sentiment_score float check (sentiment_score between -1 and 1),
  emotional_tone text,                -- 'happy', 'stressed', 'excited', 'neutral'
  
  -- Channel Used
  platform text check (platform in (
    'WHATSAPP',
    'INSTAGRAM', 
    'EMAIL',
    'SMS',
    'IN_PERSON',
    'PHONE',
    'VIDEO'
  )),
  
  -- Timestamps
  interaction_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for context retrieval
create index idx_interaction_logs_contact on interaction_logs(contact_id);
create index idx_interaction_logs_date on interaction_logs(interaction_date desc);

-- ============================================================
-- 4. MESSAGE QUEUE TABLE
-- ============================================================
-- The Bot's Workspace - drafts, approvals, and send status
-- ============================================================

create table message_queue (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete set null,
  contact_id uuid references contacts on delete cascade not null,
  
  -- AI Generated Content
  generated_content text,
  generated_gif_query text,           -- Search query for GIF selection
  generated_gif_url text,             -- Selected GIF URL
  ai_rationale text,                  -- Why the bot chose this draft
  ai_model_used text,                 -- 'claude-4', 'gpt-4', etc.
  
  -- Alternative Drafts (for user selection)
  alternative_drafts jsonb,           -- [{content: "...", rationale: "..."}]
  
  -- Status Workflow
  -- PENDING_GENERATION: Waiting for AI to generate draft
  -- WAITING_FOR_REVIEW: Needs human approval
  -- APPROVED_WAITING: Approved, waiting for scheduled time
  -- SENT: Successfully sent
  -- FAILED: Send attempt failed
  -- CANCELLED: User cancelled
  status text check (status in (
    'PENDING_GENERATION',
    'WAITING_FOR_REVIEW', 
    'APPROVED_WAITING', 
    'SENT', 
    'FAILED',
    'CANCELLED'
  )) default 'PENDING_GENERATION',
  
  -- Scheduling
  scheduled_send_time timestamptz,
  actual_sent_time timestamptz,
  
  -- Platform & Delivery
  platform_used text check (platform_used in (
    'WHATSAPP',
    'INSTAGRAM',
    'EMAIL',
    'SMS'
  )),
  delivery_status text,               -- Platform-specific delivery status
  error_message text,                 -- If failed, why
  
  -- User Edits
  user_edited boolean default false,
  edited_content text,                -- User's modified version
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for queue management
create index idx_message_queue_status on message_queue(status);
create index idx_message_queue_scheduled on message_queue(scheduled_send_time);
create index idx_message_queue_contact on message_queue(contact_id);

-- ============================================================
-- 5. USER ASSETS TABLE
-- ============================================================
-- Context injection data - links, templates, preferences
-- ============================================================

create table user_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  
  -- Asset Type
  asset_type text check (asset_type in (
    'CALENDLY_LINK',
    'PORTFOLIO_URL',
    'ZOOM_LINK',
    'LINKEDIN_URL',
    'SIGNATURE',
    'TEMPLATE',
    'CUSTOM'
  )),
  
  -- Asset Content
  asset_name text not null,
  asset_value text not null,
  description text,
  
  -- Usage Context
  use_in_messages boolean default true,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_assets_user on user_assets(user_id);
create index idx_user_assets_type on user_assets(asset_type);

-- ============================================================
-- 6. USER PREFERENCES TABLE
-- ============================================================
-- Global user settings and AI behavior configuration
-- ============================================================

create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  
  -- General Settings
  timezone text default 'UTC',
  default_send_time time default '09:00:00',
  preferred_language text default 'en',
  
  -- AI Behavior
  ai_personality text check (ai_personality in (
    'FORMAL',
    'CASUAL', 
    'FRIENDLY',
    'PROFESSIONAL'
  )) default 'FRIENDLY',
  include_emojis boolean default true,
  include_gifs boolean default true,
  max_message_length int default 500,
  
  -- Notification Preferences
  notification_channel text check (notification_channel in (
    'TELEGRAM',
    'EMAIL',
    'PUSH',
    'SMS'
  )) default 'TELEGRAM',
  notify_on_review_needed boolean default true,
  notify_on_send_success boolean default false,
  notify_on_send_failure boolean default true,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 7. TRIGGER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger update_contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at_column();

create trigger update_events_updated_at
  before update on events
  for each row execute function update_updated_at_column();

create trigger update_message_queue_updated_at
  before update on message_queue
  for each row execute function update_updated_at_column();

create trigger update_user_assets_updated_at
  before update on user_assets
  for each row execute function update_updated_at_column();

create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row execute function update_updated_at_column();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Ensure users can only access their own data
-- ============================================================

alter table contacts enable row level security;
alter table events enable row level security;
alter table interaction_logs enable row level security;
alter table message_queue enable row level security;
alter table user_assets enable row level security;
alter table user_preferences enable row level security;

-- Contacts: Users can only see their own contacts
create policy "Users can view own contacts"
  on contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contacts"
  on contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on contacts for delete
  using (auth.uid() = user_id);

-- Events: Users can access events for their contacts
create policy "Users can view events for own contacts"
  on events for select
  using (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

create policy "Users can insert events for own contacts"
  on events for insert
  with check (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

create policy "Users can update events for own contacts"
  on events for update
  using (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

create policy "Users can delete events for own contacts"
  on events for delete
  using (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

-- Interaction Logs: Same pattern
create policy "Users can manage own interaction logs"
  on interaction_logs for all
  using (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

-- Message Queue: Same pattern
create policy "Users can manage own message queue"
  on message_queue for all
  using (
    contact_id in (
      select id from contacts where user_id = auth.uid()
    )
  );

-- User Assets: Direct user ownership
create policy "Users can manage own assets"
  on user_assets for all
  using (auth.uid() = user_id);

-- User Preferences: Direct user ownership
create policy "Users can manage own preferences"
  on user_preferences for all
  using (auth.uid() = user_id);

-- ============================================================
-- 9. HELPER VIEWS
-- ============================================================

-- Upcoming events with contact info
create view upcoming_events_with_contacts as
select 
  e.*,
  c.full_name as contact_name,
  c.nickname as contact_nickname,
  c.avatar_url as contact_avatar,
  c.default_auto_policy,
  c.health_score,
  c.intimacy_level
from events e
join contacts c on e.contact_id = c.id
where e.event_date >= current_date
order by e.event_date asc;

-- Messages pending review
create view pending_review_messages as
select 
  mq.*,
  c.full_name as contact_name,
  c.avatar_url as contact_avatar,
  e.event_type,
  e.event_name
from message_queue mq
join contacts c on mq.contact_id = c.id
left join events e on mq.event_id = e.id
where mq.status = 'WAITING_FOR_REVIEW'
order by mq.scheduled_send_time asc;

-- Contact health dashboard
create view contact_health_dashboard as
select 
  c.id,
  c.full_name,
  c.nickname,
  c.avatar_url,
  c.relation_type,
  c.intimacy_level,
  c.health_score,
  c.ghosting_risk_score,
  c.last_interaction_date,
  extract(day from now() - c.last_interaction_date) as days_since_last_interaction,
  count(e.id) as upcoming_events_count,
  count(mq.id) filter (where mq.status = 'WAITING_FOR_REVIEW') as pending_messages
from contacts c
left join events e on c.id = e.contact_id and e.event_date >= current_date
left join message_queue mq on c.id = mq.contact_id
group by c.id;

-- =============================================================================
-- 9. REALTIME
-- =============================================================================
-- The blocs subscribe via useRealtime, but Supabase only streams changes for
-- tables in the supabase_realtime publication. Without this, subscriptions
-- connect and never receive an event, so open tabs and other devices go stale.
-- RLS still applies: subscribers only receive rows their policies allow.

do $$
declare
  t text;
begin
  foreach t in array array['contacts', 'events', 'message_queue', 'interaction_logs']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- DELETE payloads carry only the primary key unless the replica identity is
-- full, which leaves onDelete handlers unable to identify the removed row.
alter table contacts replica identity full;
alter table events replica identity full;
alter table message_queue replica identity full;
