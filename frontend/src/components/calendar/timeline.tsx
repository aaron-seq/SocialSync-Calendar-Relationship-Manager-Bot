import { motion } from 'framer-motion'
import { format, isToday, isTomorrow } from 'date-fns'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'
import { Gift, Heart, Briefcase, GraduationCap, Home, Baby, Star, Calendar as CalendarIcon } from 'lucide-react'

interface Event {
  id: string
  contactId: string
  contactName: string
  eventType: string
  eventName?: string
  eventDate: string
  significanceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface TimelineProps {
  events: Event[]
  onEventClick?: (event: Event) => void
}

const eventIcons: Record<string, typeof Gift> = {
  BIRTHDAY: Gift,
  ANNIVERSARY: Heart,
  PROMOTION: Briefcase,
  GRADUATION: GraduationCap,
  HOUSE_WARMING: Home,
  NEW_BABY: Baby,
  CUSTOM: Star,
}

const significanceColors = {
  HIGH: 'bg-toxic-rose/20 border-toxic-rose/30 text-toxic-rose',
  MEDIUM: 'bg-solar-amber/20 border-solar-amber/30 text-solar-amber',
  LOW: 'bg-cyber-emerald/20 border-cyber-emerald/30 text-cyber-emerald',
}

export function Timeline({ events, onEventClick }: TimelineProps) {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.eventDate
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, Event[]>)
  
  // Get sorted dates
  const sortedDates = Object.keys(eventsByDate).sort()
  
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-violet/50 via-neon-violet/20 to-transparent" />
      
      <div className="space-y-8">
        {sortedDates.map((date, dateIndex) => {
          const dateObj = new Date(date)
          const isDateToday = isToday(dateObj)
          const isDateTomorrow = isTomorrow(dateObj)
          
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dateIndex * 0.1 }}
              className="relative"
            >
              {/* Date Marker */}
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'relative z-10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center',
                  isDateToday 
                    ? 'bg-gradient-neon text-white shadow-neon-violet' 
                    : 'glass-card text-starlight'
                )}>
                  <span className="text-xs font-medium uppercase">
                    {format(dateObj, 'MMM')}
                  </span>
                  <span className="text-xl font-bold">
                    {format(dateObj, 'd')}
                  </span>
                </div>
                
                <div>
                  <h3 className={cn(
                    'text-lg font-display font-semibold',
                    isDateToday ? 'text-neon-violet' : 'text-starlight'
                  )}>
                    {isDateToday ? 'Today' : isDateTomorrow ? 'Tomorrow' : format(dateObj, 'EEEE')}
                  </h3>
                  <p className="text-sm text-moon-dust">
                    {eventsByDate[date].length} event{eventsByDate[date].length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Events for this date */}
              <div className="ml-20 space-y-3">
                {eventsByDate[date].map((event, eventIndex) => {
                  const Icon = eventIcons[event.eventType] || CalendarIcon
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: dateIndex * 0.1 + eventIndex * 0.05 }}
                    >
                      <GlassCard
                        variant="hover"
                        className="p-4 cursor-pointer"
                        onClick={() => onEventClick?.(event)}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Event Icon */}
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            significanceColors[event.significanceLevel]
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-starlight truncate">
                              {event.contactName}
                            </h4>
                            <p className="text-sm text-moon-dust truncate">
                              {event.eventName || event.eventType}
                            </p>
                          </div>
                          
                          {/* Significance Badge */}
                          <span className={cn(
                            'px-2 py-1 rounded-lg text-xs font-medium border',
                            significanceColors[event.significanceLevel]
                          )}>
                            {event.significanceLevel}
                          </span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
        
        {/* Empty State */}
        {sortedDates.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-moon-dust/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-moon-dust">No upcoming events</h3>
            <p className="text-sm text-moon-dust/70">Add events to your contacts to see them here</p>
          </div>
        )}
      </div>
    </div>
  )
}
