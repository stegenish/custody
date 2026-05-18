# Shared Calendar Implementation Log

This file tracks implementation progress for `docs/shared-calendar-design.md`.

## 2026-05-16

Completed:

- Added calendar cell indicators for shared date notes and proposal comments.
- Passed note/comment date-key sets through `MonthGrid`, `CalendarGrid`, `CalendarWorkspace`, and `ProposalWorkspace`.
- Wired `SharedCalendarApp` so agreed calendar notes and active proposal comments produce visible date indicators.
- Added tests for month/grid rendering, proposal workspace forwarding, and app-level state wiring.
- Added selected-date details for shared date notes and proposal comments.
- Kept plain read-only calendars non-interactive unless there is date detail content to show.
- Added create forms for shared date notes and active proposal comments.
- Added server actions that write shared date notes and proposal comments through Supabase RPCs.

Current state:

- Notes and proposal comments can be represented visually on calendar dates.
- Selecting a date can show note/comment details outside the calendar cell.
- New shared date notes and active proposal comments can be submitted from selected dates.
- Existing shared date notes and active proposal comments show edit/delete forms only to the parent who created them.
- Shared note and proposal comment update/delete server actions are wired through the shared app entry point.
- Added direct server action tests for shared note and proposal comment update/delete form parsing.
- Added an accept-time option to promote active, non-deleted proposal comments into shared date notes.
- Added provider-agnostic email notification builders for proposal sent, countered, accepted, rejected, and comment-added events.
- Wired proposal/comment server actions to send notification emails for sent, countered, accepted, rejected, and comment-added events.
- Added tests for the Resend email delivery adapter and documented the required notification email environment variables.
- Added invite-link controls for the invite admin while the second parent has not joined, wired to the invite regeneration server action.
- Added no-referrer metadata to invite and login pages so private invite tokens in URLs are not leaked by browser referrers.
- Added direct invite server-action tests and stopped unauthenticated invite acceptance from continuing after redirecting to login.
- Blocked stale proposal comment submissions when the active proposal is no longer present before writing or notifying.
- Added selected-date agreed/proposed custody details for changed proposal dates.
- Hardened proposal comment database policies and RPCs so new comments can only be added to draft or sent proposals while existing author-owned comments remain editable after status changes.
- Show carried proposal comments on restored draft proposals, including date indicators and author edit/delete controls.
- Added new proposal comment creation from draft proposals without sending active-proposal notification emails.
- Added a shared-calendar launch checklist for Vercel, Supabase, Google OAuth, email, and production smoke testing.
- Added friendly invalid/full/used invite acceptance feedback and a copy control for generated invite links.
- Added proposal conflict feedback so stale or no-longer-available proposal actions reload the calendar with a friendly review-before-retry message.
- Added active proposal discard support so a sender can remove a pending proposal without restoring it as a draft, while preserving withdrawn history.
- Made date-key formatting/parsing explicitly use Europe/Oslo semantics and documented the Bodø school holiday data freshness boundary.
- Added migration-level audit checks that proposal lifecycle RPCs record status events for sent, withdrawn, rejected, countered, and accepted transitions.
- Added browser-local personal label preferences for existing labels in the shared app, keeping personal names/colors out of proposal save payloads.

Current remaining work:

- No known implementation items remain from `docs/shared-calendar-design.md`.
- Production setup still needs the external checklist in `docs/shared-calendar-launch-checklist.md`: Supabase project/migration, Google OAuth, Vercel environment variables, Resend, and smoke testing.

## 2026-05-18

Completed:

- Evaluated and implemented validated findings from `docs/multi-agent-review-2026-05-18.md`.
- Hardened proposal mutation error handling, schedule-data validation, personal label preference parsing, ISO week handling, and SQL draft-comment ownership checks.
- Extracted shared helpers for form actions, hidden fields, search params, dated item keys, and personal label preferences.
- Made shared vs personal label editing explicit in `ScheduleEditor`.
- Reduced proposal calendar color-map recomputation by passing precomputed maps through the proposal workspace.
- Improved calendar accessibility with date jumping, richer screen-reader status text, modal override-bar behavior, accept-comment helper text, and a labelled calendar region.
- Moved invite OAuth flow to a pending-invite cookie so Google/Supabase redirects no longer carry raw private invite tokens.
- Added localStorage corruption warnings, Bodø school-holiday data expiry warnings, and least-surprise comments for dormant/spec and structural-shim code.
- Tightened selected tests and removed the trivial CalendarGrid container assertion.
