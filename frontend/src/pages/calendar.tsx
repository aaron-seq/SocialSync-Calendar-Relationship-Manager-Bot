import { useState } from 'react'
import { motion } from 'framer-motion'
import { Timeline } from '@/components/calendar/timeline'
import { GlassCard } from '@/components/ui/glass-card'
import { Calendar as CalendarIcon, Plus, Filter } from 'lucide-react'

// Demo events
const demoEvents = [
  { id: '1', contactId: '1', contactName: 'Riya Sharma', eventType: 'BIRTHDAY', eventDate: '2026-01-15', significanceLevel: 'MEDIUM' as const },
  { id: '2', contactId: '3', contactName: 'Sarah Johnson', eventType: 'ANNIVERSARY', eventDate: '2026-01-18', significanceLevel: 'HIGH' as const },
  { id: '3', contactId: '5', contactName: 'Emma Davis', eventType: 'BIRTHDAY', eventDate: '2026-01-20', significanceLevel: 'MEDIUM' as const },
  { id: '4', contactId: '2', contactName: 'Michael Chen', eventType: 'PROMOTION', eventName: 'VP Promotion', eventDate: '2026-01-22', significanceLevel: 'HIGH' as const },
  { id: '5', contactId: '4', contactName: 'David Williams', eventType: 'BIRTHDAY', eventDate: '2026-02-05', significanceLevel: 'LOW' as const },
  { id: '6', contactId: '6', contactName: 'James Wilson', eventType: 'NEW_JOB', eventDate: '2026-02-10', significanceLevel: 'MEDIUM' as const },
]

export function Calendar() {
  const [selectedEvent, setSelectedEvent] = useState<typeof demoEvents[0] | null>(null)
  
  return (
    <div className="space-y-6">
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
          <button className="btn-neon-solid flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2 columns */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <Timeline 
              events={demoEvents}
              onEventClick={(event) => setSelectedEvent(event)}
            />
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
                <span className="text-sm font-medium text-starlight">{demoEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-moon-dust">Birthdays</span>
                <span className="text-sm font-medium text-solar-amber">
                  {demoEvents.filter(e => e.eventType === 'BIRTHDAY').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-moon-dust">High Significance</span>
                <span className="text-sm font-medium text-toxic-rose">
                  {demoEvents.filter(e => e.significanceLevel === 'HIGH').length}
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
                    <p className="text-sm font-medium text-starlight">{selectedEvent.eventDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-moon-dust">Significance</span>
                    <p className="text-sm font-medium text-neon-violet">{selectedEvent.significanceLevel}</p>
                  </div>
                </div>
                
                <button className="w-full btn-neon mt-4">
                  Generate Draft
                </button>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
