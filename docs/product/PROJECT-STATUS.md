# SocialSync delivery checkpoint

Reviewed November 19, 2026, Asia/Kolkata. The active milestone is reliable calendar dates, browser reminder compatibility, and repeatable maintenance checks. The linked repository is public. Its delivery Project is private.

[Milestone 1](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/milestone/1) · [Project 15](https://github.com/users/aaron-seq/projects/15) · [Product brief](PRODUCT.md) · [Gap audit](GAP-AUDIT.md) · [Trust boundaries](../security/THREAT-MODEL.md)

| Work | State and evidence |
| --- | --- |
| Draft approval and recoverable edits | Draft [PR #9](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/pull/9) at `331735d` is the parent of this delivery. Its published checks passed. Review and integration remain open. |
| Calendar recurrence and reminders | Continue on `codex/6-8-reliability` from `331735d`. The Calendar and reminder changes passed local fixtures and a Chromium walkthrough with simulated auth and data. [#8](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/8) · [#10](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/10) |
| Tooling and coverage | Dependency and CI maintenance is scoped to [#6](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/6). See the delivery PR and its Checks tab for the current head and coverage artifact. |
| Next work | Hosted Groq credential handling [#5](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/5), disposable live checks [#7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7), event actions [#11](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/11), form recovery [#12](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/12). |

## Verify and resume

1. Check `git status -sb`, `git worktree list`, and the open PRs. Review and integrate the draft-review parent before retargeting the continuation to the default branch. Keep both PRs in review until the owner accepts them.
2. From `frontend/`, run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, and `npm run build`. Confirm the hosted jobs and artifacts refer to the current PR head.
3. For the recurrence retest, set `TZ` before launching Node in each of UTC, Asia/Kolkata and America/Los_Angeles. Run `npm test -- src/utils/date-logic.test.ts src/bloc/events/events.bloc.test.ts src/pages/calendar.integration.test.tsx src/hooks/useReminders.test.ts`. These fixtures check calendar-day grouping, date details, recurrence boundaries and browser API failure.
4. For authenticated persistence, collect evidence with an authorized disposable project and synthetic identities as described in #7. The local browser walkthrough intercepted requests and did not exercise real Realtime, database policies, providers or OS notification delivery.

The Project uses Status, Priority, Horizon, Evidence, and Decision. Overview shows linked work, Execution filters Now, and Roadmap displays the sequence without dates. Treat each issue and its PR as one outcome. The milestone stays open through acceptance and integration. GitHub reports its default auto-close and status automation enabled. The CLI exposes no toggle and the browser attempt stopped at an input conflict. Keep work in review until acceptance and verify the workflow settings before using Done. [Project workflows](https://github.com/users/aaron-seq/projects/15/workflows)

Earlier agents mapped code and claims, ran the baseline, researched users and comparables, proposed two designs, and reproduced the ordinary gaps. The retry used separate calendar and tooling worktrees and a fresh reviewer for the integrated calendar and reminder changes. The primary agent verified the issue links, reviewed staged diffs and ran the combined checks. These delegated reviews do not represent independent human approval. [Engineering evidence](../engineering-evidence.md)
