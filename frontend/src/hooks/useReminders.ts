import { useEffect } from 'react';
import { useEvents } from '@/bloc/events/events.bloc';
import { calculateDaysUntil } from '@/bloc/events/events.bloc';
import { logger } from '@/lib/logger';

export function useReminders() {
  const { events } = useEvents();

  useEffect(() => {
    if (events.length === 0) return;

    const checkReminders = () => {
      // Check for browser notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      events.forEach(event => {
        const daysUntil = calculateDaysUntil(event.eventDate);
        const reminderDays = event.reminderDaysBefore || [];

        if (reminderDays.includes(daysUntil)) {
          // Trigger notification
          // In a real app, we'd track 'notified' state to avoid spamming
          // For now, valid for the session
          
          if (Notification.permission === 'granted') {
            new Notification(`Upcoming Event: ${event.eventName || event.eventType}`, {
              body: `${daysUntil === 0 ? 'Today' : `In ${daysUntil} days`}: ${event.eventType} for ${event.contactName}`,
              icon: '/icon-192.png'
            });
          }
          
          logger.info('Reminder triggered', { eventId: event.id, daysUntil });
        }
      });
    };

    // Check on mount and every hour
    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [events]);
}
