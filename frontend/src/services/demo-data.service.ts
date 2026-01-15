/**
 * Demo Data Seed
 * 
 * Provides sample data for demonstration purposes.
 * Run this to populate localStorage with realistic demo contacts and events.
 */

import * as storageService from './storage.service';
import type { Contact, Event } from '@/types';

const DEMO_CONTACTS: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    userId: 'demo',
    fullName: 'Priya Sharma',
    nickname: 'Pri',
    email: 'priya.sharma@email.com',
    phoneNumber: '+1 555-0101',
    instagramHandle: '@priyasharma',
    relationType: 'FRIEND',
    intimacyLevel: 9,
    healthScore: 85,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.1,
    notes: 'Best friend from college. Loves hiking and photography.',
  },
  {
    userId: 'demo',
    fullName: 'Michael Chen',
    nickname: 'Mike',
    email: 'michael.chen@corporate.com',
    phoneNumber: '+1 555-0202',
    relationType: 'WORK',
    intimacyLevel: 6,
    healthScore: 42,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.6,
    notes: 'VP of Engineering. Mentor figure. Prefers formal communication.',
  },
  {
    userId: 'demo',
    fullName: 'Sarah Williams',
    email: 'sarah.w@email.com',
    phoneNumber: '+1 555-0303',
    relationType: 'PARTNER',
    intimacyLevel: 10,
    healthScore: 95,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
    ghostingRiskScore: 0.02,
    notes: 'Life partner. Anniversary is important.',
  },
  {
    userId: 'demo',
    fullName: 'David Rodriguez',
    nickname: 'Dave',
    email: 'david.r@startup.io',
    phoneNumber: '+1 555-0404',
    instagramHandle: '@davebuilds',
    relationType: 'NETWORK',
    intimacyLevel: 4,
    healthScore: 55,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.4,
    notes: 'Met at TechCrunch Disrupt. Potential collaborator.',
  },
  {
    userId: 'demo',
    fullName: 'Emma Thompson',
    nickname: 'Em',
    email: 'emma.t@family.com',
    phoneNumber: '+1 555-0505',
    relationType: 'FAMILY',
    intimacyLevel: 8,
    healthScore: 92,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.02,
    notes: 'Younger sister. Medical school student.',
  },
  {
    userId: 'demo',
    fullName: 'James Wilson',
    email: 'james.wilson@corp.com',
    phoneNumber: '+1 555-0606',
    relationType: 'WORK',
    intimacyLevel: 3,
    healthScore: 28,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.8,
    notes: 'Former colleague. Have not caught up in months.',
  },
  {
    userId: 'demo',
    fullName: 'Aisha Patel',
    nickname: 'Ash',
    email: 'aisha.p@startup.com',
    phoneNumber: '+1 555-0707',
    instagramHandle: '@aisha_codes',
    relationType: 'FRIEND',
    intimacyLevel: 7,
    healthScore: 72,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.25,
    notes: 'Co-founder of book club. Loves sci-fi.',
  },
  {
    userId: 'demo',
    fullName: 'Robert Kim',
    nickname: 'Rob',
    email: 'robert.kim@investor.vc',
    phoneNumber: '+1 555-0808',
    relationType: 'NETWORK',
    intimacyLevel: 5,
    healthScore: 62,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.35,
    notes: 'Angel investor. Met through YC network.',
  },
  {
    userId: 'demo',
    fullName: 'Jennifer Martinez',
    nickname: 'Jen',
    email: 'jen.martinez@tech.com',
    phoneNumber: '+1 555-0909',
    instagramHandle: '@jenmartinez',
    relationType: 'WORK',
    intimacyLevel: 6,
    healthScore: 78,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.15,
    notes: 'Product Manager at current company. Great collaborator.',
  },
  {
    userId: 'demo',
    fullName: 'Alex Thompson',
    email: 'alex.t@family.com',
    phoneNumber: '+1 555-1010',
    relationType: 'FAMILY',
    intimacyLevel: 9,
    healthScore: 88,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
    ghostingRiskScore: 0.05,
    notes: 'Older brother. Works in finance.',
  },
  {
    userId: 'demo',
    fullName: 'Olivia Brown',
    nickname: 'Liv',
    email: 'olivia.b@creative.agency',
    phoneNumber: '+1 555-1111',
    instagramHandle: '@livdesigns',
    relationType: 'FRIEND',
    intimacyLevel: 7,
    healthScore: 65,
    defaultChannel: 'INSTAGRAM',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.30,
    notes: 'College roommate. Graphic designer. Very creative.',
  },
  {
    userId: 'demo',
    fullName: 'Marcus Johnson',
    email: 'marcus.j@enterprise.com',
    phoneNumber: '+1 555-1212',
    relationType: 'NETWORK',
    intimacyLevel: 4,
    healthScore: 48,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.55,
    notes: 'CEO of partner company. Important business contact.',
  },
];

/**
 * Generate events for the next 60 days based on contacts
 */
function generateDemoEvents(contacts: Contact[]): Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] {
  const events: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const today = new Date();
  
  // Helper to get date N days from now
  const getDate = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };
  
  // Find contacts by name
  const findContact = (name: string) => contacts.find(c => c.fullName.includes(name));
  
  // Priya's birthday in 2 days
  const priya = findContact('Priya');
  if (priya) {
    events.push({
      contactId: priya.id,
      eventType: 'BIRTHDAY',
      eventDate: getDate(2),
      originalYear: 1992,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1, 7],
    });
  }
  
  // Sarah's anniversary in 5 days
  const sarah = findContact('Sarah');
  if (sarah) {
    events.push({
      contactId: sarah.id,
      eventType: 'ANNIVERSARY',
      eventDate: getDate(5),
      originalYear: 2020,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7, 14],
      notes: '5th anniversary - special celebration planned',
    });
  }
  
  // Michael's promotion in 8 days
  const michael = findContact('Michael');
  if (michael) {
    events.push({
      contactId: michael.id,
      eventType: 'PROMOTION',
      eventName: 'SVP Announcement',
      eventDate: getDate(8),
      recurrenceRule: 'ONCE',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 3],
    });
  }
  
  // Emma's graduation in 12 days
  const emma = findContact('Emma');
  if (emma) {
    events.push({
      contactId: emma.id,
      eventType: 'GRADUATION',
      eventName: 'Medical School Graduation',
      eventDate: getDate(12),
      recurrenceRule: 'ONCE',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7, 14],
      notes: 'Becoming Dr. Thompson!',
    });
  }
  
  // David's birthday in 18 days
  const david = findContact('David');
  if (david) {
    events.push({
      contactId: david.id,
      eventType: 'BIRTHDAY',
      eventDate: getDate(18),
      originalYear: 1988,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'LOW',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1],
    });
  }
  
  // Aisha's new job in 3 days
  const aisha = findContact('Aisha');
  if (aisha) {
    events.push({
      contactId: aisha.id,
      eventType: 'NEW_JOB',
      eventName: 'CTO at TechVentures',
      eventDate: getDate(3),
      recurrenceRule: 'ONCE',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1],
    });
  }
  
  // Robert's birthday in 25 days
  const robert = findContact('Robert');
  if (robert) {
    events.push({
      contactId: robert.id,
      eventType: 'BIRTHDAY',
      eventDate: getDate(25),
      originalYear: 1975,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'MEDIUM',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7],
    });
  }
  
  // Jennifer's work anniversary in 7 days
  const jennifer = findContact('Jennifer');
  if (jennifer) {
    events.push({
      contactId: jennifer.id,
      eventType: 'CUSTOM',
      eventName: '3 Years at Company',
      eventDate: getDate(7),
      recurrenceRule: 'YEARLY',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1],
      notes: 'Work anniversary celebration',
    });
  }
  
  // Alex's new baby in 15 days
  const alex = findContact('Alex Thompson');
  if (alex) {
    events.push({
      contactId: alex.id,
      eventType: 'NEW_BABY',
      eventName: 'Baby Shower',
      eventDate: getDate(15),
      recurrenceRule: 'ONCE',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7],
      notes: 'First child! Need to get a gift.',
    });
  }
  
  // Olivia's house warming in 22 days
  const olivia = findContact('Olivia');
  if (olivia) {
    events.push({
      contactId: olivia.id,
      eventType: 'HOUSE_WARMING',
      eventName: 'New Apartment Party',
      eventDate: getDate(22),
      recurrenceRule: 'ONCE',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1, 7],
      notes: 'Moved to downtown',
    });
  }
  
  // Marcus birthday in 30 days
  const marcus = findContact('Marcus');
  if (marcus) {
    events.push({
      contactId: marcus.id,
      eventType: 'BIRTHDAY',
      eventDate: getDate(30),
      originalYear: 1970,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'MEDIUM',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7],
    });
  }
  
  // James needs reconnection - custom event
  const james = findContact('James');
  if (james) {
    events.push({
      contactId: james.id,
      eventType: 'CUSTOM',
      eventName: 'Reconnection Reminder',
      eventDate: getDate(1),
      recurrenceRule: 'ONCE',
      significanceLevel: 'LOW',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [0],
      notes: 'Has been 6 months since last contact',
    });
  }
  
  return events;
}

/**
 * Seed the application with demo data
 */
export function seedDemoData(): { contacts: number; events: number } {
  // Clear existing data first for fresh demo
  storageService.clearAllData();
  
  // Add contacts
  const addedContacts: Contact[] = [];
  for (const contactData of DEMO_CONTACTS) {
    const contact = storageService.addContact(contactData);
    addedContacts.push(contact);
  }
  
  // Add events
  const eventData = generateDemoEvents(addedContacts);
  for (const event of eventData) {
    storageService.addEvent(event);
  }
  
  console.log(`Seeded ${addedContacts.length} contacts and ${eventData.length} events`);
  return { contacts: addedContacts.length, events: eventData.length };
}

/**
 * Clear all demo data
 */
export function clearDemoData(): void {
  storageService.clearAllData();
  console.log('All demo data cleared');
}
