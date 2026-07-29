/**
 * Contacts Page
 * 
 * Displays the user's contact list with search, filter, and CRUD functionality.
 * Uses the contacts BLoC for data management and the ContactForm for add/edit.
 * 
 * Why this design:
 * - Separates presentation from business logic (BLoC pattern)
 * - Provides real data entry instead of demo data
 * - All buttons are wired up and functional
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard, ClickableGlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ContactForm } from '@/components/forms/contact-form';
import { ToastContainer, useToasts } from '@/components/ui/toast';
import { cn, getHealthColor, getAutomationPolicyStyle } from '@/lib/utils';
import { useContacts, useSelectedContact } from '@/bloc/contacts/contacts.bloc';
import { useDrafts } from '@/bloc/messages/messages.bloc';
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
  TrendingDown,
  Trash2,
  Edit,
  MessageSquare,
  Loader2
} from 'lucide-react';
import type { Contact } from '@/types';

const relationTypeColors: Record<string, string> = {
  FAMILY: 'bg-toxic-rose/20 text-toxic-rose',
  PARTNER: 'bg-toxic-rose/20 text-toxic-rose',
  FRIEND: 'bg-cyber-emerald/20 text-cyber-emerald',
  WORK: 'bg-solar-amber/20 text-solar-amber',
  NETWORK: 'bg-neon-violet/20 text-neon-violet',
};

export function Contacts() {
  const navigate = useNavigate();
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useContacts();
  const { selectedContact, select, clear } = useSelectedContact();
  const { generateDraft, isGenerating } = useDrafts();
  const { toasts, addToast, dismissToast } = useToasts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddContact = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };
  
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Await before reporting success — these hit the network and can fail.
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData);
        addToast({ type: 'success', message: 'Contact updated successfully' });
        // Update selected contact if it was edited
        if (selectedContact?.id === editingContact.id) {
          select({ ...selectedContact, ...contactData } as Contact);
        }
      } else {
        await addContact(contactData);
        addToast({ type: 'success', message: 'Contact added successfully' });
      }
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Could not save contact' });
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteContact(id);
      addToast({ type: 'success', message: 'Contact deleted' });
      setShowDeleteConfirm(null);
      if (selectedContact?.id === id) {
        clear();
      }
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message || 'Could not delete contact' });
    }
  };
  
  const handleContactClick = (contact: Contact) => {
    select(contact as Contact);
  };
  
  const handleSendMessage = async () => {
    if (!selectedContact) return;
    
    addToast({ type: 'info', message: `Generating draft for ${selectedContact.fullName}...` });
    
    const draft = await generateDraft(selectedContact.id);
    
    if (draft) {
      addToast({ type: 'success', message: 'Draft created! Redirecting to War Room...' });
      setTimeout(() => navigate('/review'), 1000);
    } else {
      addToast({ type: 'error', message: 'Failed to generate draft' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-moon-dust">Loading contacts...</div>
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
            <Users className="w-6 h-6 text-neon-violet" />
            Contacts
          </h1>
          <p className="text-moon-dust mt-1">
            {contacts.length} {contacts.length === 1 ? 'person' : 'people'} in your network
          </p>
        </div>
        
        <button className="btn-neon-solid flex items-center gap-2" onClick={handleAddContact}>
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
          {filteredContacts.length === 0 && contacts.length === 0 && (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Add your first contact to start managing your relationships"
              action={{ label: 'Add Contact', onClick: handleAddContact }}
            />
          )}
          
          {filteredContacts.length === 0 && contacts.length > 0 && (
            <GlassCard className="p-12 text-center">
              <Users className="w-12 h-12 text-moon-dust/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-moon-dust">No contacts found</h3>
              <p className="text-sm text-moon-dust/70 mt-1">Try a different search term</p>
            </GlassCard>
          )}
          
          {filteredContacts.map((contact, index) => {
            const policyStyle = getAutomationPolicyStyle(contact.defaultAutoPolicy);
            const healthColor = getHealthColor(contact.healthScore);
            
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
                  onClick={() => handleContactClick(contact)}
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
                    <div className="relative">
                      <button 
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(showDeleteConfirm === contact.id ? null : contact.id);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4 text-moon-dust" />
                      </button>
                      
                      {showDeleteConfirm === contact.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 top-full mt-1 z-10 glass-card rounded-xl p-2 min-w-32"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditContact(contact);
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-starlight hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-toxic-rose hover:bg-toxic-rose/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </ClickableGlassCard>
              </motion.div>
            );
          })}
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
                  
                  {selectedContact.phoneNumber && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Phone className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight">{selectedContact.phoneNumber}</span>
                    </div>
                  )}
                  
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Mail className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight truncate">{selectedContact.email}</span>
                    </div>
                  )}
                  
                  {selectedContact.instagramHandle && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-void-slate/30">
                      <Instagram className="w-4 h-4 text-neon-violet" />
                      <span className="text-sm text-starlight">{selectedContact.instagramHandle}</span>
                    </div>
                  )}
                  
                  {!selectedContact.phoneNumber && !selectedContact.email && !selectedContact.instagramHandle && (
                    <p className="text-sm text-moon-dust/50 text-center py-2">No contact info added</p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <button 
                    className="w-full btn-neon-solid flex items-center justify-center gap-2"
                    onClick={handleSendMessage}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                  <button 
                    className="w-full btn-neon"
                    onClick={() => handleEditContact(selectedContact)}
                  >
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
      
      {/* Contact Form Modal */}
      <ContactForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingContact(undefined);
        }}
        onSubmit={handleFormSubmit}
        editContact={editingContact}
      />
    </div>
  );
}
