# Remove Demo Data and Enforce Supabase Connection

## 🚀 Enhancements

- **Removed Demo Data:** Completely removed the `demo-data.service.ts` and all mock data seeding mechanisms. The application now strictly relies on real data from the database.
- **Enforced Security:** Updated `supabase.service.ts` to throw an explicit error if Supabase credentials are missing, preventing accidental usage of unsecured or mock modes.
- **Cleaned Up Storage:** Removed `storage.service.ts` which was used for local storage of demo data.
- **Type Safety:** Resolved type definition errors and fixed build issues in `messages.bloc.ts` and tests.

## 🛠️ Tech Stack Changes

- **Supabase Integration:** The valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must now be present in the `.env` file for the application to start.
- **Frontend Logic:**
  - `ContactsSDK` and `MessagesSDK` now interface directly with Supabase.
  - Updated `contacts.bloc.test.ts` to use correct import paths.
  - Removed obsolete `drafts.bloc.test.ts` that tested deleted functionality.

## 🧪 Verification

- **Manual Verification:** Verified that the application loads at `http://localhost:5173` without "Using Demo Mode" warnings.
- **Automated Tests:** `npm run typecheck` passes successfully.

> [!IMPORTANT]
> This PR removes the "Easy Start" demo mode. Developers must have a valid `.env` file to run the project. Use `.env.example` as a template.
