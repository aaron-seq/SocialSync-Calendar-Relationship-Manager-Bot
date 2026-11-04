import { describe, expect, it } from 'vitest';
import { determineDraftStatus } from './automation-policy';
import type { AutoPolicy, Event } from '@/types';

describe('determineDraftStatus safety defaults', () => {
  it.each([undefined, 'fallback-template'])('reviews check-ins from %s', model => {
    expect(determineDraftStatus('ALWAYS_AUTO_SEND', null, model)).toBe('WAITING_FOR_REVIEW');
  });
  it('permits an explicit always-auto policy for a generated check-in', () => {
    expect(determineDraftStatus('ALWAYS_AUTO_SEND', null, 'test-model')).toBe('APPROVED_WAITING');
  });
  it('reviews unknown or null policies and event risk values', () => {
    expect(determineDraftStatus(null as unknown as AutoPolicy, null, 'test-model')).toBe('WAITING_FOR_REVIEW');
    expect(determineDraftStatus('ALWAYS_AUTO_SEND', { automationOverride: null } as unknown as Event, 'test-model')).toBe('WAITING_FOR_REVIEW');
    expect(determineDraftStatus('AUTO_SEND_LOW_RISK', {
      automationOverride: 'USE_CONTACT_DEFAULT', significanceLevel: null,
    } as unknown as Event, 'test-model')).toBe('WAITING_FOR_REVIEW');
  });
});
