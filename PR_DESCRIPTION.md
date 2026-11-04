## Description

Draft generation could auto-approve a template or ignore an event's FORCE_REVIEW override. Queue actions could report success without changing a row, and repeated edits could display old text. This change applies the full approval hierarchy, requires review for templates, validates event context, and restricts queue actions to eligible states with affected-row checks.

Approved drafts can now be edited or cancelled in the War Room; edits require renewed approval. Load/action errors are visible, failed edits retain text, and pending actions cannot be submitted twice. The UI labels approval accurately because no delivery worker exists. CI now runs on PRs to the actual default branch and on codex branches.

Addresses [#4](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/4). No open PRs existed to integrate; merged PR #3 is already in the base.

## Type of Change

- [x] Bug fix
- [x] Documentation update
- [x] CI trigger correction

## Validation

Personally run locally on Windows, Node 22.18.0 / npm 11.6.2:

- `cd frontend` then `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: pass; 102 tests across 11 files (baseline 45 across 6).
- Test-first failures reproduced policy, stale-write, repeated-edit, duplicate-action, and unhandled-error defects before implementation.
- `/review` integration journey passes with the actual page/BLoC/SDK and real Supabase query builder against mocked HTTP responses. Realtime is stubbed.
- Local Vite startup and HTTP requests to `/review` and `/src/main.tsx` succeed.
- Workflow YAML parsed and trigger/job structure checked; relative documentation links and `git diff --check` pass.

One parallel lint attempt raced a temporary Vite config file; standalone and final sequential checks pass. Existing build warnings remain: old Browserslist data, missing `/grid.svg`, chunk above 500 kB. Hosted CI results are separate from these local results.

## Compatibility and remaining limits

No dependency, schema, or public method signature changes. Templates now require review even under FORCE_AUTO; editing an approved message resets its approval. Existing queued drafts are unchanged. State guards are in the SDK, not database constraints, and do not detect concurrent edits within the same allowed state. Revert the implementation commits to roll back; no migration rollback is needed.

As requested, completion uses local evidence; live Supabase/Groq checks remain tracked in [#7](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7). Provider-key exposure [#5](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/5), dependency audit findings [#6](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/6), and recurring calendar defects [#8](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/8) remain open. This PR does not establish production readiness.

Details: [decision and evidence](docs/engineering-evidence.md), [approval policy](docs/automation_policy.md).

## Checklist

- [x] Self-review completed
- [x] Meaningful regression tests added
- [x] Documentation updated
- [x] Required local checks pass
- [ ] Required repository review and hosted CI before merge
