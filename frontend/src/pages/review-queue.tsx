import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DraftCard } from '@/components/draft-card'
import { GlassCard } from '@/components/ui/glass-card'
import { cn, getHealthColor, formatRelativeTime } from '@/lib/utils'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Sparkles,
  TrendingDown
} from 'lucide-react'

// Demo data
const demoDrafts = [
  {
    id: '1',
    contactName: 'Riya Sharma',
    eventType: 'BIRTHDAY',
    eventName: "Riya's Birthday",
    generatedContent: "Happy Birthday, Riya! 🎂 Hope your special day is filled with all the joy and happiness you bring to everyone around you. Here's to another amazing year of adventures and achievements! 🌟",
    aiRationale: "Selected warm, emoji-rich tone based on high intimacy level (9) and past interaction patterns showing frequent use of emojis.",
    status: 'WAITING_FOR_REVIEW' as const,
    scheduledTime: 'Tomorrow, 9:00 AM',
    healthScore: 85,
  },
  {
    id: '2',
    contactName: 'Michael Chen',
    eventType: 'PROMOTION',
    eventName: 'VP Promotion',
    generatedContent: "Congratulations on your well-deserved promotion to VP, Michael! Your dedication and leadership have truly paid off. Excited to see what you'll accomplish in this new role.",
    aiRationale: "Used professional tone due to WORK relation type. Avoided emojis per user preferences for work contacts.",
    status: 'WAITING_FOR_REVIEW' as const,
    scheduledTime: 'Jan 15, 10:00 AM',
    healthScore: 35,
  },
  {
    id: '3',
    contactName: 'Sarah Johnson',
    eventType: 'ANNIVERSARY',
    generatedContent: "Happy Anniversary to my favorite person! Every day with you is a gift. Can't wait for many more years of love and laughter together. ❤️",
    aiRationale: "Maximum warmth applied for PARTNER relation with intimacy level 10. Personal tone with romantic undertones.",
    status: 'APPROVED_WAITING' as const,
    scheduledTime: 'Jan 18, 8:00 AM',
    healthScore: 72,
  },
]

type FilterType = 'all' | 'review' | 'approved' | 'sent'

export function ReviewQueue() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null)
  
  const filteredDrafts = demoDrafts.filter(draft => {
    if (filter === 'all') return true
    if (filter === 'review') return draft.status === 'WAITING_FOR_REVIEW'
    if (filter === 'approved') return draft.status === 'APPROVED_WAITING'
    return false
  })
  
  const pendingCount = demoDrafts.filter(d => d.status === 'WAITING_FOR_REVIEW').length
  const approvedCount = demoDrafts.filter(d => d.status === 'APPROVED_WAITING').length
  
  const handleApprove = (id: string) => {
    console.log('Approved:', id)
    // Would update state/API here
  }
  
  const handleEdit = (id: string) => {
    console.log('Edit:', id)
  }
  
  const handleReject = (id: string) => {
    console.log('Rejected:', id)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-starlight flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-neon-violet" />
            War Room
          </h1>
          <p className="text-moon-dust mt-1">Review and approve AI-generated messages</p>
        </div>
        
        {/* Stats Pills */}
        <div className="flex gap-2">
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-solar-amber" />
            <span className="text-sm font-medium text-starlight">{pendingCount} Pending</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyber-emerald" />
            <span className="text-sm font-medium text-starlight">{approvedCount} Scheduled</span>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'review', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f
                ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/30'
                : 'text-moon-dust hover:text-starlight hover:bg-white/5'
            )}
          >
            {f === 'all' ? 'All Drafts' : f === 'review' ? 'Needs Review' : 'Scheduled'}
          </button>
        ))}
      </div>
      
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Cards - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                {...draft}
                isSelected={selectedDraft === draft.id}
                onClick={() => setSelectedDraft(draft.id)}
                onApprove={() => handleApprove(draft.id)}
                onEdit={() => handleEdit(draft.id)}
                onReject={() => handleReject(draft.id)}
              />
            ))}
          </AnimatePresence>
          
          {filteredDrafts.length === 0 && (
            <GlassCard className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-cyber-emerald/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-moon-dust">All caught up!</h3>
              <p className="text-sm text-moon-dust/70 mt-1">No messages need your review right now</p>
            </GlassCard>
          )}
        </div>
        
        {/* Sidebar - Context Panel */}
        <div className="space-y-4">
          {/* AI Stats */}
          <GlassCard className="p-5">
            <h3 className="font-medium text-starlight flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-neon-violet" />
              AI Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Approval Rate</span>
                <span className="text-sm font-medium text-cyber-emerald">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Edit Rate</span>
                <span className="text-sm font-medium text-solar-amber">12%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Avg Response Time</span>
                <span className="text-sm font-medium text-starlight">2.3s</span>
              </div>
            </div>
          </GlassCard>
          
          {/* Selected Draft Context */}
          {selectedDraft && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-5">
                <h3 className="font-medium text-starlight mb-4">Contact Context</h3>
                {(() => {
                  const draft = demoDrafts.find(d => d.id === selectedDraft)
                  if (!draft) return null
                  
                  return (
                    <div className="space-y-4">
                      {/* Health Score */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-moon-dust">Relationship Health</span>
                          <span className={cn(
                            'font-medium',
                            getHealthColor(draft.healthScore) === 'high' ? 'text-cyber-emerald' :
                            getHealthColor(draft.healthScore) === 'medium' ? 'text-solar-amber' : 'text-toxic-rose'
                          )}>
                            {draft.healthScore}%
                          </span>
                        </div>
                        <div className="health-bar">
                          <div 
                            className={cn('health-bar-fill', getHealthColor(draft.healthScore))}
                            style={{ width: `${draft.healthScore}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Low Health Warning */}
                      {draft.healthScore < 40 && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-toxic-rose/10 border border-toxic-rose/20">
                          <TrendingDown className="w-4 h-4 text-toxic-rose mt-0.5" />
                          <p className="text-xs text-moon-dust">
                            Relationship health is low. Consider adding a personal touch to this message.
                          </p>
                        </div>
                      )}
                      
                      {/* Recent Interactions */}
                      <div>
                        <h4 className="text-xs font-medium text-moon-dust mb-2">Recent Interactions</h4>
                        <div className="space-y-2 text-xs text-moon-dust/80">
                          <p>• Last message: 2 weeks ago</p>
                          <p>• Last call: 1 month ago</p>
                          <p>• Topics: Work, fitness, travel</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
