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
    healthScore: 78,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
    ghostingRiskScore: 0.05,
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
    healthScore: 68,
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
];

/**
 * Generate events for the next 60 days based on contacts
 */
function generateDemoEvents(contacts: Contact[]): Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] {
  const events: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const today = new Date();
  
  // Priya's birthday in 3 days
  const priya = contacts.find(c => c.fullName === 'Priya Sharma');
  if (priya) {
    const bday = new Date(today);
    bday.setDate(bday.getDate() + 3);
    events.push({
      contactId: priya.id,
      eventType: 'BIRTHDAY',
      eventDate: bday.toISOString().split('T')[0],
      originalYear: 1992,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1, 7],
    });
  }
  
  // Sarah's anniversary in 7 days
  const sarah = contacts.find(c => c.fullName === 'Sarah Williams');
  if (sarah) {
    const anniv = new Date(today);
    anniv.setDate(anniv.getDate() + 7);
    events.push({
      contactId: sarah.id,
      eventType: 'ANNIVERSARY',
      eventDate: anniv.toISOString().split('T')[0],
      originalYear: 2020,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7, 14],
      notes: '5th anniversary - special celebration planned',
    });
  }
  
  // Michael's promotion in 10 days
  const michael = contacts.find(c => c.fullName === 'Michael Chen');
  if (michael) {
    const promo = new Date(today);
    promo.setDate(promo.getDate() + 10);
    events.push({
      contactId: michael.id,
      eventType: 'PROMOTION',
      eventName: 'SVP Announcement',
      eventDate: promo.toISOString().split('T')[0],
      recurrenceRule: 'ONCE',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 3],
    });
  }
  
  // Emma's graduation in 14 days
  const emma = contacts.find(c => c.fullName === 'Emma Thompson');
  if (emma) {
    const grad = new Date(today);
    grad.setDate(grad.getDate() + 14);
    events.push({
      contactId: emma.id,
      eventType: 'GRADUATION',
      eventName: 'Medical School Graduation',
      eventDate: grad.toISOString().split('T')[0],
      recurrenceRule: 'ONCE',
      significanceLevel: 'HIGH',
      automationOverride: 'FORCE_REVIEW',
      reminderDaysBefore: [1, 7, 14],
      notes: 'Becoming Dr. Thompson!',
    });
  }
  
  // David's birthday in 21 days
  const david = contacts.find(c => c.fullName === 'David Rodriguez');
  if (david) {
    const bday = new Date(today);
    bday.setDate(bday.getDate() + 21);
    events.push({
      contactId: david.id,
      eventType: 'BIRTHDAY',
      eventDate: bday.toISOString().split('T')[0],
      originalYear: 1988,
      recurrenceRule: 'YEARLY',
      significanceLevel: 'LOW',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1],
    });
  }
  
  // Aisha's new job in 5 days
  const aisha = contacts.find(c => c.fullName === 'Aisha Patel');
  if (aisha) {
    const newJob = new Date(today);
    newJob.setDate(newJob.getDate() + 5);
    events.push({
      contactId: aisha.id,
      eventType: 'NEW_JOB',
      eventName: 'CTO at TechVentures',
      eventDate: newJob.toISOString().split('T')[0],
      recurrenceRule: 'ONCE',
      significanceLevel: 'MEDIUM',
      automationOverride: 'USE_CONTACT_DEFAULT',
      reminderDaysBefore: [1],
    });
  }
  
  return events;
}

/**
 * Seed the application with demo data
 */
export function seedDemoData(): { contacts: number; events: number } {
  // Check if data already exists
  const existingContacts = storageService.loadContacts();
  if (existingContacts.length > 0) {
    console.log('Demo data already exists. Skipping seed.');
    return { contacts: existingContacts.length, events: storageService.loadEvents().length };
  }
  
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
