# Privacy and terms

The sign-up form requires an unchecked agreement checkbox before account creation. `/terms` and `/privacy` are public routes, including for signed-out visitors. Links in the agreement open in another tab so entered form data is preserved.

Checking the agreement opens a confirmation dialog. Only Accept checks the form's box; Cancel and Escape leave it unchecked. The first-time Google flow includes the required agreement in its account-creation confirmation. See [confirmation dialogs](confirmation-dialogs.md) for the shared behavior and tests.

Email registration and creation of a new Google account require the literal JSON boolean `acceptedPolicies: true`. Missing, false, string, and numeric values are rejected before creating an account or session. Existing users can continue signing in. A new Google user arriving through `/login` is shown an agreement dialog before their account is created.

The backend records `policyVersion` and `policiesAcceptedAt` on new users. It generates both values itself and excludes them from API responses. Existing and seeded accounts are left without acceptance records; do not backfill a consent date on their behalf.

The initial version is `2026-10-20`. When updating either policy, update the effective date in `frontend/src/pages/legal/PolicyPage.jsx` and `POLICY_VERSION` in `backend/src/lib/policies.js` together. Requiring existing users to accept a later version would need a separate flow.

The policy text describes the current implementation, including public profile activity, direct image links, and café suggestions that remain after account deletion. The contact address supplied by the project owner is `webiverselabs@gmail.com`. Privacy rights are summarized from the [National Privacy Commission's data subject rights guide](https://privacy.gov.ph/data-subject-rights/). Before publishing, the project owner should review the text and confirm the service operator details and provider/backup retention practices. These details are not invented in the app.

`backend/scripts/smoke.mjs` and `backend/scripts/smoke_google.mjs` check acceptance enforcement, server-generated records, and normal login behavior. Run these write-based tests only against a separately seeded, throwaway database.
