# Draft review safety: decisions and evidence

## Calendar and tooling continuation

November 19, 2026, Asia/Kolkata. Parent `331735d` passed a locked install, lint, typecheck, 102 tests and production build on Windows with Node 22.18.0 and npm 11.6.2. Its audit recorded 34 affected entries (3 critical, 15 high, 15 moderate, 1 low) and 3 high entries with `--omit=dev`. The hosted result for the parent belongs to [PR #9](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/actions/runs/41802253473).

| Requirement | Red and green evidence | Boundary |
| --- | --- | --- |
| FR-01, [#8](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/8) | Same 24 tests before/after. Before: 12 failures in UTC, 13 in Kolkata, 16 in Los Angeles. After: 24 passed in each zone. Test paths and command are in the [checkpoint](product/PROJECT-STATUS.md). | Weekly and monthly offsets derive from the original anchor. Annual back-projection and March 1 non-leap rollover retain prior behavior. The two designs agreed on the existing utility and BLoC. The fresh review found that Timeline also needed local-date grouping. |
| FR-02, [#10](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/10) | `npm test -- src/hooks/useReminders.test.ts` reproduced the unsupported API crash and auto-prompt. A separate Red run reproduced the constructor failure with granted permission. All 4 pass after the fixes. | The hook checks for browser support and granted permission. It catches delivery failures at the constructor. Existing user-activated controls request permission. |
| Browser walkthrough | Fresh reviewer exercised the real Vite app with Playwright Chromium 156.0.8078.4 at `92ff79d`, fixed clock July 25, 2026, and intercepted HTTP/WebSocket. Five contexts passed across Los Angeles and Kolkata. The reviewer opened a long-lived weekly event grouped with a one-time date under Today and checked its detail date and Settings. | Synthetic Auth and REST data. The reviewer simulated missing, granted, throwing and default permission cases. The walkthrough established page behavior and prompt timing. Real OS delivery and live data were outside this check. |
| Ordinary gaps | Fresh verifier reproduced Calendar's false delete success and premature form close and optional field retention against synthetic HTTP and callbacks. [#11](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/11) · [#12](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/12) | Deferred to distinct issues so a recurrence change does not silently choose series deletion or API write semantics. |

The dependency design retained Vite 6 and moved Vitest and its coverage provider together to 4.1.12. It resolves the TypeScript ESLint minimatch path through upstream 8.73.0. The migration uses explicit application-source inclusion because Vitest 4 defaults coverage to executed files. The CI job stores coverage with GitHub Actions. Review its artifact on the continuation PR. [Vite release](https://github.com/vitejs/vite/releases/tag/v6.4.6) · [Vitest 4 migration](https://v4.vitest.dev/guide/migration.html) · [TypeScript ESLint release](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.73.0)

The first Rollup binary selected by npm (4.68.7) was blocked by this Windows host's Application Control policy. The existing Vite range accepts patched 4.59.1, which the implementer verified with a clean install, full suite, coverage, build and loopback startup. The fix is recorded in the lockfile. Full and production-only npm audit JSON both reported 0 affected entries on November 19. This measures the registry report for that lock. The updated lock removes the old Vitest dependency chains and keeps 419 entries compared with 502 before. [Rollup advisory and patched range](https://github.com/advisories/GHSA-mw96-cpmx-2vgc)

Production-only baseline affected Router 7.12.0 and its React Router path, and Supabase Realtime's shared `ws` dependency. The compatibility decision comes from the installed tree and upstream release notes. Realtime prefers the browser's native WebSocket where available. The affected dev paths included Vite and Vitest server/tooling packages. The audit does not establish exposure in the shipped UI or the runtime server mode. [Router release](https://github.com/remix-run/react-router/releases/tag/react-router%407.18.6) · [Vitest advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8)

The calendar fix touches six source and test files, browser compatibility touches three, and the tooling slice touches four files including CI and the lock. Across the three slices there are zero new direct dependencies, schemas or services. The hosted jobs use Node 22 and read-only repository permissions. Reviewers checked behavior, source and CI metadata as delegated agents.

At integrated code revision `85cc07b`, the primary agent ran `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage -- --reporter=dot`, and `npm run build` from `frontend/` on Windows Node 22.18.0 and npm 11.6.2. All commands exited 0. V8 produced 45.49% application line coverage with 127 tests across 14 files. The tooling implementer also verified clean install, tests, coverage, build and loopback startup on Ubuntu under WSL before integration. The build still warns about the unresolved `/grid.svg` asset and the main chunk size.

The current scope has no schema or provider changes. Reverting the related change commit rolls back behavior or tooling without a data migration. GitHub reports private vulnerability reporting disabled, Dependabot alerts disabled, and code scanning without analysis. Dedicated local SAST and history secret scanners were unavailable. Confidential candidates remain in access-restricted local notes pending authorized verification. The public ledger does not carry their details.

The remainder records the previous draft-review delivery.

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
