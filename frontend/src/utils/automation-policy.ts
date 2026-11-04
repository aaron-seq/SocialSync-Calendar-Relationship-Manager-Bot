import type { AutoPolicy, Event, MessageStatus } from '@/types';

/** Templates and incomplete policy context require human review. */
export function determineDraftStatus(
  policy: AutoPolicy,
  event: Event | null,
  modelUsed?: string,
): Extract<MessageStatus, 'WAITING_FOR_REVIEW' | 'APPROVED_WAITING'> {
  if (!modelUsed || modelUsed === 'fallback-template') return 'WAITING_FOR_REVIEW';
  if (event) {
    if (event.automationOverride === 'FORCE_REVIEW') return 'WAITING_FOR_REVIEW';
    if (event.automationOverride === 'FORCE_AUTO') return 'APPROVED_WAITING';
    if (event.automationOverride !== 'USE_CONTACT_DEFAULT') return 'WAITING_FOR_REVIEW';
  }
  if (policy === 'ALWAYS_AUTO_SEND') return 'APPROVED_WAITING';
  if (policy === 'AUTO_SEND_LOW_RISK' && event &&
    (event.significanceLevel === 'LOW' || event.significanceLevel === 'MEDIUM')) {
    return 'APPROVED_WAITING';
  }
  return 'WAITING_FOR_REVIEW';
}
