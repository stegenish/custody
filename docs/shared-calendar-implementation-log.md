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

Next likely slice:

- Add direct tests around the server actions for note/comment update/delete form parsing.
- Continue proposal comment carry-forward/promotion behavior from the design plan.
