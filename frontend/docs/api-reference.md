# API Reference

This document outlines the core SDK methods available for interacting with the backend.

## 1. ContactsSDK (`src/services/contactsSDK.ts`)

### `getContacts()`

Fetches all contacts, automatically calculating `healthScore` and `ghostingRiskScore` based on interaction history.

- **Returns**: `Promise<SDKResponse<Contact[]>>`

### `createContact(data: Partial<Contact>)`

Creates a new contact record.

- **Params**: `fullName`, `intimacyLevel`, etc.
- **Returns**: `Promise<SDKResponse<Contact>>`

### `updateInteraction(contactId: string, date: Date, type: string)`

Logs a new interaction and updates the contact's `last_interaction_date`.

- **Params**:
  - `contactId`: UUID
  - `date`: Interaction date
  - `type`: 'CALL', 'MEETING', 'MESSAGE' -> 'WHATSAPP' | 'LINKEDIN', etc.

## 2. EventsSDK (`src/services/eventsSDK.ts`)

### `getEvents(startDate, endDate)`

Fetches events within a date range. automatically expands recurring events (e.g., Annual Birthdays) into concrete instances for the requested range.

- **Returns**: `Promise<SDKResponse<EventWithContact[]>>`

### `createEvent(data)`

Creates a new event (one-time or recurring).

- **Params**:
  - `recurrenceRule`: 'ONCE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY'
  - `reminderDaysBefore`: number[]

## 3. MessagesSDK (`src/services/messagesSDK.ts`)

### `generateDraft(contactId, eventId, context)`

Uses the **AIService** to generate a message draft based on the contact's intimacy level and the event type.

- **Returns**: `Promise<SDKResponse<DraftWithContext>>`
- **Auto-Send**: If contact has `ALWAYS_AUTO_SEND` policy, the draft status will be `APPROVED_WAITING`.

### `getPendingDrafts()`

Fetches all drafts with status `WAITING_FOR_REVIEW` or `APPROVED_WAITING`.

## Data Types

### `Contact`

```typescript
interface Contact {
  id: string;
  fullName: string;
  intimacyLevel: number; // 1-10
  healthScore: number; // 0-100 (Calculated)
  defaultAutoPolicy:
    | "ALWAYS_REVIEW"
    | "AUTO_SEND_LOW_RISK"
    | "ALWAYS_AUTO_SEND";
}
```

### `DraftWithContext`

```typescript
interface DraftWithContext {
  id: string;
  generatedContent: string;
  aiRationale: string; // Explanation for the generated content
  status: "WAITING_FOR_REVIEW" | "APPROVED_WAITING" | "SENT" | "CANCELLED";
}
```
