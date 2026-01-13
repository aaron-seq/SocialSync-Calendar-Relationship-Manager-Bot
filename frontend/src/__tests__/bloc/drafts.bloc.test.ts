/**
 * Unit Tests: Drafts BLoC - Automation Policy
 * 
 * Tests the core "Safety Check" algorithm that determines
 * whether a message requires review or can be auto-sent.
 */

import { describe, it, expect } from 'vitest';
import { determineAutomationStatus } from '@/bloc/drafts.bloc';

// =============================================================================
// TESTS: determineAutomationStatus
// =============================================================================

describe('determineAutomationStatus', () => {
  describe('Level 1: Event Override', () => {
    it('should return WAITING_FOR_REVIEW when event override is FORCE_REVIEW', () => {
      const result = determineAutomationStatus(
        'FORCE_REVIEW',
        'ALWAYS_AUTO_SEND', // Contact says auto-send
        'LOW'               // Low significance
      );
      
      // Event override takes precedence
      expect(result).toBe('WAITING_FOR_REVIEW');
    });

    it('should return APPROVED_WAITING when event override is FORCE_AUTO', () => {
      const result = determineAutomationStatus(
        'FORCE_AUTO',
        'ALWAYS_REVIEW', // Contact says review
        'HIGH'           // High significance
      );
      
      // Event override takes precedence over both contact and significance
      expect(result).toBe('APPROVED_WAITING');
    });
  });

  describe('Level 2: Contact Default Policy', () => {
    it('should return WAITING_FOR_REVIEW when contact policy is ALWAYS_REVIEW', () => {
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'ALWAYS_REVIEW',
        'LOW'
      );
      
      expect(result).toBe('WAITING_FOR_REVIEW');
    });

    it('should return APPROVED_WAITING when contact policy is ALWAYS_AUTO_SEND', () => {
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'ALWAYS_AUTO_SEND',
        'HIGH' // Even high significance is overridden
      );
      
      expect(result).toBe('APPROVED_WAITING');
    });
  });

  describe('Level 3: Significance Level (for AUTO_SEND_LOW_RISK)', () => {
    it('should return WAITING_FOR_REVIEW for HIGH significance events', () => {
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'AUTO_SEND_LOW_RISK',
        'HIGH'
      );
      
      // High significance requires review even with low-risk policy
      expect(result).toBe('WAITING_FOR_REVIEW');
    });

    it('should return APPROVED_WAITING for MEDIUM significance events', () => {
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'AUTO_SEND_LOW_RISK',
        'MEDIUM'
      );
      
      expect(result).toBe('APPROVED_WAITING');
    });

    it('should return APPROVED_WAITING for LOW significance events', () => {
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'AUTO_SEND_LOW_RISK',
        'LOW'
      );
      
      expect(result).toBe('APPROVED_WAITING');
    });
  });

  describe('Real-world Scenarios', () => {
    it('Scenario: Best friend birthday (should auto-send)', () => {
      // Riya: AUTO_SEND_LOW_RISK, Birthday: MEDIUM significance
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'AUTO_SEND_LOW_RISK',
        'MEDIUM'
      );
      
      expect(result).toBe('APPROVED_WAITING');
    });

    it('Scenario: Best friend promotion (should review)', () => {
      // Riya: AUTO_SEND_LOW_RISK, Promotion: HIGH significance
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'AUTO_SEND_LOW_RISK',
        'HIGH'
      );
      
      expect(result).toBe('WAITING_FOR_REVIEW');
    });

    it('Scenario: Boss birthday (should review)', () => {
      // Michael: ALWAYS_REVIEW
      const result = determineAutomationStatus(
        'USE_CONTACT_DEFAULT',
        'ALWAYS_REVIEW',
        'MEDIUM'
      );
      
      expect(result).toBe('WAITING_FOR_REVIEW');
    });

    it('Scenario: Wife anniversary with force review (should review)', () => {
      // Sarah: ALWAYS_AUTO_SEND, but event has FORCE_REVIEW
      const result = determineAutomationStatus(
        'FORCE_REVIEW',
        'ALWAYS_AUTO_SEND',
        'HIGH'
      );
      
      expect(result).toBe('WAITING_FOR_REVIEW');
    });
  });
});
