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

Next likely slice:

- Continue reviewing remaining shared-calendar launch gaps and choose the next UI/server workflow slice.
