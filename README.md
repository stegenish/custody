# Custody Calendar

A Next.js custody calendar for a two-parent shared schedule workflow. The app can run in local-only mode without Supabase, or shared mode when Supabase environment variables are configured.

## Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` for local shared-mode development.

Required for shared mode:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Required for notification emails:

```bash
RESEND_API_KEY=
EMAIL_FROM=Custody Calendar <calendar@example.com>
```

`NEXT_PUBLIC_SITE_URL` is used in notification links. If `RESEND_API_KEY` or `EMAIL_FROM` is missing, proposal notification emails are skipped and the calendar workflow still completes.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
