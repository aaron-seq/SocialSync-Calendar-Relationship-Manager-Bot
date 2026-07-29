import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { cn, getAutomationPolicyStyle } from '@/lib/utils'
import { Check, Edit3, X, Image } from 'lucide-react'
import { AiRationaleCard } from '@/components/ui/ai-rationale-card'

interface DraftCardProps {
  id: string
  contactName: string
  contactAvatar?: string
  eventType: string
  eventName?: string
  generatedContent: string
  generatedGifUrl?: string
  aiRationale?: string
  /** message_queue.ai_model_used — distinguishes real generations from templates. */
  aiModelUsed?: string
  status: 'WAITING_FOR_REVIEW' | 'APPROVED_WAITING' | 'PENDING_GENERATION'
  scheduledTime?: string
  isSelected?: boolean
  onApprove?: () => void
  onEdit?: () => void
  onReject?: () => void
  onClick?: () => void
}

export function DraftCard({
  contactName,
  contactAvatar,
  eventType,
  eventName,
  generatedContent,
  generatedGifUrl,
  aiRationale,
  aiModelUsed,
  status,
  scheduledTime,
  isSelected,
  onApprove,
  onEdit,
  onReject,
  onClick,
}: DraftCardProps) {
  const policyStyle = getAutomationPolicyStyle(
    status === 'APPROVED_WAITING' ? 'ALWAYS_AUTO_SEND' : 'ALWAYS_REVIEW'
  )
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <GlassCard
        variant={isSelected ? 'selected' : 'hover'}
        glow={isSelected ? 'violet' : 'none'}
        className={cn('draft-card', isSelected && 'selected')}
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center overflow-hidden">
              {contactAvatar ? (
                <img src={contactAvatar} alt={contactName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {contactName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-display font-semibold text-starlight">{contactName}</h3>
              <p className="text-sm text-moon-dust">
                {eventName || eventType} • {scheduledTime}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            policyStyle.bg, policyStyle.text
          )}>
            {status === 'WAITING_FOR_REVIEW' ? 'Review' : 
             status === 'APPROVED_WAITING' ? 'Scheduled' : 'Generating...'}
          </span>
        </div>
        
        {/* Content Preview */}
        <div className="space-y-3 mb-4">
          <div className="p-4 rounded-xl bg-void-slate/50 border border-white/5">
            <p className="text-starlight leading-relaxed">{generatedContent}</p>
          </div>
          
          {/* GIF Preview */}
          {generatedGifUrl && (
            <div className="relative rounded-xl overflow-hidden">
              <img 
                src={generatedGifUrl} 
                alt="Suggested GIF" 
                className="w-full h-32 object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-slate/80 to-transparent" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-moon-dust">
                <Image className="w-3 h-3" />
                <span>AI Selected GIF</span>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Rationale */}
        {aiRationale && (
          <AiRationaleCard
            rationale={aiRationale}
            modelUsed={aiModelUsed}
            className="mb-4"
          />
        )}
        
        {/* Actions */}
        {status === 'WAITING_FOR_REVIEW' && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); onApprove?.() }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyber-emerald/20 text-cyber-emerald font-medium transition-all hover:bg-cyber-emerald/30"
            >
              <Check className="w-4 h-4" />
              Approve
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); onEdit?.() }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-solar-amber/20 text-solar-amber font-medium transition-all hover:bg-solar-amber/30"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); onReject?.() }}
              className="px-4 py-2.5 rounded-xl bg-toxic-rose/20 text-toxic-rose transition-all hover:bg-toxic-rose/30"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
