import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, ClickableGlassCard } from '@/components/ui/glass-card'
import { cn, getHealthColor, getAutomationPolicyStyle } from '@/lib/utils'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Phone,
  Mail,
  Instagram,
  MoreHorizontal,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Demo contacts
const demoContacts = [
  { 
    id: '1', 
    fullName: 'Riya Sharma', 
    nickname: 'Riya', 
    relationType: 'FRIEND',
    intimacyLevel: 9,
    healthScore: 85, 
    phone: '+1 555-0101',
    email: 'riya@example.com',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
  },
  { 
    id: '2', 
    fullName: 'Michael Chen', 
    nickname: 'Mike', 
    relationType: 'WORK',
    intimacyLevel: 6,
    healthScore: 35, 
    phone: '+1 555-0102',
    email: 'mike@company.com',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
  },
  { 
    id: '3', 
    fullName: 'Sarah Johnson', 
    relationType: 'PARTNER',
    intimacyLevel: 10,
    healthScore: 72, 
    phone: '+1 555-0103',
    email: 'sarah@example.com',
    instagram: '@sarah_j',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
  },
  { 
    id: '4', 
    fullName: 'David Williams', 
    relationType: 'NETWORK',
    intimacyLevel: 4,
    healthScore: 45, 
    email: 'david.w@business.com',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
  },
  { 
    id: '5', 
    fullName: 'Emma Davis', 
    nickname: 'Em',
    relationType: 'FAMILY',
    intimacyLevel: 8,
    healthScore: 90, 
    phone: '+1 555-0105',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
  },
  { 
    id: '6', 
    fullName: 'James Wilson', 
    relationType: 'WORK',
    intimacyLevel: 3,
    healthScore: 28, 
    email: 'james.wilson@corp.com',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
  },
]

const relationTypeColors: Record<string, string> = {
  FAMILY: 'bg-toxic-rose/20 text-toxic-rose',
  PARTNER: 'bg-toxic-rose/20 text-toxic-rose',
  FRIEND: 'bg-cyber-emerald/20 text-cyber-emerald',
  WORK: 'bg-solar-amber/20 text-solar-amber',
  NETWORK: 'bg-neon-violet/20 text-neon-violet',
}

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<typeof demoContacts[0] | null>(null)
  
  const filteredContacts = demoContacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-starlight flex items-center gap-3">
            <Users className="w-6 h-6 text-neon-violet" />
            Contacts
          </h1>
          <p className="text-moon-dust mt-1">{demoContacts.length} people in your network</p>
        </div>
        
        <button className="btn-neon-solid flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>
      
      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moon-dust" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors"
          />
        </div>
        <button className="btn-neon flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>
      
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List - 2 columns */}
        <div className="lg:col-span-2 space-y-3">
          {filteredContacts.map((contact, index) => {
            const policyStyle = getAutomationPolicyStyle(contact.defaultAutoPolicy)
            const healthColor = getHealthColor(contact.healthScore)
            
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ClickableGlassCard
                  className={cn(
                    'p-4',
                    selectedContact?.id === contact.id && 'border-neon-violet/50'
                  )}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {(contact.nickname || contact.fullName).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-starlight truncate">
                          {contact.fullName}
                        </h3>
                        {contact.nickname && (
                          <span className="text-sm text-moon-dust">({contact.nickname})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-xs font-medium',
                          relationTypeColors[contact.relationType]
                        )}>
                          {contact.relationType}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-xs font-medium',
                          policyStyle.bg, policyStyle.text
                        )}>
                          {policyStyle.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Health Score */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {contact.healthScore > 50 ? (
                          <TrendingUp className="w-3 h-3 text-cyber-emerald" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-toxic-rose" />
                        )}
                        <span className={cn(
                          'text-sm font-medium',
                          healthColor === 'high' ? 'text-cyber-emerald' :
                          healthColor === 'medium' ? 'text-solar-amber' : 'text-toxic-rose'
                        )}>
                          {contact.healthScore}%
                        </span>
                      </div>
                      <span className="text-xs text-moon-dust">
                        Intimacy: {contact.intimacyLevel}/10
                      </span>
                    </div>
                    
                    {/* More Button */}
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-moon-dust" />
                    </button>
                  </div>
                </ClickableGlassCard>
              </motion.div>
            )
          })}
          
          {filteredContacts.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Users className="w-12 h-12 text-moon-dust/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-moon-dust">No contacts found</h3>
              <p className="text-sm text-moon-dust/70 mt-1">Try a different search term</p>
            </GlassCard>
          )}
        </div>
        
        {/* Sidebar - Contact Details */}
        <div>
          {selectedContact ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedContact.id}
            >
              <GlassCard className="p-6" glow="violet">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-neon flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-bold text-white">
                      {(selectedContact.nickname || selectedContact.fullName).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-starlight">
                    {selectedContact.fullName}
                  </h2>
                  {selectedContact.nickname && (
                    <p className="text-moon-dust">"{selectedContact.nickname}"</p>
                  )}
                </div>
                
                {/* Health Bar */}
                <div className="mb-6">
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
                
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-medium text-moon-dust uppercase tracking-wider">
                    Contact Info
                  </h4>
                  
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Phone className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight">{selectedContact.phone}</span>
                    </div>
                  )}
                  
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Mail className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight truncate">{selectedContact.email}</span>
                    </div>
                  )}
                  
                  {selectedContact.instagram && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Instagram className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight">{selectedContact.instagram}</span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <button className="w-full btn-neon-solid">
                    Send Message
                  </button>
                  <button className="w-full btn-neon">
                    Edit Contact
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <GlassCard className="p-6 text-center">
              <Users className="w-12 h-12 text-moon-dust/30 mx-auto mb-3" />
              <p className="text-moon-dust">Select a contact to view details</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
