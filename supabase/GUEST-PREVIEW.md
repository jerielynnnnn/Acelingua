# Guest preview and onboarding

Apply `migrations/202610130001_guest_preview_receipt.sql` to the existing Supabase project after the existing onboarding migrations. It adds one authenticated-only RPC and no tables, columns, deletions, or curriculum changes. This file is prepared locally; it is not automatically applied to the database.

The configured introduction remains a **preview**, not a completed curriculum lesson. Its quiz and practice results are retained in `auth.users.raw_user_meta_data.acelingua_preview_result`; account XP and coins remain zero. Temporary preview XP and coins are displayed separately. Full lessons continue to use the existing server-graded completion and reward RPCs. Guest scores never unlock lessons or grant account currency.

The transfer validates authentication, enrollment, published language/course/lesson membership, and first-lesson ordering. It locks the account row and retains its first receipt on retries. It clears pending signup metadata in the same transaction. The browser clears its preview only after RPC success. Account-bound browser previews cannot transfer to another user. No service-role key is needed.

Avatar setup opens before preview transfer. Transfer runs when the learner saves the avatar; a failure keeps the preview and displays a retryable error on that screen. Guest registration with an immediate session proceeds straight to setup. Direct registration retains its Get Started button and language selection step.

World's Start Learning action uses the selected destination's language directly, reusing safe course enrollment. Existing progress is retained, and an inactive enrollment can be reactivated without duplication. Visiting a country remains read-only.

Email signup embeds the pending preview and language in user metadata, so verification can resume in another browser. Google registration carries its intent locally, then checks whether the authenticated account already has enrollment before binding preview metadata. Existing Google accounts retain their setup. Google previews require returning to the initiating browser until the metadata is bound.

## Verification

Run `node --test tests/auth-onboarding.test.mjs tests/guest-onboarding.test.mjs tests/guest-preview.test.mjs tests/authenticated-lesson.test.mjs`, targeted ESLint, and `npm run build`.

With the migration applied and test accounts, check these browser journeys:

- Guest: landing Get Started → language → introduction → activities → quiz → phrase hunt → results → register → verification if enabled → avatar → dashboard. Refresh during activities; answer history should resume. Simulate an RPC failure; retry should retain the preview and never duplicate rewards.
- Returning learner: failed password shows an error; successful password or Google login opens dashboard. Continue Learning opens the most recently accessed active course, with saved lesson locks and existing profile rewards intact.
- Direct signup: registration success → Get Started (verify and sign in first if required) → language → avatar → dashboard, without a preview. Interrupt after language selection and after avatar persistence; sign-in should resume setup.
- Repeat onboarding in two tabs. Existing enrollment and course progress must remain unchanged. A receipt retry must retain the original saved result. Check an unauthenticated RPC call is denied and a non-enrolled or later lesson is rejected.

Automated tests use Supabase doubles; they do not substitute for live email/OAuth, database permissions, or transactional SQL verification.
