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

Current state:

- Notes and proposal comments can be represented visually on calendar dates.
- Selecting a date can show note/comment details outside the calendar cell.
- Note/comment detail editing controls are still pending.
- Server repository functions for note/comment CRUD already exist, but server actions and UI forms are still pending.

Next likely slice:

- Add server actions and forms for creating shared notes and proposal comments.
- Add author-only edit/delete controls after create/read flows are in place.
