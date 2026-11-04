# Draft approval policy

`MessagesSDK.generateDraft(contactId, eventId?)` evaluates [determineDraftStatus](../frontend/src/utils/automation-policy.ts) before inserting a draft. `APPROVED_WAITING` means approved queue state; no delivery worker or cron job is implemented here.

## Generation rules

First, fallback templates or missing model provenance require `WAITING_FOR_REVIEW`, even for `FORCE_AUTO` and `ALWAYS_AUTO_SEND`. Unsuccessful or empty generation is rejected. If an event ID is supplied, a missing, inaccessible, or mismatched event aborts generation rather than dropping the event's review rules.

For model-generated content, evaluate in order:

| Level | Value | Result |
| --- | --- | --- |
| Event override | `FORCE_REVIEW` | `WAITING_FOR_REVIEW` |
| Event override | `FORCE_AUTO` | `APPROVED_WAITING` |
| Event override | `USE_CONTACT_DEFAULT` | Evaluate contact policy |
| Contact policy | `ALWAYS_REVIEW` | `WAITING_FOR_REVIEW` |
| Contact policy | `ALWAYS_AUTO_SEND` | `APPROVED_WAITING` |
| Contact policy | `AUTO_SEND_LOW_RISK` | Approve only when an event has `LOW` or `MEDIUM` significance |

Unknown/null values at an evaluated decision level require review. An ad-hoc check-in has no event significance, so `AUTO_SEND_LOW_RISK` requires review. With no event, `ALWAYS_AUTO_SEND` still approves model-generated content.

For example, a `FORCE_REVIEW` promotion requires review even when the contact defaults to automatic approval. A model-generated birthday with `USE_CONTACT_DEFAULT`, `AUTO_SEND_LOW_RISK`, and `MEDIUM` significance is approved. The same birthday generated from a fallback template requires review.

## Queue actions

| Action | Allowed source state | Result |
| --- | --- | --- |
| Approve | `WAITING_FOR_REVIEW` | `APPROVED_WAITING` |
| Edit nonblank content | `WAITING_FOR_REVIEW`, `APPROVED_WAITING` | Save trimmed content; set `WAITING_FOR_REVIEW` |
| Cancel | `WAITING_FOR_REVIEW`, `APPROVED_WAITING` | `CANCELLED` |

Each SDK update filters by ID and allowed status in the same request and verifies one returned row. Zero affected rows produce an error, covering deleted, inaccessible, or ineligible drafts. Terminal states cannot be changed by these SDK actions. The War Room shows failed actions, retains failed edits, offers load retries, and disables actions during a pending request.

These are application rules, not database constraints. Direct database clients can bypass the SDK, and concurrent changes within the same allowed state do not use content-version checks. Existing queued drafts are not reclassified by this change. No schema migration is needed. Live RLS/concurrency verification is tracked in [issue #7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7).

## Verification

From `frontend/`:

```sh
npm test -- src/services/messagesSDK.test.ts src/utils/automation-policy.test.ts src/bloc/messages/messages.bloc.test.ts src/pages/review-queue.test.tsx src/pages/review-queue.integration.test.tsx src/components/draft-card.test.tsx
```

The SDK tests cover all 27 combinations of event override, contact policy, and significance using the real Supabase query builder with mocked HTTP. The `/review` integration test exercises approval, two edits, reapproval, and cancellation through the page and BLoC. [Evidence and limits](engineering-evidence.md).
