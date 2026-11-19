# Claims, gaps and landscape

The baseline for this audit is draft [PR #9](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/pull/9) at `331735d`. Rows distinguish observed fixture behavior, code review, published CI, and live claims awaiting validation.

| ID | Claim or gap | Evidence and disposition |
| --- | --- | --- |
| CLM-01 | Contacts are stored in Supabase | SDK path inspected. Deferred POST and optional-field clearing fail with mocked HTTP. Persistence in a disposable project remains open. [#12](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/12) · [#7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7) |
| CLM-02 | Upcoming recurring occasions appear on the calendar | Reproduced omitted long-running weekly events, an omitted final occurrence, monthly drift, and a date-only shift in Los Angeles. [#8](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/8) |
| CLM-03 / GAP-01 | Browser reminders run in the open app | Loaded events reached the error boundary without the Notification API. An eligible reminder worked in the granted fixture. [#10](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/10) |
| CLM-04 | Draft review and approval | The previous [route integration test](../../frontend/src/pages/review-queue.integration.test.tsx) covers approve, edit and cancel with simulated HTTP. Review and live persistence remain open. [#4](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/4) · [#7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7) |
| CLM-05 | Groq generation with a template fallback | Code and mocked tests support both paths. Public hosting with Groq needs server-side key handling. [#5](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/5) |
| CLM-06 | The CI checks run on the delivery branch | Prior PR checks passed. Its coverage upload lacked an input report. [Prior run](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/actions/runs/41802253473) · [#6](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/6) |
| GAP-02 | Calendar deletion reports success when only reads run | Verified with real Calendar, event hook and SDK using HTTP fixtures. The event remains visible. [#11](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/11) |
| GAP-03 | Failed forms close and cleared optional fields stay set | Verified with delayed and rejected submissions and observed PATCH fields. [#12](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/12) |

The current API guide and frontend architecture describe the supported paths. The older root architecture contains historical names. Reading it did not establish production behavior. Calendar filtering, recurring reminder deduplication, and handling of empty versus failed loads were code review leads outside this milestone. [#11](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/11)

## Landscape evidence

Reviewed by the research and evidence agents on November 5, 2026. The matrix compares documented behavior. Only SocialSync was exercised locally.

| Job | SocialSync | Monica v4.1.2 | Dex |
| --- | --- | --- | --- |
| Keep contact context | Contacts and notes | Contacts and relationship context | Contacts and relationship context |
| See recurring occasions | Calendar and browser reminders while open | Birthday and interval reminders | Fixed recurrence and last-interaction cadence |
| Prepare a check-in | Groq or template with an approval queue | Unknown from the versioned guide | AI message suggestions and email handoff |

Sources include [Monica's versioned README](https://github.com/monicahq/monica/blob/v4.1.2/README.md), [Dex Reminders](https://getdex.com/docs/workflows/reminders) and [Dex AI Assist](https://getdex.com/docs/ai/ai-assist). Monica v4.1.2 is AGPLv3. Its release history includes a 2025 beta, and the maintainer described a planned rebuild in August 2026. Dex is proprietary and reports updates in its 2026 changelog. [Monica license](https://github.com/monicahq/monica/blob/v4.1.2/LICENSE.md) · [Releases](https://github.com/monicahq/monica/releases) · [Maintainer update](https://monicahq.com/en/blog/new-version-of-monica-in-2026/) · [Dex terms](https://getdex.com/termsofservice/) · [Dex changelog](https://getdex.com/docs/changelog/2026)

A small sample of Monica reports describes missing annual reminders, missing emails, and demand for relative recurrence. This supports the relevance of reliable dates in the category. Frequency, user behavior, pricing preference and demand for new SocialSync features remain unknown. [Monica #7975](https://github.com/monicahq/monica/issues/7975) · [#7902](https://github.com/monicahq/monica/issues/7902) · [#7846](https://github.com/monicahq/monica/issues/7846)
