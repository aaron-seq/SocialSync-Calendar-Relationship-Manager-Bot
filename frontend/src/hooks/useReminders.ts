import { useEffect } from 'react';
import { calculateDaysUntil, useEvents } from '@/bloc/events/events.bloc';
import { logger } from '@/lib/logger';

export function useReminders() {
  const { events } = useEvents();

  useEffect(() => {
    if (events.length === 0 || typeof Notification === 'undefined') return;

    const checkReminders = () => {
      if (Notification.permission !== 'granted') return;

      events.forEach(event => {
        const daysUntil = calculateDaysUntil(event.eventDate);
        const reminderDays = event.reminderDaysBefore || [];

        if (!reminderDays.includes(daysUntil)) return;

        try {
          new Notification(`Upcoming Event: ${event.eventName || event.eventType}`, {
            body: `${daysUntil === 0 ? 'Today' : `In ${daysUntil} days`}: ${event.eventType} for ${event.contactName}`,
            icon: '/icon-192.png'
          });
        } catch {
          // Some browsers grant permission but only support persistent notifications.
          logger.warn('Browser could not show a reminder');
          return;
        }
        logger.info('Reminder triggered', { eventId: event.id, daysUntil });
      });
    };

    // Check on mount and every hour
    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [events]);
}
