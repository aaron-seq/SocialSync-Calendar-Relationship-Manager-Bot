# SocialSync

React 19 + Vite + TypeScript PWA on Supabase. All app code is in `frontend/`.

## Commands

Run from `frontend/`:

```
npm ci             # install (lockfile is authoritative)
npm run dev        # vite dev server
npm run lint       # eslint 9 flat config, --max-warnings 0
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # tsc && vite build
```

CI runs lint, typecheck, test, and build. All four must pass.

## Architecture

Layered, one direction only: `pages` → `bloc` → `services` → Supabase.

- `src/bloc/` — state. Custom hook-based BLoC, one per domain (contacts, events, messages).
- `src/services/` — the only place that touches Supabase or the network. `*SDK.ts` files wrap tables; `llm.service.ts` talks to Ollama.
- `src/utils/` — pure functions, no I/O. `relationship-math.ts` holds the health-score and ghosting-risk formulas.
- `src/components/` — presentational. No data fetching.

Components must not import from `services/`. Go through a bloc.

## Conventions

- Import with the `@/` alias, not relative paths that climb (`../../`).
- `date-fns` for all date math. Never construct dates by string slicing.
- Log through `@/lib/logger`, never bare `console.*`.
- Tests live beside the file (`foo.test.ts`) or under `src/__tests__/`. Both patterns exist; either is fine.

## Gotchas

- `llm.service.ts` falls back to hardcoded templates when Ollama is unreachable, and returns `success: true` when it does. Check `modelUsed === 'fallback-template'` to tell a real generation from a fallback.
- The health score in `relationship-math.ts` is a decay curve tuned by hand. Changing the constants changes every contact's displayed score — update the tests in the same commit.
- Supabase Row Level Security is defined in `database/schema.sql`, not in app code. A query that returns empty is usually an RLS policy, not a bug in the SDK layer.
