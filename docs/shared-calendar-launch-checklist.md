# Shared Calendar Launch Checklist

Use this checklist before enabling shared-calendar mode in production.

## Vercel

- Create the Vercel project from this repository.
- Set production environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `RESEND_API_KEY`
  - `NOTIFICATION_EMAIL_FROM`
- Set `INITIAL_PARENT_EMAIL` only if the initial admin should differ from `thomas.stegen@gmail.com`.
- Deploy and confirm `NEXT_PUBLIC_SITE_URL` exactly matches the production origin.

## Supabase

- Apply `supabase/migrations/20260515190000_shared_calendar.sql`.
- Enable Google as the only auth provider for the first release.
- Add auth redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `${NEXT_PUBLIC_SITE_URL}/auth/callback`
- Confirm row-level security is enabled on all shared-calendar tables.
- Confirm the first login as `thomas.stegen@gmail.com` can create the initial group.

## Google OAuth

- Configure the Google OAuth client with the Supabase callback URL from the Supabase auth provider settings.
- Keep Apple login disabled for the first release.

## Email

- Verify the Resend sending domain or approved sender used by `NOTIFICATION_EMAIL_FROM`.
- Send a test notification from the app after deployment.
- Confirm notification links open `${NEXT_PUBLIC_SITE_URL}/`.

## Smoke Test

- Sign in as Thomas and create the custody group.
- Create an invite link and open it in a separate browser/profile.
- Sign in as the second parent and accept the invite.
- Create a draft proposal, add a draft comment, send it, counter it, add an active comment, accept it, and optionally promote comments to shared notes.
- Confirm stale accept/reject/counter/withdraw forms fail safely after another revision is created.
- Confirm both parents can add shared date notes, and only the author can edit/delete each note.
- Confirm public holidays and Bodø school holiday markers appear in the visible calendar.
