# Draft review safety: decisions and evidence

Local review on 4 November 2026 (Asia/Kolkata). Baseline: [`6524acc`](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/commit/6524acc9219712513033b93daaf1956c033a2128), the clean checkout of the remote default branch `feature/production-readiness`. Working branch: `codex/draft-review-safety`. No applicable repository `AGENTS.md` was found; the supplied document preferences and contribution guidance were followed.

## Scope and worklist

The bounded milestone is [issue #4](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/4): reliable draft generation/approval and recoverable War Room actions. No new services, costs, dependencies, schema changes, delivery automation, or performance claims are introduced.

| Item | Evidence | Benefit | Acceptance | Effort, risk, dependencies |
| --- | --- | --- | --- | --- |
| P1: Review policy and context | SDK ignored event overrides, silently lost event lookup errors, and auto-approved templates | Users retain control of what is approved | All 27 policy combinations; templates/incomplete context require review; failed context cannot save | Small frontend change; intentional stricter template approval; implemented |
| P1: Queue transitions and recovery | Nonexistent IDs returned success; terminal rows could change; repeated edits displayed stale text; rejected promises went unhandled | Accurate outcomes and editable/cancellable approvals | State-conditioned writes, affected-row check, renewed approval after edit, errors/retry, retained text, duplicate-action guard | Small frontend change; same-state concurrent edits still lack version checks; implemented |
| P2: CI trigger coverage | PR filter only matched `main`; remote default is `feature/production-readiness`, and pushes excluded `codex/**` | Reviewers receive existing checks for this branch | Run unchanged jobs on PRs to any base and pushes to `codex/**` | Two-line workflow adjustment; YAML parsed locally; hosted result reported separately |
| P1: Provider credentials | Existing browser Groq call and prior PR disclosure | Avoid provider-key exposure when hosted | Authenticated server boundary, ownership checks, secret-free build, failure tests | Separate endpoint/deployment design and disposable service validation; [#5](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/5) |
| P1: Dependency advisories | `npm audit`: 34 affected packages, including 3 critical | Reduce applicable dependency risks | Patched compatible tools, supported runtime, clean install/checks, residual-risk assessment | Major tooling migration suggested by audit; kept separate from business logic; [#6](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/6) |
| P2: Live integration evidence | No Supabase credentials configured in this workspace | Establish deployed RLS and Realtime behavior | Two users, persisted lifecycle, cross-user denials, concurrent updates and tab refresh | Requires disposable project; [#7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7) |
| P2: Recurring calendar | Actual utility probe returned zero weekly events from a 2000 anchor in 2026, excluded range endpoint, shifted Jan 31 to Mar 28 | Avoid missing recurring occasions | Boundary, anchor, long-lived schedule, and timezone regressions | Calendar semantics/occurrence scheduling need their own milestone; [#8](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/8) |

GitHub search found no open issues or PRs before this work. Closed PRs #1–#3 were inspected for history; #3 is already in the baseline. There were no open changes to integrate or attribute. Prior PR claims of live testing were not treated as tests run in this review. Issues #4–#8 were actually posted after duplicate searches; they remain open.

## Decision note

**Cause:** draft generation duplicated only one branch of the documented policy; event fields were partly left in database naming. Mutations checked only the error field, leaving successful zero-row updates indistinguishable from real changes. Local edited state omitted `editedContent`.

**Options:** retain current behavior; patch only the event override condition; centralize the existing hierarchy in a pure helper and guard queue transitions in the SDK; or add a database RPC/state machine. Retaining/patching one condition leaves demonstrated failures. A database state machine offers stronger enforcement but requires migration, live database validation, and a decision about future delivery-worker behavior.

**Selected:** a pure policy helper, complete event mapping, and one conditional update per action with `.select('id')` and exactly-one-row verification. Keep signatures and statuses compatible. Templates/missing provenance always require review, including FORCE_AUTO; edits reset approval. This intentionally tightens behavior without reclassifying existing rows. Expose edit/cancel for approved drafts and label state as **Approved**, since delivery is absent. No measurable speedup is claimed.

**Limits/rollback:** guards protect SDK callers, not direct database writes. State filters prevent changes to terminal/ineligible rows but do not detect competing edits within an allowed state. Event scheduling retains the stored date; no recurrence-time selection was added. Reverting the implementation commit restores prior SDK/UI behavior; no migration rollback is needed. Previously created queue entries remain unchanged.

Research checked against installed `@supabase/supabase-js` 2.90.1 and Vite 6.4.1:

- [Supabase update](https://supabase.com/docs/reference/javascript/update): updated rows require `.select()` after filters. Using an array result lets the SDK verify exactly one match without treating an empty result as success.
- [Vite environment variables](https://vite.dev/guide/env-and-mode#env-variables): `VITE_` variables are public client data; the existing provider-key design remains a deployment limitation.
- Primary upstream [Vitest advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp) and [Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583) were checked for exposure conditions. Registry audit and upstream version ranges can differ; #6 requires full version/applicability reconciliation before choosing upgrades.
- [GitHub workflow branch filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpull_requestpull_request_targetbranchesbranches-ignore) apply to PR target branches. Removing the stale PR filter avoids tying checks to the old default; adding `codex/**` to the existing push filter covers this delivery branch. Adding only the current default to the PR filter was rejected because future base-branch changes would recreate the gap. Jobs and their required checks are unchanged.

## Commands and observed results

Environment: Windows, Node 22.18.0, npm 11.6.2; npm lockfile unchanged. Locked React 19.2.3, Vitest/coverage 2.1.9, TypeScript 5.7.3, ESLint 9.39.2. CI uses Node 20; this review did not run Node 20 locally.

All npm commands below run from `frontend/`:

| Command | Baseline | Final local result |
| --- | --- | --- |
| `npm ci` | Installed 409 packages | Same dependency tree; no dependency changes |
| `npm run lint` | Pass | Pass when run alone |
| `npm run typecheck` | Pass | Pass |
| `npm test` | 45 tests / 6 files pass | 102 tests / 11 files pass |
| `npm run build` | Pass | Pass |
| `npm audit` | 34 affected packages: 1 low, 15 moderate, 15 high, 3 critical | Unchanged dependencies; unresolved in #6 |

Test-first evidence:

- `npm test -- src/services/messagesSDK.test.ts`: **26 failed / 18 passed** before the SDK fix, then **44 passed**. Failures were wrong policy/status/context and falsely successful writes, not import or fixture errors.
- `npm test -- src/pages/review-queue.test.tsx src/components/draft-card.test.tsx src/utils/automation-policy.test.ts`: **7 failed / 7 passed** before UI changes; reproduced missing actions, unhandled rejections, hidden load errors, and duplicate approval.
- `npm test -- src/bloc/messages/messages.bloc.test.ts`: failed on old edited text/status before the BLoC fix, then passed.
- `npm test -- src/pages/review-queue.integration.test.tsx`: passes `/review` → actual page → BLoC → MessagesSDK → real Supabase HTTP query builder using disposable mocked responses. Journey: approve, edit twice, reapprove, cancel. Realtime is stubbed; this is a jsdom integration test, not a browser/live-service test.

One concurrent final lint attempt raced Vitest's temporary `vitest.config.ts.timestamp-*.mjs` creation/removal and failed with ENOENT. Standalone lint passed after test/build completion. CI jobs run in separate workspaces. No lint rule or assertion was suppressed.

Startup smoke: `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --open false` reported ready. PowerShell `Invoke-WebRequest http://127.0.0.1:4173/review` returned HTTP 200 with the root element and `/src/main.tsx`; that entry also returned HTTP 200 and contained `createRoot`. This establishes serving/transformation, not rendered-browser or authenticated service behavior.

Build warning categories were present before and after: old Browserslist data, missing `/grid.svg`, and a JavaScript chunk above 500 kB. No warning threshold was changed. `git diff --check` passed. README examples and repository-relative links were checked against actual scripts/files; Supabase setup instructions were inspected against code/schema but could not be exercised without credentials.

## Remaining validation

Live Supabase RLS, persistence after reload, Realtime, multi-client races, and actual Groq generation were not run. The user selected completion with local evidence and tracked live checks. No deployment, recovery/scale test, production security audit, real message delivery, browser visual/accessibility audit, or performance benchmark was performed. The app's missing-credentials setup and the HTTP smoke do not prove those integrations. Follow #5–#8 before expanding the relevant deployment or feature scope.
