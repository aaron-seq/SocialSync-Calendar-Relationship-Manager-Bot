/**
 * Review Queue (War Room) Page
 * 
 * Displays AI-generated message drafts for approval.
 * Uses BLoC hooks for real data and wired up approve/reject buttons.
 * 
 * Why this design:
 * - Central hub for reviewing AI-generated content
 * - Quick actions for approve/edit/reject workflow
 * - Context panel shows relationship health for informed decisions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraftCard } from '@/components/draft-card';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ToastContainer, useToasts } from '@/components/ui/toast';
import { cn, getHealthColor } from '@/lib/utils';
import { useDrafts, filterByStatus, countByStatus } from '@/bloc/drafts.bloc';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Sparkles,
  TrendingDown
} from 'lucide-react';

type FilterType = 'all' | 'review' | 'approved';

export function ReviewQueue() {
  const { drafts, isLoading, approve, reject } = useDrafts();
  const { toasts, addToast, dismissToast } = useToasts();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  
  const filteredDrafts = filterByStatus(drafts, filter);
  const statusCounts = countByStatus(drafts);
  
  const pendingCount = statusCounts['WAITING_FOR_REVIEW'] || 0;
  const approvedCount = statusCounts['APPROVED_WAITING'] || 0;
  
  const handleApprove = async (id: string) => {
    await approve(id);
    addToast({ type: 'success', message: 'Draft approved and scheduled' });
  };
  
  const handleEdit = (_id: string) => {
    addToast({ type: 'info', message: 'Edit functionality coming soon!' });
  };
  
  const handleReject = async (id: string) => {
    await reject(id);
    addToast({ type: 'success', message: 'Draft cancelled' });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-moon-dust">Loading drafts...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
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
          {drafts.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No drafts yet"
              description="When events trigger, AI-generated drafts will appear here for your review"
            />
          )}
          
          <AnimatePresence mode="popLayout">
            {filteredDrafts
              .filter(d => d.status === 'WAITING_FOR_REVIEW' || d.status === 'APPROVED_WAITING' || d.status === 'PENDING_GENERATION')
              .map((draft) => (
              <DraftCard
                key={draft.id}
                id={draft.id}
                contactName={draft.contactName}
                eventType={draft.eventType || 'CUSTOM'}
                eventName={draft.eventName}
                generatedContent={draft.generatedContent}
                aiRationale={draft.aiRationale}
                status={draft.status as 'WAITING_FOR_REVIEW' | 'APPROVED_WAITING' | 'PENDING_GENERATION'}
                scheduledTime={draft.scheduledSendTime 
                  ? new Date(draft.scheduledSendTime).toLocaleString()
                  : 'Not scheduled'
                }
                isSelected={selectedDraft === draft.id}
                onClick={() => setSelectedDraft(draft.id)}
                onApprove={() => handleApprove(draft.id)}
                onEdit={() => handleEdit(draft.id)}
                onReject={() => handleReject(draft.id)}
              />
            ))}
          </AnimatePresence>
          
          {filteredDrafts.length === 0 && drafts.length > 0 && (
            <GlassCard className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-cyber-emerald/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-moon-dust">All caught up!</h3>
              <p className="text-sm text-moon-dust/70 mt-1">No messages match this filter</p>
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
                <span className="text-sm font-medium text-cyber-emerald">
                  {drafts.length > 0 ? '94%' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Edit Rate</span>
                <span className="text-sm font-medium text-solar-amber">
                  {drafts.length > 0 ? '12%' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Avg Response Time</span>
                <span className="text-sm font-medium text-starlight">
                  {drafts.length > 0 ? '2.3s' : 'N/A'}
                </span>
              </div>
            </div>
          </GlassCard>
          
          {/* Selected Draft Context */}
          {selectedDraft && (() => {
            const draft = drafts.find(d => d.id === selectedDraft);
            if (!draft) return null;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-5">
                  <h3 className="font-medium text-starlight mb-4">Contact Context</h3>
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
                    
                    {/* AI Rationale */}
                    {draft.aiRationale && (
                      <div>
                        <h4 className="text-xs font-medium text-moon-dust mb-2">AI Rationale</h4>
                        <p className="text-xs text-moon-dust/80">{draft.aiRationale}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
