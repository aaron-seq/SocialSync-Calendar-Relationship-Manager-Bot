/**
 * Event Form Component
 * 
 * Modal form for creating and editing events.
 * Handles event types, dates, recurrence, and automation settings.
 * 
 * Why this exists:
 * - Replaces demo events with real user input
 * - Provides a consistent interface for event management
 * - Validates input before submission
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { Calendar, Gift, Heart, Briefcase, GraduationCap, Baby, Home } from 'lucide-react';
import type { 
  Event, 
  EventType, 
  SignificanceLevel, 
  AutomationOverride,
  Contact 
} from '@/types';
import { logger } from '@/lib/logger';

interface EventFormProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback to close the modal */
  onClose: () => void;
  
  /** Callback when form is submitted successfully */
  onSubmit: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  /** Available contacts for selection */
  contacts: Contact[];
  
  /** Optional pre-selected contact ID */
  defaultContactId?: string;
  
  /** Optional event to edit (creates new if not provided) */
  editEvent?: Event;
}

const EVENT_TYPES: { value: EventType; label: string; icon: typeof Gift }[] = [
  { value: 'BIRTHDAY', label: 'Birthday', icon: Gift },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: Heart },
  { value: 'PROMOTION', label: 'Promotion', icon: Briefcase },
  { value: 'WEDDING', label: 'Wedding', icon: Heart },
  { value: 'GRADUATION', label: 'Graduation', icon: GraduationCap },
  { value: 'NEW_JOB', label: 'New Job', icon: Briefcase },
  { value: 'NEW_BABY', label: 'New Baby', icon: Baby },
  { value: 'HOUSE_WARMING', label: 'House Warming', icon: Home },
  { value: 'NAME_DAY', label: 'Name Day', icon: Gift },
  { value: 'CUSTOM', label: 'Custom', icon: Calendar },
];

const RECURRENCE_OPTIONS: { value: Event['recurrenceRule']; label: string }[] = [
  { value: 'YEARLY', label: 'Every Year' },
  { value: 'MONTHLY', label: 'Every Month' },
  { value: 'WEEKLY', label: 'Every Week' },
  { value: 'ONCE', label: 'One Time Only' },
];

const SIGNIFICANCE_LEVELS: { value: SignificanceLevel; label: string; description: string }[] = [
  { value: 'LOW', label: 'Low', description: 'Safe for automation' },
  { value: 'MEDIUM', label: 'Medium', description: 'Context-dependent' },
  { value: 'HIGH', label: 'High', description: 'Always requires care' },
];

const AUTOMATION_OVERRIDES: { value: AutomationOverride; label: string; description: string }[] = [
  { value: 'USE_CONTACT_DEFAULT', label: 'Use Contact Default', description: 'Follow the contact automation policy' },
  { value: 'FORCE_REVIEW', label: 'Force Review', description: 'Always require approval for this event' },
  { value: 'FORCE_AUTO', label: 'Force Auto-Send', description: 'Always auto-send for this event' },
];

export function EventForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  contacts,
  defaultContactId,
  editEvent 
}: EventFormProps) {
  const isEditing = Boolean(editEvent);
  
  // Form state
  const [contactId, setContactId] = useState('');
  const [eventType, setEventType] = useState<EventType>('BIRTHDAY');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [originalYear, setOriginalYear] = useState<number | ''>('');
  const [recurrenceRule, setRecurrenceRule] = useState<Event['recurrenceRule']>('YEARLY');
  const [significanceLevel, setSignificanceLevel] = useState<SignificanceLevel>('MEDIUM');
  const [automationOverride, setAutomationOverride] = useState<AutomationOverride>('USE_CONTACT_DEFAULT');
  const [reminderDays, setReminderDays] = useState<number[]>([1, 7]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ contactId?: string; eventDate?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editEvent changes
  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setContactId(editEvent.contactId);
        setEventType(editEvent.eventType);
        setEventName(editEvent.eventName || '');
        setEventDate(editEvent.eventDate);
        setOriginalYear(editEvent.originalYear || '');
        setRecurrenceRule(editEvent.recurrenceRule);
        setSignificanceLevel(editEvent.significanceLevel);
        setAutomationOverride(editEvent.automationOverride);
        setReminderDays(editEvent.reminderDaysBefore);
        setNotes(editEvent.notes || '');
      } else {
        setContactId(defaultContactId || '');
        setEventType('BIRTHDAY');
        setEventName('');
        setEventDate('');
        setOriginalYear('');
        setRecurrenceRule('YEARLY');
        setSignificanceLevel('MEDIUM');
        setAutomationOverride('USE_CONTACT_DEFAULT');
        setReminderDays([1, 7]);
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, editEvent, defaultContactId]);

  const validate = (): boolean => {
    const newErrors: { contactId?: string; eventDate?: string } = {};
    
    if (!contactId) {
      newErrors.contactId = 'Please select a contact';
    }
    
    if (!eventDate) {
      newErrors.eventDate = 'Event date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReminderToggle = (days: number) => {
    setReminderDays(prev => 
      prev.includes(days)
        ? prev.filter(d => d !== days)
        : [...prev, days].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      logger.warn('Event form validation failed', { errors });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        contactId,
        eventType,
        eventName: eventType === 'CUSTOM' ? eventName.trim() : undefined,
        eventDate,
        originalYear: originalYear || undefined,
        recurrenceRule,
        significanceLevel,
        automationOverride,
        reminderDaysBefore: reminderDays,
        notes: notes.trim() || undefined,
      };
      
      logger.info(isEditing ? 'Updating event' : 'Creating event', { eventType, contactId });
      onSubmit(eventData);
      onClose();
    } catch (error) {
      logger.error('Failed to submit event form', { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Event' : 'Add New Event'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Selection */}
        <div>
          <label htmlFor="contact" className="block text-sm text-moon-dust mb-1">
            Contact <span className="text-toxic-rose">*</span>
          </label>
          <select
            id="contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl bg-void-slate/50',
              'border text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors',
              errors.contactId ? 'border-toxic-rose/50' : 'border-white/10'
            )}
          >
            <option value="">Select a contact...</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName} {contact.nickname ? `(${contact.nickname})` : ''}
              </option>
            ))}
          </select>
          {errors.contactId && (
            <p className="text-xs text-toxic-rose mt-1">{errors.contactId}</p>
          )}
          {contacts.length === 0 && (
            <p className="text-xs text-solar-amber mt-1">Add contacts first to create events</p>
          )}
        </div>
        
        {/* Event Type */}
        <div>
          <label className="block text-sm text-moon-dust mb-2">
            Event Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_TYPES.slice(0, 6).map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors',
                    eventType === type.value
                      ? 'border-neon-violet/50 bg-neon-violet/10 text-neon-violet'
                      : 'border-white/10 text-moon-dust hover:border-white/20'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="mt-2 w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Custom Event Name (only for CUSTOM type) */}
        {eventType === 'CUSTOM' && (
          <div>
            <label htmlFor="eventName" className="block text-sm text-moon-dust mb-1">
              Event Name
            </label>
            <input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter custom event name..."
              className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors"
            />
          </div>
        )}
        
        {/* Date Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventDate" className="block text-sm text-moon-dust mb-1">
              Event Date <span className="text-toxic-rose">*</span>
            </label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl bg-void-slate/50',
                'border text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors',
                errors.eventDate ? 'border-toxic-rose/50' : 'border-white/10'
              )}
            />
            {errors.eventDate && (
              <p className="text-xs text-toxic-rose mt-1">{errors.eventDate}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="originalYear" className="block text-sm text-moon-dust mb-1">
              Original Year
            </label>
            <input
              id="originalYear"
              type="number"
              value={originalYear}
              onChange={(e) => setOriginalYear(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 1990"
              min="1900"
              max="2100"
              className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight placeholder:text-moon-dust/50 focus:outline-none focus:border-neon-violet/50 transition-colors"
            />
            <p className="text-xs text-moon-dust/50 mt-1">For calculating age/years</p>
          </div>
        </div>
        
        {/* Recurrence */}
        <div>
          <label htmlFor="recurrence" className="block text-sm text-moon-dust mb-1">
            Recurrence
          </label>
          <select
            id="recurrence"
            value={recurrenceRule}
            onChange={(e) => setRecurrenceRule(e.target.value as Event['recurrenceRule'])}
            className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors"
          >
            {RECURRENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Significance Level */}
        <div>
          <label className="block text-sm text-moon-dust mb-2">
            Significance Level
          </label>
          <div className="flex gap-2">
            {SIGNIFICANCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSignificanceLevel(level.value)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-xl border text-sm transition-colors',
                  significanceLevel === level.value
                    ? level.value === 'LOW' ? 'border-cyber-emerald/50 bg-cyber-emerald/10 text-cyber-emerald'
                    : level.value === 'MEDIUM' ? 'border-solar-amber/50 bg-solar-amber/10 text-solar-amber'
                    : 'border-toxic-rose/50 bg-toxic-rose/10 text-toxic-rose'
                    : 'border-white/10 text-moon-dust hover:border-white/20'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Automation Override */}
        <div>
          <label className="block text-sm text-moon-dust mb-2">
            Automation Override
          </label>
          <select
            value={automationOverride}
            onChange={(e) => setAutomationOverride(e.target.value as AutomationOverride)}
            className="w-full px-4 py-2.5 rounded-xl bg-void-slate/50 border border-white/10 text-starlight focus:outline-none focus:border-neon-violet/50 transition-colors"
          >
            {AUTOMATION_OVERRIDES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
        
        {/* Reminder Days */}
        <div>
          <label className="block text-sm text-moon-dust mb-2">
            Remind Me
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleReminderToggle(days)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                  reminderDays.includes(days)
                    ? 'border-neon-violet/50 bg-neon-violet/10 text-neon-violet'
                    : 'border-white/10 text-moon-dust hover:border-white/20'
                )}
              >
                {days === 1 ? '1 day' : `${days} days`}
              </button>
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
            placeholder="Any additional notes..."
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
            disabled={isSubmitting || contacts.length === 0}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
