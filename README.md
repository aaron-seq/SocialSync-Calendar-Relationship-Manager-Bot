# SocialSync

SocialSync helps individuals keep track of contacts, relationship health, and recurring occasions, then prepare messages to review before sending.

## What works

- Create, edit, search, and delete contacts stored in Supabase.
- Record events and view recurring occasions on their local calendar dates. A monthly event on the 31st uses the last day of a shorter month and returns to the 31st when possible.
- Generate check-in drafts from Contacts or the Dashboard using Groq, with built-in templates when Groq is unavailable.
- Review, edit, approve, and cancel drafts in the War Room. Templates require review; editing an approved draft requires a fresh approval.
- View relationship health estimates and enable reminders on supported browsers while the app is open. Use Settings or the notification bell to grant permission.

**Current limits:** approval records queue state; this repository has no delivery worker or messaging-provider integration. Event-driven generation is available through the SDK, but no cron job invokes it. Anonymous sessions are tied to one browser; cross-device account sign-in is not implemented. The service worker caches some assets, but database access still requires connectivity.

## Local setup

Use Node.js 22.13 or later on the Node 22 line, npm 10 or later, Git, and a Supabase project. CI uses Node.js 22.

```sh
git clone https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot.git
cd SocialSync-Calendar-Relationship-Manager-Bot/frontend
npm ci
```

1. Run [database/schema.sql](database/schema.sql) once against a **new** Supabase project. It creates tables, RLS policies, and Realtime publication entries; it is not a repeatable migration script.
2. Enable **Anonymous sign-ins** in Supabase Authentication. Each browser receives its own user ID for RLS.
3. Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's public client credentials. Never use a service-role key.
4. Optionally set `VITE_GROQ_API_KEY` for personal local use. [Vite exposes `VITE_` values in browser bundles](https://vite.dev/guide/env-and-mode#env-variables); server-side key handling is required before public deployment ([issue #5](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/5)).

```sh
npm run dev
```

Open the URL printed by Vite (default `http://localhost:3000`). Without Supabase credentials the app displays **Connect your database**. A configured app signs in anonymously before loading contacts. These live service steps were not verified in the latest local run; see [validation evidence](docs/engineering-evidence.md).

## Try the review workflow

Create a contact, select **Generate Draft** from Contacts or use the Dashboard, then open **War Room**. Review the message and its rationale. **Approve** moves it to **Approved**; **Edit** returns it to review, and **Cancel draft** removes it from the pending queue. If a save fails, the editor preserves the text so you can retry. Approval does not send a message.

The SDK's optional `eventId` applies event overrides, contact policy, and significance in that order. Templates always require review. See [automation policy](docs/automation_policy.md) for the exact rules.

## Checks

Run from `frontend/`:

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Tests use jsdom and mocked external services. Verify live Supabase row-level security, Realtime, and provider behavior separately. CI publishes the coverage report as a GitHub Actions artifact. [Live validation](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/7) · [Dependency checks](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues/6)

## Reference

- [Architecture](frontend/docs/architecture.md) · [SDK API](frontend/docs/api-reference.md)
- [Engineering decisions and validation](docs/engineering-evidence.md)
- [Product brief and roadmap](docs/product/PRODUCT.md) · [Claims and research](docs/product/GAP-AUDIT.md) · [Trust boundaries](docs/security/THREAT-MODEL.md) · [Delivery checkpoint](docs/product/PROJECT-STATUS.md)
- [Contributing](CONTRIBUTING.md) · [Open issues](https://github.com/aaron-seq/SocialSync-Calendar-Relationship-Manager-Bot/issues)

MIT licensed; see [LICENSE](LICENSE).
