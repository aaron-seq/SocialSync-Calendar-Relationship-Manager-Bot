import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Orbit, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings, 
  Sparkles,
  Bell
} from 'lucide-react'

const navItems = [
  { path: '/', icon: Orbit, label: 'Orbit' },
  { path: '/calendar', icon: Calendar, label: 'Timeline' },
  { path: '/review', icon: MessageSquare, label: 'War Room' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
]

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-void">
      {/* Sidebar */}
      <aside className="glass-sidebar w-20 lg:w-64 p-4 flex flex-col">
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky-glass h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div>
            <h1 className="text-lg font-display font-semibold text-starlight">
              Welcome back, Aaron
            </h1>
            <p className="text-sm text-moon-dust">
              3 relationships need attention today
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5 text-moon-dust" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-toxic-rose" />
            </motion.button>

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
