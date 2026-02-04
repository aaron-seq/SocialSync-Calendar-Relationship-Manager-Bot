import type { Contact, EventType, Event } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

interface GenerationContext {
  contact: Contact;
  event?: Event;
  eventType?: EventType;
  tone?: 'casual' | 'formal' | 'excited' | 'sentimental';
}

const TEMPLATES: Record<string, string[]> = {
  BIRTHDAY_CASUAL: [
    "Happy Birthday {name}! Hope you have an amazing day! 🎂",
    "HBD {name}! 🥳 have a blast!",
    "Happy birthday!! Hope this year brings you everything you want."
  ],
  BIRTHDAY_FORMAL: [
    "Happy Birthday, {name}. Wishing you a wonderful year ahead.",
    "Best wishes on your birthday, {name}.",
    "Happy Birthday! Hope you have a great celebration."
  ],
  BIRTHDAY_INTIMATE: [
    "Happy Birthday {name}! So grateful to have you in my life. Let's celebrate soon! ❤️",
    "Happy bday! Can't imagine life without you. Love you! 🎂",
    "Sending you so much love on your birthday {name}!"
  ],
  GENERIC: [
    "Hey {name}, thinking of you! Hope you're doing well.",
    "Hi {name}, it's been a while! How have you been?",
    "Just wanted to say hi {name}!"
  ]
};

export class AIService {
  /**
   * Simulates AI generation with template filling logic.
   * In a real app, this would call an LLM API.
   */
  static async generateMessage(context: GenerationContext): Promise<{ content: string; rationale: string }> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const { contact, event, eventType } = context;
    const name = contact.nickname || contact.fullName.split(' ')[0];
    const intimacy = contact.intimacyLevel;
    
    // Choose tone based on intimacy
    let tone = 'formal';
    if (intimacy >= 8) tone = 'intimate';
    else if (intimacy >= 4) tone = 'casual';

    // Select template key
    let key = 'GENERIC';
    if (event || eventType === 'BIRTHDAY') {
      key = `BIRTHDAY_${tone.toUpperCase()}`;
    }
    
    // Fallback if key missing
    if (!TEMPLATES[key]) key = 'GENERIC';
    
    const options = TEMPLATES[key];
    const template = options[Math.floor(Math.random() * options.length)];
    
    const content = template.replace('{name}', name);
    
    // Generate rationale
    const daysSince = contact.lastInteractionDate 
      ? differenceInDays(new Date(), parseISO(contact.lastInteractionDate))
      : 'unknown';
      
    const rationale = `Selected ${tone} tone based on intimacy level ${intimacy}/10. Last interaction was ${daysSince} days ago.`;

    return { content, rationale };
  }
}
