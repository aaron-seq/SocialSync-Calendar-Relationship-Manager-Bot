import { useState } from 'react'
import { OrbitView } from '@/components/orbit-view/orbit-view'
import { GlassCard } from '@/components/ui/glass-card'
import { cn, getHealthColor, formatRelativeTime, getAutomationPolicyStyle } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Users,
  ChevronRight,
  Gift,
  Heart
} from 'lucide-react'

// Demo data
const demoContacts = [
  { id: '1', fullName: 'Riya Sharma', nickname: 'Riya', healthScore: 85, intimacyLevel: 9, relationType: 'FRIEND' },
  { id: '2', fullName: 'Michael Chen', nickname: 'Mike', healthScore: 35, intimacyLevel: 6, relationType: 'WORK' },
  { id: '3', fullName: 'Sarah Johnson', healthScore: 72, intimacyLevel: 10, relationType: 'PARTNER' },
  { id: '4', fullName: 'David Williams', healthScore: 45, intimacyLevel: 4, relationType: 'NETWORK' },
  { id: '5', fullName: 'Emma Davis', healthScore: 90, intimacyLevel: 8, relationType: 'FAMILY' },
  { id: '6', fullName: 'James Wilson', healthScore: 28, intimacyLevel: 3, relationType: 'WORK' },
]

const upcomingEvents = [
  { id: '1', contactName: 'Riya Sharma', eventType: 'BIRTHDAY', date: '2026-01-15', daysUntil: 2 },
  { id: '2', contactName: 'Sarah Johnson', eventType: 'ANNIVERSARY', date: '2026-01-18', daysUntil: 5 },
  { id: '3', contactName: 'Emma Davis', eventType: 'BIRTHDAY', date: '2026-01-20', daysUntil: 7 },
]

export function Dashboard() {
  const [selectedContact, setSelectedContact] = useState<typeof demoContacts[0] | null>(null)
  
  // Calculate stats
  const criticalContacts = demoContacts.filter(c => c.healthScore < 40).length
  const pendingMessages = 3 // Demo value
  const averageHealth = Math.round(demoContacts.reduce((sum, c) => sum + c.healthScore, 0) / demoContacts.length)
  
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Contacts"
          value={demoContacts.length}
          trend="+2 this month"
          color="violet"
        />
        <StatCard
          icon={AlertTriangle}
          label="Need Attention"
          value={criticalContacts}
          trend="Action required"
          color="rose"
        />
        <StatCard
          icon={MessageSquare}
          label="Pending Review"
          value={pendingMessages}
          trend="3 drafts ready"
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Health Score"
          value={`${averageHealth}%`}
          trend="+5% from last week"
          color="emerald"
        />
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orbit View - Takes 2 columns */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-starlight">Relationship Orbit</h2>
              <span className="text-sm text-moon-dust">{demoContacts.length} contacts</span>
            </div>
            <OrbitView 
              contacts={demoContacts}
              onContactClick={(contact) => setSelectedContact(contact)}
            />
          </GlassCard>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-starlight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neon-violet" />
                Upcoming
              </h3>
              <a href="/calendar" className="text-sm text-neon-violet hover:underline">View all</a>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30 hover:bg-void-slate/50 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    event.eventType === 'BIRTHDAY' 
                      ? 'bg-solar-amber/20 text-solar-amber'
                      : 'bg-toxic-rose/20 text-toxic-rose'
                  )}>
                    {event.eventType === 'BIRTHDAY' ? <Gift className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-starlight truncate">{event.contactName}</p>
                    <p className="text-xs text-moon-dust">{event.eventType}</p>
                  </div>
                  <span className="text-xs text-neon-violet font-medium">
                    {event.daysUntil}d
                  </span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
          
          {/* Selected Contact Preview */}
          {selectedContact && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-6" glow={selectedContact.healthScore < 40 ? 'rose' : 'violet'}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-neon flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {(selectedContact.nickname || selectedContact.fullName).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-starlight">
                      {selectedContact.fullName}
                    </h3>
                    <p className="text-sm text-moon-dust">{selectedContact.relationType}</p>
                  </div>
                </div>
                
                {/* Health Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-moon-dust">Relationship Health</span>
                    <span className={cn(
                      'font-medium',
                      getHealthColor(selectedContact.healthScore) === 'high' ? 'text-cyber-emerald' :
                      getHealthColor(selectedContact.healthScore) === 'medium' ? 'text-solar-amber' : 'text-toxic-rose'
                    )}>
                      {selectedContact.healthScore}%
                    </span>
                  </div>
                  <div className="health-bar">
                    <div 
                      className={cn('health-bar-fill', getHealthColor(selectedContact.healthScore))}
                      style={{ width: `${selectedContact.healthScore}%` }}
                    />
                  </div>
                </div>
                
                <button className="w-full btn-neon flex items-center justify-center gap-2">
                  View Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: typeof Users
  label: string
  value: string | number
  trend: string
  color: 'violet' | 'rose' | 'amber' | 'emerald'
}

function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const colorClasses = {
    violet: 'text-neon-violet bg-neon-violet/20',
    rose: 'text-toxic-rose bg-toxic-rose/20',
    amber: 'text-solar-amber bg-solar-amber/20',
    emerald: 'text-cyber-emerald bg-cyber-emerald/20',
  }
  
  return (
    <GlassCard variant="hover" className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-moon-dust mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-starlight">{value}</p>
          <p className="text-xs text-moon-dust mt-1">{trend}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </GlassCard>
  )
}
