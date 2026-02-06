/**
 * Unit Tests: Contacts BLoC
 * 
 * Tests business logic functions in isolation from React components.
 * Following the principle: test happy path first, then edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateContactMetrics,
  countCriticalContacts,
  calculateAverageHealth,
  filterContactsByQuery,
  sortContacts,
} from '@/bloc/contacts/contacts.bloc';
import type { Contact } from '@/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockContact: Contact = {
  id: '1',
  userId: 'user-1',
  fullName: 'John Doe',
  nickname: 'Johnny',
  relationType: 'FRIEND',
  intimacyLevel: 7,
  healthScore: 75,
  defaultChannel: 'WHATSAPP',
  defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
  ghostingRiskScore: 0.2,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockContacts: Contact[] = [
  { ...mockContact, id: '1', fullName: 'Alice', healthScore: 85 },
  { ...mockContact, id: '2', fullName: 'Bob', healthScore: 30 },
  { ...mockContact, id: '3', fullName: 'Charlie', healthScore: 55 },
  { ...mockContact, id: '4', fullName: 'Diana', healthScore: 35 },
];

// =============================================================================
// TESTS: calculateContactMetrics
// =============================================================================

describe('calculateContactMetrics', () => {
  it('should add computed fields to contact', () => {
    const result = calculateContactMetrics(mockContact);
    
    expect(result).toHaveProperty('upcomingEventsCount');
    expect(result).toHaveProperty('pendingMessagesCount');
    expect(result.upcomingEventsCount).toBe(0);
    expect(result.pendingMessagesCount).toBe(0);
  });

  it('should calculate days since last interaction when date exists', () => {
    const contactWithDate: Contact = {
      ...mockContact,
      lastInteractionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    };
    
    const result = calculateContactMetrics(contactWithDate);
    
    expect(result.daysSinceLastInteraction).toBe(5);
  });

  it('should return undefined for days since last interaction when no date', () => {
    const result = calculateContactMetrics(mockContact);
    
    expect(result.daysSinceLastInteraction).toBeUndefined();
  });
});

// =============================================================================
// TESTS: countCriticalContacts
// =============================================================================

describe('countCriticalContacts', () => {
  it('should count contacts with healthScore < 40', () => {
    const result = countCriticalContacts(mockContacts);
    
    // Bob (30) and Diana (35) are critical
    expect(result).toBe(2);
  });

  it('should return 0 for empty array', () => {
    const result = countCriticalContacts([]);
    
    expect(result).toBe(0);
  });

  it('should return 0 when all contacts are healthy', () => {
    const healthyContacts = mockContacts.map(c => ({ ...c, healthScore: 80 }));
    const result = countCriticalContacts(healthyContacts);
    
    expect(result).toBe(0);
  });
});

// =============================================================================
// TESTS: calculateAverageHealth
// =============================================================================

describe('calculateAverageHealth', () => {
  it('should calculate average health score', () => {
    const result = calculateAverageHealth(mockContacts);
    
    // (85 + 30 + 55 + 35) / 4 = 51.25, rounded to 51
    expect(result).toBe(51);
  });

  it('should return 0 for empty array', () => {
    const result = calculateAverageHealth([]);
    
    expect(result).toBe(0);
  });

  it('should handle single contact', () => {
    const result = calculateAverageHealth([mockContact]);
    
    expect(result).toBe(75);
  });
});

// =============================================================================
// TESTS: filterContactsByQuery
// =============================================================================

describe('filterContactsByQuery', () => {
  it('should filter by full name (case insensitive)', () => {
    const result = filterContactsByQuery(mockContacts, 'alice');
    
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Alice');
  });

  it('should filter by nickname', () => {
    const contactsWithNicknames = [
      { ...mockContact, id: '1', fullName: 'Michael', nickname: 'Mike' },
      { ...mockContact, id: '2', fullName: 'Robert', nickname: 'Bob' },
    ];
    
    const result = filterContactsByQuery(contactsWithNicknames, 'Mike');
    
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Michael');
  });

  it('should return all contacts for empty query', () => {
    const result = filterContactsByQuery(mockContacts, '');
    
    expect(result).toHaveLength(mockContacts.length);
  });

  it('should return all contacts for whitespace query', () => {
    const result = filterContactsByQuery(mockContacts, '   ');
    
    expect(result).toHaveLength(mockContacts.length);
  });

  it('should return empty array when no matches', () => {
    const result = filterContactsByQuery(mockContacts, 'xyz123');
    
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// TESTS: sortContacts
// =============================================================================

describe('sortContacts', () => {
  it('should sort by name ascending', () => {
    const result = sortContacts(mockContacts, 'name', 'asc');
    
    expect(result[0].fullName).toBe('Alice');
    expect(result[3].fullName).toBe('Diana');
  });

  it('should sort by name descending', () => {
    const result = sortContacts(mockContacts, 'name', 'desc');
    
    expect(result[0].fullName).toBe('Diana');
    expect(result[3].fullName).toBe('Alice');
  });

  it('should sort by health ascending', () => {
    const result = sortContacts(mockContacts, 'health', 'asc');
    
    expect(result[0].healthScore).toBe(30);
    expect(result[3].healthScore).toBe(85);
  });

  it('should sort by health descending', () => {
    const result = sortContacts(mockContacts, 'health', 'desc');
    
    expect(result[0].healthScore).toBe(85);
    expect(result[3].healthScore).toBe(30);
  });

  it('should not mutate original array', () => {
    const original = [...mockContacts];
    sortContacts(mockContacts, 'health', 'desc');
    
    expect(mockContacts).toEqual(original);
  });
});
