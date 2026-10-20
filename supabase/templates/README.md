# Registration confirmation email

In Supabase, open Authentication → Email → Templates → Confirm signup.

Subject: `Confirm your email — your ACELingua adventure awaits`

Paste the complete contents of `confirm-signup.html` into the email body and save.
The local file alone does not update the hosted Supabase template.

The template uses Supabase's `ConfirmationURL`, `Email`, and `SiteURL` variables.
Keep `ConfirmationURL` as the confirmation link; do not replace it with a dashboard link.

## Logo while developing on localhost

The template initially uses `{{ .SiteURL }}/logoace.png`, matching the app's
`public/logoace.png`. Email clients cannot fetch that file from your localhost.

To display the logo without buying a domain:

1. Create a public Supabase Storage bucket for public brand images, such as `brand`.
2. Upload `public/logoace.png` as `logoace.png` using the Supabase dashboard.
3. Copy its public HTTPS URL and replace only the image's `src` in the template.
4. Paste the updated template into Supabase and send a test confirmation email.

Do not use an expiring signed URL or a local filesystem path for the logo.
Once the website is deployed with a public HTTPS Site URL, the original logo
source can also work. No custom domain is required for Supabase Storage hosting.

## Password reset

The login page's **Forgot password?** link opens `/forgot-password`. The user
requests an email, follows the recovery link, then chooses a new password at
`/reset-password`. Successful updates sign out the local session and offer login.

In Supabase Authentication ? Email ? Templates ? Reset password:

- Subject: `Reset your ACELingua password`
- Body: paste the complete contents of `reset-password.html`.
- Replace the logo URL as described above.

The recovery template uses `{{ .SiteURL }}/auth/recovery?token_hash={{ .TokenHash }}`.
The server verifies it specifically as a recovery token before opening the form.
This supports opening the email in another browser without the original PKCE verifier.

Set the Supabase **Site URL** to the running app, currently `http://localhost:3000`.
Add `http://localhost:3000/auth/callback?next=/reset-password` to the allowed redirect
URLs. Add equivalent HTTPS URLs and update Site URL when deploying. Localhost links
work only on the computer running the app. The callback also supports the default
Supabase reset template with `ConfirmationURL` when opened in the requesting browser.

SMTP must be saved and working for delivery. No database migration is needed.
Test a real request manually: email arrives, link opens the password form, mismatched
passwords are rejected, a valid change permits login with the new password, and an
expired/used recovery link offers a new request. Do not commit passwords or reset tokens.
