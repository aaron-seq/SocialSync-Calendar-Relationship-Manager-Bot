import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { useContacts } from '@/bloc/contacts/contacts.bloc';
import { useMessages } from '@/bloc/messages/messages.bloc';
import { isLLMConfigured } from '@/services/llm.service';
import { getUserId } from '@/services/supabase.service';
import { calculateAverageHealth } from '@/bloc/contacts/contacts.bloc';
import { Database, Sparkles, Bell, User, Check, X } from 'lucide-react';

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm text-starlight">{label}</p>
        <p className="text-xs text-moon-dust break-all">{detail}</p>
      </div>
      {ok ? (
        <span className="flex items-center gap-1 text-xs text-cyber-emerald flex-shrink-0">
          <Check className="w-3.5 h-3.5" /> Connected
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-solar-amber flex-shrink-0">
          <X className="w-3.5 h-3.5" /> Not set
        </span>
      )}
    </div>
  );
}

export function Settings() {
  const { contacts } = useContacts();
  const { drafts } = useMessages();
  const [userId, setUserId] = useState<string | null>(null);
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const groqReady = isLLMConfigured();

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    setPermission(await Notification.requestPermission());
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-starlight">Settings</h1>
        <p className="text-moon-dust mt-1">Connection status and preferences</p>
      </div>

      <GlassCard className="p-5">
        <h2 className="font-medium text-starlight flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-neon-violet" /> Connections
        </h2>
        <div className="divide-y divide-white/5">
          <StatusRow
            label="Supabase"
            ok={Boolean(supabaseUrl)}
            detail={supabaseUrl || 'Set VITE_SUPABASE_URL in frontend/.env'}
          />
          <StatusRow
            label="Groq"
            ok={groqReady}
            detail={
              groqReady
                ? 'llama-3.3-70b-versatile'
                : 'No VITE_GROQ_API_KEY — drafts use built-in templates'
            }
          />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-medium text-starlight flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-neon-violet" /> Notifications
        </h2>
        {permission === 'unsupported' && (
          <p className="text-sm text-moon-dust">This browser does not support notifications.</p>
        )}
        {permission === 'granted' && (
          <p className="text-sm text-cyber-emerald flex items-center gap-2">
            <Check className="w-4 h-4" /> Enabled. Event reminders will appear as system notifications.
          </p>
        )}
        {permission === 'denied' && (
          <p className="text-sm text-moon-dust">
            Blocked. Re-enable notifications for this site in your browser settings.
          </p>
        )}
        {permission === 'default' && (
          <button onClick={requestPermission} className="btn-neon text-sm">
            Enable browser notifications
          </button>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-medium text-starlight flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-neon-violet" /> Your data
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-display font-bold text-starlight">{contacts.length}</p>
            <p className="text-xs text-moon-dust">Contacts</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-starlight">{drafts.length}</p>
            <p className="text-xs text-moon-dust">Drafts</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-starlight">
              {contacts.length > 0 ? `${calculateAverageHealth(contacts)}%` : '—'}
            </p>
            <p className="text-xs text-moon-dust">Avg health</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-medium text-starlight flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-neon-violet" /> Account
        </h2>
        <p className="text-sm text-moon-dust">
          You are signed in anonymously. Your data is tied to this browser and is not
          shared across devices.
        </p>
        <p className="text-xs text-moon-dust/60 font-mono mt-2 break-all">
          {userId ? `User ID: ${userId}` : 'Loading…'}
        </p>
      </GlassCard>
    </div>
  );
}
