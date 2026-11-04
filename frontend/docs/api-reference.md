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

### `generateDraft(contactId: string, eventId?: string)`

Uses `llm.service.ts` (Groq, with a template fallback) to generate a draft from contact and optional event context. The event must be accessible and belong to the specified contact. Failed context lookup or unsuccessful/empty generation returns an error without saving.

- **Returns**: `Promise<SDKResponse<DraftWithContext>>`
- **Approval**: Applies event override → contact default → significance. Templates and missing model provenance always require review. See [approval policy](../../docs/automation_policy.md).
- **Context**: Returned data includes `contactName`, `contactAvatar`, `healthScore`, and optional `eventType`/`eventName` for immediate rendering.
- **Scheduling**: Retains the stored event date (or generation time for an ad-hoc draft); recurring-occurrence selection and a delivery worker are not implemented by this method.

The UI currently generates ad-hoc check-ins. Call the SDK with a stored event UUID to use event context; virtual IDs from recurrence expansion are not stored UUIDs.

### `getPendingDrafts()`

Fetches all drafts with status `WAITING_FOR_REVIEW` or `APPROVED_WAITING`.

### `approveDraft(draftId)`, `updateDraft(draftId, content)`, `rejectDraft(draftId)`

Return `Promise<SDKResponse<void>>`. Approval requires `WAITING_FOR_REVIEW`. Edit/cancel accept review or approved drafts; editing trims nonblank content and resets approval. Each update filters by ID and allowed status and checks that exactly one row was returned. Missing/inaccessible/ineligible drafts return failure instead of success. Status guards do not detect simultaneous edits within the same state.

Approval only updates queue state; the repository does not send messages.

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
