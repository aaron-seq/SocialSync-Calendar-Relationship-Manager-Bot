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
import { useDrafts, filterByStatus, countByStatus } from '@/bloc/messages/messages.bloc';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Sparkles,
  TrendingDown,
  X,
  Save
} from 'lucide-react';

type FilterType = 'all' | 'review' | 'approved';

interface EditingDraft {
  id: string;
  contactName: string;
  content: string;
}

export function ReviewQueue() {
  const { drafts, isLoading, approveDraft, rejectDraft, updateDraft } = useDrafts();
  const { toasts, addToast, dismissToast } = useToasts();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const getStatusFromFilter = (f: FilterType) => {
    switch (f) {
      case 'review': return 'WAITING_FOR_REVIEW';
      case 'approved': return 'APPROVED_WAITING';
      default: return 'all';
    }
  };

  const filteredDrafts = filterByStatus(drafts, getStatusFromFilter(filter));
  const statusCounts = countByStatus(drafts);
  
  const pendingCount = statusCounts['WAITING_FOR_REVIEW'] || 0;
  const approvedCount = statusCounts['APPROVED_WAITING'] || 0;
  
  const handleApprove = async (id: string) => {
    await approveDraft(id);
    addToast({ type: 'success', message: 'Draft approved and scheduled' });
  };
  
  const handleEdit = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (draft) {
      setEditingDraft({
        id: draft.id,
        contactName: draft.contactName,
        content: draft.editedContent || draft.generatedContent,
      });
      setEditContent(draft.editedContent || draft.generatedContent);
    }
  };
  
  const handleSaveEdit = async () => {
    if (editingDraft && editContent.trim()) {
      await updateDraft(editingDraft.id, editContent.trim());
      addToast({ type: 'success', message: 'Draft updated successfully' });
      setEditingDraft(null);
      setEditContent('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingDraft(null);
    setEditContent('');
  };
  
  const handleReject = async (id: string) => {
    await rejectDraft(id);
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
      
      {/* Edit Modal */}
      <AnimatePresence>
        {editingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-2xl w-full p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-starlight">
                  Edit Draft for {editingDraft.contactName}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-white/10 text-moon-dust hover:text-starlight transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-48 p-4 bg-void-slate/50 border border-white/10 rounded-xl text-starlight resize-none focus:outline-none focus:border-neon-violet/50"
                placeholder="Enter your message..."
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-moon-dust hover:text-starlight hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="flex-1 btn-neon-solid flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                generatedContent={draft.editedContent || draft.generatedContent}
                aiRationale={draft.aiRationale}
                aiModelUsed={draft.aiModelUsed}
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
              Draft Activity
            </h3>
            {/* Counts derived from the loaded queue. Approval/edit rates and
                latency aren't persisted anywhere, so they aren't shown. */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Awaiting review</span>
                <span className="text-sm font-medium text-solar-amber">
                  {drafts.filter(d => d.status === 'WAITING_FOR_REVIEW').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Approved</span>
                <span className="text-sm font-medium text-cyber-emerald">
                  {drafts.filter(d => d.status === 'APPROVED_WAITING').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">Edited by you</span>
                <span className="text-sm font-medium text-starlight">
                  {drafts.filter(d => d.userEdited).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-moon-dust">From templates</span>
                <span className="text-sm font-medium text-starlight">
                  {drafts.filter(d => d.aiModelUsed === 'fallback-template').length}
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
