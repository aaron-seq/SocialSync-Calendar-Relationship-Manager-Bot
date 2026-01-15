/**
 * Contact Form Component
 * 
 * Modal form for creating and editing contacts.
 * Handles validation and provides feedback on submission.
 * 
 * Why this exists:
 * - Replaces demo data with real user input
 * - Provides a consistent interface for contact management
 * - Validates input before submission to prevent bad data
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { User, Phone, Mail, Instagram, Heart } from 'lucide-react';
import type { Contact, RelationType, AutoPolicy, Channel } from '@/types';
import { logger } from '@/lib/logger';

interface ContactFormProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback to close the modal */
  onClose: () => void;
  
  /** Callback when form is submitted successfully */
  onSubmit: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  /** Optional contact to edit (creates new if not provided) */
  editContact?: Contact;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

const RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: 'FAMILY', label: 'Family' },
  { value: 'FRIEND', label: 'Friend' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'WORK', label: 'Work' },
  { value: 'NETWORK', label: 'Network' },
];

const AUTO_POLICIES: { value: AutoPolicy; label: string; description: string }[] = [
  { value: 'ALWAYS_REVIEW', label: 'Always Review', description: 'Require approval for all messages' },
  { value: 'AUTO_SEND_LOW_RISK', label: 'Smart Auto-Send', description: 'Auto-send low-risk events only' },
  { value: 'ALWAYS_AUTO_SEND', label: 'Always Auto-Send', description: 'Never require approval' },
];

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'SMS', label: 'SMS' },
];

export function ContactForm({ isOpen, onClose, onSubmit, editContact }: ContactFormProps) {
  const isEditing = Boolean(editContact);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('FRIEND');
  const [intimacyLevel, setIntimacyLevel] = useState(5);
  const [defaultChannel, setDefaultChannel] = useState<Channel>('WHATSAPP');
  const [defaultAutoPolicy, setDefaultAutoPolicy] = useState<AutoPolicy>('ALWAYS_REVIEW');
  const [healthScore, setHealthScore] = useState(50);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editContact changes
  useEffect(() => {
    if (isOpen) {
      if (editContact) {
        setFullName(editContact.fullName);
        setNickname(editContact.nickname || '');
        setPhoneNumber(editContact.phoneNumber || '');
        setEmail(editContact.email || '');
        setInstagramHandle(editContact.instagramHandle || '');
        setRelationType(editContact.relationType);
        setIntimacyLevel(editContact.intimacyLevel);
        setDefaultChannel(editContact.defaultChannel);
        setDefaultAutoPolicy(editContact.defaultAutoPolicy);
        setHealthScore(editContact.healthScore);
        setNotes(editContact.notes || '');
      } else {
        // Reset to defaults for new contact
        setFullName('');
        setNickname('');
        setPhoneNumber('');
        setEmail('');
        setInstagramHandle('');
        setRelationType('FRIEND');
        setIntimacyLevel(5);
        setDefaultChannel('WHATSAPP');
        setDefaultAutoPolicy('ALWAYS_REVIEW');
        setHealthScore(50);
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, editContact]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (phoneNumber && !/^\+?[\d\s-]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      logger.warn('Contact form validation failed', { errors });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'user', // Will be set by the BLoC layer
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        instagramHandle: instagramHandle.trim() || undefined,
        relationType,
        intimacyLevel,
        defaultChannel,
        defaultAutoPolicy,
        healthScore,
        ghostingRiskScore: editContact?.ghostingRiskScore ?? 0,
        notes: notes.trim() || undefined,
      };
      
      logger.info(isEditing ? 'Updating contact' : 'Creating contact', { fullName });
      onSubmit(contactData);
      onClose();
    } catch (error) {
      logger.error('Failed to submit contact form', { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add New Contact'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-moon-dust uppercase tracking-wider">
            Basic Information
          </h3>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm text-moon-dust mb-1">
              Full Name <span className="text-toxic-rose">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moon-dust" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-slate/50',
                  'border text-starlight placeholder:text-moon-dust/50',
                  'focus:outline-none focus:border-neon-violet/50 transition-colors',
                  errors.fullName ? 'border-toxic-rose/50' : 'border-white/10'
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-toxic-rose mt-1">{errors.fullName}</p>
            )}
          </div>
          
          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="block text-sm text-moon-dust mb-1">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Johnny"
              className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors"
            />
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-moon-dust uppercase tracking-wider">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm text-moon-dust mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moon-dust" />
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555-0123"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-slate/50',
                    'border text-starlight placeholder:text-moon-dust/50',
                    'focus:outline-none focus:border-neon-violet/50 transition-colors',
                    errors.phoneNumber ? 'border-toxic-rose/50' : 'border-white/10'
                  )}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-toxic-rose mt-1">{errors.phoneNumber}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-moon-dust mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moon-dust" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-slate/50',
                    'border text-starlight placeholder:text-moon-dust/50',
                    'focus:outline-none focus:border-neon-violet/50 transition-colors',
                    errors.email ? 'border-toxic-rose/50' : 'border-white/10'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-toxic-rose mt-1">{errors.email}</p>
              )}
            </div>
          </div>
          
          {/* Instagram */}
          <div>
            <label htmlFor="instagram" className="block text-sm text-moon-dust mb-1">
              Instagram
            </label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moon-dust" />
              <input
                id="instagram"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@johndoe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors"
              />
            </div>
          </div>
        </div>
        
        {/* Relationship Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-moon-dust uppercase tracking-wider">
            Relationship Settings
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Relation Type */}
            <div>
              <label htmlFor="relationType" className="block text-sm text-moon-dust mb-1">
                Relationship Type
              </label>
              <select
                id="relationType"
                value={relationType}
                onChange={(e) => setRelationType(e.target.value as RelationType)}
                className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors"
              >
                {RELATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Default Channel */}
            <div>
              <label htmlFor="channel" className="block text-sm text-moon-dust mb-1">
                Preferred Channel
              </label>
              <select
                id="channel"
                value={defaultChannel}
                onChange={(e) => setDefaultChannel(e.target.value as Channel)}
                className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Intimacy Level */}
          <div>
            <label htmlFor="intimacy" className="block text-sm text-moon-dust mb-1">
              Intimacy Level: <span className="text-neon-violet">{intimacyLevel}</span>
            </label>
            <input
              id="intimacy"
              type="range"
              min="1"
              max="10"
              value={intimacyLevel}
              onChange={(e) => setIntimacyLevel(Number(e.target.value))}
              className="w-full accent-neon-violet"
            />
            <div className="flex justify-between text-xs text-moon-dust/50">
              <span>Acquaintance</span>
              <span>Soulmate</span>
            </div>
          </div>
          
          {/* Health Score */}
          <div>
            <label htmlFor="healthScore" className="block text-sm text-moon-dust mb-1">
              <Heart className="inline w-4 h-4 mr-1" />
              Relationship Health: <span className={cn(
                healthScore >= 70 ? 'text-cyber-emerald' :
                healthScore >= 40 ? 'text-solar-amber' : 'text-toxic-rose'
              )}>{healthScore}%</span>
            </label>
            <input
              id="healthScore"
              type="range"
              min="0"
              max="100"
              value={healthScore}
              onChange={(e) => setHealthScore(Number(e.target.value))}
              className={cn(
                'w-full',
                healthScore >= 70 ? 'accent-cyber-emerald' :
                healthScore >= 40 ? 'accent-solar-amber' : 'accent-toxic-rose'
              )}
            />
            <div className="flex justify-between text-xs text-moon-dust/50">
              <span>Critical</span>
              <span>Needs Attention</span>
              <span>Healthy</span>
            </div>
          </div>
        </div>
        
        {/* Automation Policy */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-moon-dust uppercase tracking-wider">
            Automation Policy
          </h3>
          
          <div className="space-y-2">
            {AUTO_POLICIES.map((policy) => (
              <label
                key={policy.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  defaultAutoPolicy === policy.value
                    ? 'border-neon-violet/50 bg-neon-violet/10'
                    : 'border-white/10 hover:border-white/20'
                )}
              >
                <input
                  type="radio"
                  name="autoPolicy"
                  value={policy.value}
                  checked={defaultAutoPolicy === policy.value}
                  onChange={(e) => setDefaultAutoPolicy(e.target.value as AutoPolicy)}
                  className="sr-only"
                />
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5',
                  defaultAutoPolicy === policy.value
                    ? 'border-neon-violet bg-neon-violet'
                    : 'border-moon-dust'
                )}>
                  {defaultAutoPolicy === policy.value && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-starlight">{policy.label}</p>
                  <p className="text-xs text-moon-dust">{policy.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm text-moon-dust mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this contact..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors resize-none"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-neon"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-neon-solid"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
