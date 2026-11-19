import { renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useReminders } from './useReminders';

vi.mock('@/bloc/events/events.bloc', () => ({
  useEvents: () => ({
    events: [{
      id: 'event-1',
      eventDate: '2026-11-19',
      eventName: 'Birthday',
      eventType: 'BIRTHDAY',
      contactName: 'Example Contact',
      reminderDaysBefore: [0],
    }],
  }),
  calculateDaysUntil: () => 0,
}));

afterEach(() => vi.unstubAllGlobals());

it('keeps the app usable with loaded events on browsers without notifications', () => {
  vi.stubGlobal('Notification', undefined);
  expect(() => renderHook(() => useReminders())).not.toThrow();
});

it('does not request permission during a background reminder check', () => {
  const requestPermission = vi.fn();
  vi.stubGlobal('Notification', { permission: 'default', requestPermission });
  renderHook(() => useReminders());
  expect(requestPermission).not.toHaveBeenCalled();
});

it('shows an eligible reminder when permission is already granted', () => {
  const notify = vi.fn();
  class BrowserNotification {
    static permission = 'granted';
    constructor(title: string, options: NotificationOptions) {
      notify(title, options);
    }
  }
  vi.stubGlobal('Notification', BrowserNotification);
  renderHook(() => useReminders());
  expect(notify).toHaveBeenCalledWith('Upcoming Event: Birthday',
    expect.objectContaining({ body: 'Today: BIRTHDAY for Example Contact' }));
});

it('keeps the app usable when the browser rejects the notification constructor', () => {
  class UnsupportedNotification {
    static permission = 'granted';
    constructor() {
      throw new TypeError('Nonpersistent notifications unavailable');
    }
  }
  vi.stubGlobal('Notification', UnsupportedNotification);
  expect(() => renderHook(() => useReminders())).not.toThrow();
});
