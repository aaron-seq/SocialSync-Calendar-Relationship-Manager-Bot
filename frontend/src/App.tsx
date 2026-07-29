import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './layouts/dashboard-layout'
import { Dashboard } from './pages/dashboard'
import { ReviewQueue } from './pages/review-queue'
import { Calendar } from './pages/calendar'
import { Contacts } from './pages/contacts'
import { Settings } from './pages/settings'
import { NotFound } from './pages/not-found'
import { GlassCard } from '@/components/ui/glass-card'
import { isSupabaseConfigured, ensureSession } from '@/services/supabase.service'
import { isLLMConfigured } from '@/services/llm.service'
import { useReminders } from '@/hooks/useReminders'
import { Database } from 'lucide-react'

/**
 * Shown instead of the app when Supabase credentials are missing.
 * Every page needs the database, so there is nothing useful to render.
 */
function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="max-w-lg p-8">
        <div className="w-14 h-14 rounded-full bg-solar-amber/20 flex items-center justify-center mb-5">
          <Database className="w-7 h-7 text-solar-amber" />
        </div>

        <h1 className="text-2xl font-display font-bold text-starlight mb-2">
          Connect your database
        </h1>

        <p className="text-moon-dust mb-5">
          SocialSync stores every contact, event, and draft in Supabase. Add your
          project credentials to <code className="text-starlight">frontend/.env</code> and
          restart the dev server.
        </p>

        <pre className="p-4 rounded-lg bg-void-slate/60 text-xs font-mono text-moon-dust overflow-x-auto mb-5">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_GROQ_API_KEY=gsk_...        # optional`}
        </pre>

        <ol className="text-sm text-moon-dust space-y-2 list-decimal list-inside">
          <li>Create a project at supabase.com</li>
          <li>Run <code className="text-starlight">database/schema.sql</code> in the SQL Editor</li>
          <li>Copy the URL and anon key from Settings → API</li>
        </ol>

        <p className="text-xs text-moon-dust/70 mt-5">
          AI drafts: {isLLMConfigured()
            ? 'Groq key detected.'
            : 'no Groq key — drafts will use built-in templates.'}
        </p>
      </GlassCard>
    </div>
  )
}

/** Blocks rendering until an auth session exists, so blocs don't query as anon. */
function useSession() {
  const [status, setStatus] = useState<'pending' | 'ready' | 'failed'>('pending')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    let cancelled = false

    ensureSession().then(result => {
      if (cancelled) return
      if (result.success) {
        setStatus('ready')
      } else {
        setError(result.error.message)
        setStatus('failed')
      }
    })

    return () => { cancelled = true }
  }, [])

  return { status, error }
}

function AppRoutes() {
  useReminders(); // Initialize reminders

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/settings" element={<Settings />} />
        {/* Catch-all: an unmatched path used to render a blank page. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function App() {
  const { status, error } = useSession()

  if (!isSupabaseConfigured()) return <SetupRequired />

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-moon-dust animate-pulse">Connecting…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-lg p-8">
          <h1 className="text-2xl font-display font-bold text-starlight mb-2">
            Could not sign in
          </h1>
          <p className="text-moon-dust mb-4">
            SocialSync signs you in anonymously so the database&rsquo;s row-level
            security policies can identify you. That failed.
          </p>
          <p className="text-sm text-moon-dust mb-4">
            Enable <strong className="text-starlight">Anonymous sign-ins</strong> under
            Authentication &rarr; Sign In / Providers in your Supabase dashboard.
          </p>
          <pre className="p-3 rounded-lg bg-void-slate/60 text-xs font-mono text-toxic-rose overflow-x-auto">
            {error}
          </pre>
        </GlassCard>
      </div>
    )
  }

  return <AppRoutes />
}

export default App
