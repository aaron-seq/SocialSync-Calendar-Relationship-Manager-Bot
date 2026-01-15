/**
 * Demo Data Seed
 * 
 * Provides sample data for demonstration purposes.
 * Run this to populate localStorage with realistic demo contacts, events, and drafts.
 */

import * as storageService from './storage.service';
import type { Contact, Event, Draft } from '@/types';

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
    intimacyLevel: 4,
    healthScore: 22,
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
    intimacyLevel: 3,
    healthScore: 35,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.55,
    notes: 'CEO of partner company. Important business contact.',
  },
  {
    userId: 'demo',
    fullName: 'Sophia Lee',
    nickname: 'Sophie',
    email: 'sophia.lee@design.co',
    phoneNumber: '+1 555-1313',
    instagramHandle: '@sophialee_ux',
    relationType: 'WORK',
    intimacyLevel: 7,
    healthScore: 81,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.12,
    notes: 'UX Lead on current project. Amazing attention to detail.',
  },
  {
    userId: 'demo',
    fullName: 'William Taylor',
    nickname: 'Will',
    email: 'will.taylor@finance.com',
    phoneNumber: '+1 555-1414',
    relationType: 'FRIEND',
    intimacyLevel: 6,
    healthScore: 58,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.38,
    notes: 'College buddy. Works in investment banking.',
  },
  {
    userId: 'demo',
    fullName: 'Grace Chen',
    email: 'grace.chen@family.com',
    phoneNumber: '+1 555-1515',
    relationType: 'FAMILY',
    intimacyLevel: 8,
    healthScore: 90,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'ALWAYS_AUTO_SEND',
    ghostingRiskScore: 0.03,
    notes: 'Mother. Weekly Sunday calls.',
  },
  {
    userId: 'demo',
    fullName: 'Daniel Kumar',
    nickname: 'Dan',
    email: 'daniel.kumar@tech.io',
    phoneNumber: '+1 555-1616',
    instagramHandle: '@dan_codes',
    relationType: 'NETWORK',
    intimacyLevel: 4,
    healthScore: 38,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.42,
    notes: 'Met at AWS re:Invent. Cloud architect.',
  },
  {
    userId: 'demo',
    fullName: 'Isabella Garcia',
    nickname: 'Bella',
    email: 'bella.garcia@marketing.co',
    phoneNumber: '+1 555-1717',
    instagramHandle: '@bellagarcia',
    relationType: 'WORK',
    intimacyLevel: 5,
    healthScore: 68,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.22,
    notes: 'Marketing Director. Great for go-to-market strategies.',
  },
  {
    userId: 'demo',
    fullName: 'Christopher Adams',
    nickname: 'Chris',
    email: 'chris.adams@startup.io',
    phoneNumber: '+1 555-1818',
    relationType: 'FRIEND',
    intimacyLevel: 8,
    healthScore: 75,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.18,
    notes: 'Co-founder of previous startup. Still close.',
  },
  {
    userId: 'demo',
    fullName: 'Victoria Scott',
    nickname: 'Vic',
    email: 'victoria.scott@law.firm',
    phoneNumber: '+1 555-1919',
    relationType: 'NETWORK',
    intimacyLevel: 3,
    healthScore: 32,
    defaultChannel: 'EMAIL',
    defaultAutoPolicy: 'ALWAYS_REVIEW',
    ghostingRiskScore: 0.52,
    notes: 'Corporate lawyer. Helped with company formation.',
  },
  {
    userId: 'demo',
    fullName: 'Nathan Wright',
    nickname: 'Nate',
    email: 'nate.wright@sports.club',
    phoneNumber: '+1 555-2020',
    instagramHandle: '@nate_runs',
    relationType: 'FRIEND',
    intimacyLevel: 6,
    healthScore: 70,
    defaultChannel: 'WHATSAPP',
    defaultAutoPolicy: 'AUTO_SEND_LOW_RISK',
    ghostingRiskScore: 0.28,
    notes: 'Running partner. Train together on weekends.',
  },
];

/**
 * Generate events for the next 60 days based on contacts
 */
function generateDemoEvents(contacts: Contact[]): Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] {
  const events: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const today = new Date();
  
  const getDate = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };
  
  const findContact = (name: string) => contacts.find(c => c.fullName.includes(name));
  
  // Event data
  const eventConfigs = [
    { name: 'Priya', days: 2, type: 'BIRTHDAY' as const, year: 1992, sig: 'MEDIUM' as const },
    { name: 'Sarah', days: 5, type: 'ANNIVERSARY' as const, year: 2020, sig: 'HIGH' as const },
    { name: 'Michael', days: 8, type: 'PROMOTION' as const, eventName: 'SVP Announcement', sig: 'HIGH' as const },
    { name: 'Emma', days: 12, type: 'GRADUATION' as const, eventName: 'Medical School Graduation', sig: 'HIGH' as const },
    { name: 'David', days: 18, type: 'BIRTHDAY' as const, year: 1988, sig: 'LOW' as const },
    { name: 'Aisha', days: 3, type: 'NEW_JOB' as const, eventName: 'CTO at TechVentures', sig: 'MEDIUM' as const },
    { name: 'Robert', days: 25, type: 'BIRTHDAY' as const, year: 1975, sig: 'MEDIUM' as const },
    { name: 'Jennifer', days: 7, type: 'CUSTOM' as const, eventName: '3 Years at Company', sig: 'MEDIUM' as const },
    { name: 'Alex Thompson', days: 15, type: 'NEW_BABY' as const, eventName: 'Baby Shower', sig: 'HIGH' as const },
    { name: 'Olivia', days: 22, type: 'HOUSE_WARMING' as const, eventName: 'New Apartment Party', sig: 'MEDIUM' as const },
    { name: 'Marcus', days: 30, type: 'BIRTHDAY' as const, year: 1970, sig: 'MEDIUM' as const },
    { name: 'James', days: 1, type: 'CUSTOM' as const, eventName: 'Reconnection Reminder', sig: 'LOW' as const },
    { name: 'Sophia', days: 4, type: 'BIRTHDAY' as const, year: 1994, sig: 'MEDIUM' as const },
    { name: 'William', days: 10, type: 'BIRTHDAY' as const, year: 1991, sig: 'MEDIUM' as const },
    { name: 'Grace', days: 14, type: 'BIRTHDAY' as const, year: 1965, sig: 'HIGH' as const },
    { name: 'Daniel', days: 20, type: 'NEW_JOB' as const, eventName: 'Principal Architect at AWS', sig: 'MEDIUM' as const },
    { name: 'Isabella', days: 9, type: 'PROMOTION' as const, eventName: 'VP Marketing', sig: 'MEDIUM' as const },
    { name: 'Christopher', days: 6, type: 'BIRTHDAY' as const, year: 1990, sig: 'HIGH' as const },
    { name: 'Victoria', days: 28, type: 'BIRTHDAY' as const, year: 1985, sig: 'LOW' as const },
    { name: 'Nathan', days: 11, type: 'CUSTOM' as const, eventName: 'Marathon Day', sig: 'LOW' as const },
  ];
  
  for (const cfg of eventConfigs) {
    const contact = findContact(cfg.name);
    if (contact) {
      events.push({
        contactId: contact.id,
        eventType: cfg.type,
        eventName: cfg.eventName,
        eventDate: getDate(cfg.days),
        originalYear: cfg.year,
        recurrenceRule: ['BIRTHDAY', 'ANNIVERSARY'].includes(cfg.type) ? 'YEARLY' : 'ONCE',
        significanceLevel: cfg.sig,
        automationOverride: cfg.sig === 'HIGH' ? 'FORCE_REVIEW' : 'USE_CONTACT_DEFAULT',
        reminderDaysBefore: cfg.sig === 'HIGH' ? [1, 7, 14] : [1, 7],
      });
    }
  }
  
  return events;
}

/**
 * Generate AI drafts for upcoming events
 */
function generateDemoDrafts(contacts: Contact[], events: Event[]): Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>[] {
  const drafts: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const contactMap = new Map(contacts.map(c => [c.id, c]));
  
  // Get events happening in the next 7 days
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.eventDate);
    const today = new Date();
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });
  
  const draftTemplates = {
    BIRTHDAY: [
      { content: "Happy Birthday! Wishing you an incredible year ahead filled with success and happiness. Enjoy your special day!", rationale: "Selected warm, professional tone based on relationship history and past interaction patterns." },
      { content: "Another year of achievements! Happy Birthday - may this year bring you even more success and joy than the last. Celebrate big!", rationale: "Enthusiastic tone chosen due to high intimacy level and previous positive exchanges." },
    ],
    ANNIVERSARY: [
      { content: "Happy Anniversary! Another beautiful year together. Here's to many more years of love, laughter, and adventures. Love you!", rationale: "Maximum warmth applied for PARTNER relation. Personal and romantic tone appropriate for high intimacy level." },
    ],
    PROMOTION: [
      { content: "Congratulations on the well-deserved promotion! Your hard work and dedication have truly paid off. Excited to see you excel in this new role.", rationale: "Professional congratulatory tone selected for WORK relation. Avoided emojis per user preferences for work contacts." },
    ],
    GRADUATION: [
      { content: "Congratulations on your graduation! All those years of hard work have led to this moment. So proud of everything you've accomplished. The world is yours!", rationale: "High enthusiasm tone selected for FAMILY relation combined with milestone event significance." },
    ],
    NEW_JOB: [
      { content: "Congratulations on the new role! This is such an exciting opportunity. Wishing you all the best as you start this new chapter.", rationale: "Supportive tone chosen for career milestone. Balanced professional and personal warmth." },
    ],
    NEW_BABY: [
      { content: "Congratulations on the wonderful news! So excited for you as you embark on this amazing journey of parenthood. Can't wait to meet the little one!", rationale: "Warm, family-oriented tone for FAMILY relation. High significance event requiring personal touch." },
    ],
    CUSTOM: [
      { content: "Hey! It's been a while since we last caught up. Would love to reconnect and hear what you've been up to. Coffee sometime?", rationale: "Casual reconnection tone for low-touch relationship. Aimed at relationship maintenance." },
    ],
  };
  
  for (const event of upcomingEvents.slice(0, 8)) {
    const contact = contactMap.get(event.contactId);
    if (!contact) continue;
    
    const templates = draftTemplates[event.eventType as keyof typeof draftTemplates] || draftTemplates.CUSTOM;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const scheduledTime = new Date(event.eventDate);
    scheduledTime.setHours(9, 0, 0, 0);
    
    drafts.push({
      eventId: event.id,
      contactId: contact.id,
      generatedContent: template.content,
      aiRationale: template.rationale,
      status: contact.defaultAutoPolicy === 'ALWAYS_AUTO_SEND' ? 'APPROVED_WAITING' : 'WAITING_FOR_REVIEW',
      scheduledSendTime: scheduledTime.toISOString(),
      userEdited: false,
    });
  }
  
  return drafts;
}

/**
 * Seed the application with demo data
 */
export function seedDemoData(): { contacts: number; events: number; drafts: number } {
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
  const addedEvents: Event[] = [];
  for (const event of eventData) {
    const added = storageService.addEvent(event);
    addedEvents.push(added);
  }
  
  // Add drafts
  const draftData = generateDemoDrafts(addedContacts, addedEvents);
  for (const draft of draftData) {
    storageService.addDraft(draft);
  }
  
  console.log(`Seeded ${addedContacts.length} contacts, ${addedEvents.length} events, and ${draftData.length} drafts`);
  return { contacts: addedContacts.length, events: addedEvents.length, drafts: draftData.length };
}

/**
 * Clear all demo data
 */
export function clearDemoData(): void {
  storageService.clearAllData();
  console.log('All demo data cleared');
}
