import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Orbit,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useContacts } from '@/bloc/contacts/contacts.bloc'
import { useMessages } from '@/bloc/messages/messages.bloc'
import { NotificationBell } from '@/components/ui/notification-bell'

const navItems = [
  { path: '/', icon: Orbit, label: 'Orbit' },
  { path: '/calendar', icon: Calendar, label: 'Timeline' },
  { path: '/review', icon: MessageSquare, label: 'War Room' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
]

import { AnimatedBackground } from '@/components/ui/animated-background'

export function DashboardLayout() {
  const { contacts } = useContacts()
  const { drafts } = useMessages()

  const criticalContacts = contacts.filter(c => c.healthScore < 40)
  const pendingDrafts = drafts.filter(d => d.status === 'WAITING_FOR_REVIEW')
  const attentionCount = criticalContacts.length + pendingDrafts.length

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-void-black">
      <AnimatedBackground />
      {/* Sidebar */}
      <aside className="relative z-10 glass-sidebar w-20 lg:w-64 p-4 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-neon flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="hidden lg:block text-xl font-display font-bold gradient-text">
            SocialSync
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-neon-violet/20 text-neon-violet shadow-neon-violet' 
                  : 'text-moon-dust hover:text-starlight hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-moon-dust hover:text-starlight hover:bg-white/5 transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky-glass h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div>
            <h1 className="text-lg font-display font-semibold text-starlight">
              Welcome back, Aaron
            </h1>
            <p className="text-sm text-moon-dust">
              {attentionCount === 0
                ? 'Everything looks healthy today'
                : `${attentionCount} ${attentionCount === 1 ? 'item needs' : 'items need'} attention today`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              criticalContacts={criticalContacts}
              pendingDrafts={pendingDrafts}
            />

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-neon flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="page-enter"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
