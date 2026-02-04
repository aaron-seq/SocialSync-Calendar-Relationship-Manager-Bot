import type { Contact } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculates relationship health score (0-100) based on interaction history.
 * 
 * Logic:
 * - Start with 100
 * - Decay based on days since last interaction
 * - Higher intimacy levels decay faster (require more frequent contact)
 * - Penalties for "ghosting" or missed scheduled events (not implemented yet)
 */
export function calculateHealthScore(contact: Contact): number {
  if (!contact.lastInteractionDate) return 50; // Neutral start
  
  const daysSince = differenceInDays(new Date(), parseISO(contact.lastInteractionDate));
  const intimacy = contact.intimacyLevel || 5;
  
  // Ideal frequency in days based on intimacy (1-10)
  // 10 (Partner) -> 2 days
  // 5 (Friend) -> 14 days
  // 1 (Acquaintance) -> 60 days
  const idealFrequency = Math.max(2, 60 - (intimacy * 5.5)); 
  
  if (daysSince <= idealFrequency) return 100;
  
  const overdueDays = daysSince - idealFrequency;
  const decayRate = 2 + (intimacy / 2); // Higher intimacy = faster decay
  
  const rawScore = 100 - (overdueDays * decayRate);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Calculates risk of ghosting (0.0 - 1.0).
 * High score = high risk that the contact is ghosting the user.
 */
export function calculateGhostingRisk(contact: Contact): number {
  const health = calculateHealthScore(contact);
  
  // Inverse of health, but weighted
  let risk = (100 - health) / 100;
  
  // Boost risk if intimacy is high but health is low (unexpected silence)
  if (contact.intimacyLevel > 7 && health < 40) {
    risk = Math.min(1, risk * 1.5);
  }
  
  return parseFloat(risk.toFixed(2));
}

/**
 * Suggests an automation policy based on intimacy level.
 * High intimacy -> More manual/personal (ALWAYS_REVIEW)
 * Low intimacy -> safe to automate (AUTO_SEND_LOW_RISK)
 */
export function suggestAutoPolicy(intimacy: number): 'ALWAYS_REVIEW' | 'AUTO_SEND_LOW_RISK' | 'ALWAYS_AUTO_SEND' {
  if (intimacy >= 8) return 'ALWAYS_REVIEW'; // Partner/Close Family
  if (intimacy >= 4) return 'AUTO_SEND_LOW_RISK'; // Friends
  return 'ALWAYS_AUTO_SEND'; // Network/Acquaintances
}

/**
 * Returns the recommended contact frequency description.
 */
export function getFrequencyDescription(intimacy: number): string {
  if (intimacy >= 9) return 'Daily or every few days';
  if (intimacy >= 7) return 'Weekly';
  if (intimacy >= 5) return 'Every 2 weeks';
  if (intimacy >= 3) return 'Monthly';
  return 'Quarterly';
}

/**
 * Returns a color class based on health score.
 */
export function getHealthColorClass(score: number): string {
  if (score >= 80) return 'text-cyber-emerald';
  if (score >= 50) return 'text-solar-amber';
  return 'text-toxic-rose';
}
