/**
 * Dashboard Page
 * 
 * Main overview page showing key metrics and relationship orbit.
 * Uses BLoC hooks for real data instead of demo data.
 * 
 * Why this design:
 * - Provides quick overview of relationship health
 * - Highlights urgent items (needing attention, pending reviews)
 * - Visual orbit representation of contact proximity
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrbitView } from '@/components/orbit-view/orbit-view';
import { GlassCard } from '@/components/ui/glass-card';
import { ToastContainer, useToasts } from '@/components/ui/toast';
import { cn, getHealthColor } from '@/lib/utils';
import { useContacts, countCriticalContacts, calculateAverageHealth } from '@/bloc/contacts.bloc';
import { useEvents, calculateDaysUntil } from '@/bloc/events.bloc';
import { useDrafts } from '@/bloc/drafts.bloc';
import { seedDemoData } from '@/services/demo-data.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Users,
  ChevronRight,
  Gift,
  Heart,
  Plus,
  Sparkles,
  Wand2,
  Loader2,
  X
} from 'lucide-react';
import type { Contact } from '@/types';

export function Dashboard() {
  const navigate = useNavigate();
  const { contacts, isLoading: contactsLoading, refetch: refetchContacts } = useContacts();
  const { events, isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { drafts, isGenerating, generateDraft, refetch: refetchDrafts } = useDrafts();
  const { toasts, addToast, dismissToast } = useToasts();
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateContactId, setGenerateContactId] = useState<string>('');
  
  const handleLoadDemoData = () => {
    const result = seedDemoData();
    if (result.contacts > 0) {
      refetchContacts();
      refetchEvents();
      refetchDrafts();
      addToast({ type: 'success', message: `Loaded ${result.contacts} contacts, ${result.events} events, and ${result.drafts} drafts` });
    }
  };
  
  const handleGenerateDraft = async () => {
    if (!generateContactId) {
      addToast({ type: 'warning', message: 'Please select a contact' });
      return;
    }
    
    const draft = await generateDraft(generateContactId);
    
    if (draft) {
      setShowGenerateModal(false);
      setGenerateContactId('');
      addToast({ 
        type: 'success', 
        message: `Draft created for ${draft.contactName}! View in War Room.` 
      });
    } else {
      addToast({ type: 'error', message: 'Failed to generate draft' });
    }
  };
  
  // Calculate stats from real data
  const criticalContacts = countCriticalContacts(contacts);
  const pendingMessages = drafts.filter(d => d.status === 'WAITING_FOR_REVIEW').length;
  const averageHealth = calculateAverageHealth(contacts);
  
  // Get upcoming events (next 30 days)
  const upcomingEvents = events
    .filter(e => calculateDaysUntil(e.eventDate) >= 0 && calculateDaysUntil(e.eventDate) <= 30)
    .slice(0, 5);
  
  const isLoading = contactsLoading || eventsLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-moon-dust">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Generate Draft Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-starlight flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-neon-violet" />
                  Generate Draft
                </h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-moon-dust hover:text-starlight transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-moon-dust mb-4">
                Select a contact to generate a personalized message using AI.
              </p>
              
              <select
                value={generateContactId}
                onChange={(e) => setGenerateContactId(e.target.value)}
                className="w-full p-3 bg-void-slate/50 border border-white/10 rounded-xl text-starlight mb-4 focus:outline-none focus:border-neon-violet/50"
              >
                <option value="" className="bg-void-slate">Select a contact...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id} className="bg-void-slate">
                    {contact.fullName} ({contact.relationType})
                  </option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-moon-dust hover:text-starlight hover:bg-white/5 transition-all"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating || !generateContactId}
                  className="flex-1 btn-neon-solid flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Contacts"
          value={contacts.length}
          trend={contacts.length > 0 ? `${contacts.length} in network` : 'Add contacts to start'}
          color="violet"
          onClick={() => navigate('/contacts')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Need Attention"
          value={criticalContacts}
          trend={criticalContacts > 0 ? 'Action required' : 'All relationships healthy'}
          color="rose"
          onClick={() => navigate('/contacts')}
        />
        <StatCard
          icon={MessageSquare}
          label="Pending Review"
          value={pendingMessages}
          trend={pendingMessages > 0 ? `${pendingMessages} drafts ready` : 'No pending drafts'}
          color="amber"
          onClick={() => navigate('/review')}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Health Score"
          value={contacts.length > 0 ? `${averageHealth}%` : 'N/A'}
          trend={contacts.length > 0 ? 'Across all contacts' : 'Add contacts to track'}
          color="emerald"
        />
      </div>
      
      {/* Quick Actions */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGenerateModal(true)}
            className="btn-neon-solid flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Generate Draft
          </motion.button>
          <button 
            className="btn-neon flex items-center gap-2"
            onClick={handleLoadDemoData}
          >
            <Sparkles className="w-4 h-4" />
            Reload Demo Data
          </button>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orbit View - Takes 2 columns */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-starlight">Relationship Orbit</h2>
              <span className="text-sm text-moon-dust">{contacts.length} contacts</span>
            </div>
            
            {contacts.length > 0 ? (
              <OrbitView 
                contacts={contacts}
                onContactClick={(contact) => setSelectedContact(contact as Contact)}
              />
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-moon-dust/30 mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-starlight mb-2">No contacts yet</h3>
                <p className="text-moon-dust mb-6">Add contacts to see your relationship orbit</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button 
                    className="btn-neon-solid flex items-center gap-2"
                    onClick={() => navigate('/contacts')}
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                  <button 
                    className="btn-neon flex items-center gap-2"
                    onClick={handleLoadDemoData}
                  >
                    <Sparkles className="w-4 h-4" />
                    Load Demo Data
                  </button>
                </div>
              </div>
            )}
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
              <button 
                onClick={() => navigate('/calendar')}
                className="text-sm text-neon-violet hover:underline"
              >
                View all
              </button>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const daysUntil = calculateDaysUntil(event.eventDate);
                  return (
                    <motion.div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30 hover:bg-void-slate/50 transition-colors cursor-pointer"
                      whileHover={{ x: 4 }}
                      onClick={() => navigate('/calendar')}
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
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1d' : `${daysUntil}d`}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-moon-dust/30 mx-auto mb-2" />
                <p className="text-sm text-moon-dust">No upcoming events</p>
                <button 
                  onClick={() => navigate('/calendar')}
                  className="mt-3 text-sm text-neon-violet hover:underline flex items-center gap-1 mx-auto"
                >
                  <Plus className="w-3 h-3" />
                  Add Event
                </button>
              </div>
            )}
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
                
                <button 
                  className="w-full btn-neon flex items-center justify-center gap-2"
                  onClick={() => navigate('/contacts')}
                >
                  View Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  trend: string;
  color: 'violet' | 'rose' | 'amber' | 'emerald';
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, trend, color, onClick }: StatCardProps) {
  const colorClasses = {
    violet: 'text-neon-violet bg-neon-violet/20',
    rose: 'text-toxic-rose bg-toxic-rose/20',
    amber: 'text-solar-amber bg-solar-amber/20',
    emerald: 'text-cyber-emerald bg-cyber-emerald/20',
  };
  
  return (
    <GlassCard 
      variant="hover" 
      className={cn('p-5', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
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
  );
}
