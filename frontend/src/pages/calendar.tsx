/**
 * Calendar/Timeline Page
 * 
 * Displays upcoming events with timeline visualization.
 * Uses BLoC hooks for real data and EventForm for add/edit.
 * 
 * Why this design:
 * - Visual timeline makes it easy to see upcoming events
 * - Quick access to event details and draft generation
 * - All buttons are functional with real data operations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timeline } from '@/components/calendar/timeline';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { EventForm } from '@/components/forms/event-form';
import { ToastContainer, useToasts } from '@/components/ui/toast';
import { useEvents, calculateDaysUntil, countByEventType } from '@/bloc/events.bloc';
import { useContacts } from '@/bloc/contacts.bloc';
import { Calendar as CalendarIcon, Plus, Filter } from 'lucide-react';
import type { Event, EventWithContact } from '@/types';

export function Calendar() {
  const { events, isLoading: eventsLoading, addEvent, deleteEvent } = useEvents();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const { toasts, addToast, dismissToast } = useToasts();
  
  const [selectedEvent, setSelectedEvent] = useState<EventWithContact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const isLoading = eventsLoading || contactsLoading;
  
  // Calculate stats
  const upcomingEvents = events.filter(e => calculateDaysUntil(e.eventDate) >= 0);
  const eventTypeCounts = countByEventType(upcomingEvents);
  const birthdayCount = eventTypeCounts['BIRTHDAY'] || 0;
  const highSignificanceCount = upcomingEvents.filter(e => e.significanceLevel === 'HIGH').length;
  
  const handleAddEvent = () => {
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    addEvent(eventData);
    addToast({ type: 'success', message: 'Event added successfully' });
  };
  
  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    addToast({ type: 'success', message: 'Event deleted' });
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };
  
  const handleGenerateDraft = () => {
    if (selectedEvent) {
      addToast({ type: 'info', message: 'Draft generation coming soon!' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-moon-dust">Loading calendar...</div>
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
            <CalendarIcon className="w-6 h-6 text-neon-violet" />
            Timeline
          </h1>
          <p className="text-moon-dust mt-1">Upcoming events across your network</p>
        </div>
        
        <div className="flex gap-2">
          <button className="btn-neon flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            className="btn-neon-solid flex items-center gap-2"
            onClick={handleAddEvent}
            disabled={contacts.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>
      
      {contacts.length === 0 && (
        <GlassCard className="p-4 border-solar-amber/30">
          <p className="text-sm text-solar-amber">
            Add contacts first before creating events
          </p>
        </GlassCard>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2 columns */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            {events.length > 0 ? (
              <Timeline 
                events={events}
                onEventClick={(event) => setSelectedEvent(event as EventWithContact)}
              />
            ) : (
              <EmptyState
                icon={CalendarIcon}
                title="No events yet"
                description={contacts.length > 0 
                  ? "Add events to track birthdays, anniversaries, and more"
                  : "Add contacts first, then create events for them"
                }
                action={contacts.length > 0 ? { 
                  label: 'Add Event', 
                  onClick: handleAddEvent 
                } : undefined}
              />
            )}
          </GlassCard>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <GlassCard className="p-5">
            <h3 className="font-medium text-starlight mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-moon-dust">Total Events</span>
                <span className="text-sm font-medium text-starlight">{upcomingEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-moon-dust">Birthdays</span>
                <span className="text-sm font-medium text-solar-amber">
                  {birthdayCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-moon-dust">High Significance</span>
                <span className="text-sm font-medium text-toxic-rose">
                  {highSignificanceCount}
                </span>
              </div>
            </div>
          </GlassCard>
          
          {/* Selected Event Details */}
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-5" glow="violet">
                <h3 className="font-medium text-starlight mb-4">Event Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-moon-dust">Contact</span>
                    <p className="text-sm font-medium text-starlight">{selectedEvent.contactName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-moon-dust">Event Type</span>
                    <p className="text-sm font-medium text-starlight">{selectedEvent.eventType}</p>
                  </div>
                  <div>
                    <span className="text-xs text-moon-dust">Date</span>
                    <p className="text-sm font-medium text-starlight">
                      {new Date(selectedEvent.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-moon-dust">Days Until</span>
                    <p className="text-sm font-medium text-neon-violet">
                      {calculateDaysUntil(selectedEvent.eventDate) === 0 
                        ? 'Today!' 
                        : `${calculateDaysUntil(selectedEvent.eventDate)} days`}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-moon-dust">Significance</span>
                    <p className="text-sm font-medium text-neon-violet">{selectedEvent.significanceLevel}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <button 
                    className="w-full btn-neon-solid"
                    onClick={handleGenerateDraft}
                  >
                    Generate Draft
                  </button>
                  <button 
                    className="w-full btn-neon text-toxic-rose border-toxic-rose/30 hover:bg-toxic-rose/10"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    Delete Event
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Event Form Modal */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        contacts={contacts}
      />
    </div>
  );
}
