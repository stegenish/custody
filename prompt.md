# Custody Calendar

## Overview
A calendar app to help organize children's schedules as they move between separated parents. The core challenge is forecasting which parent has the kids in any given week, since calculating alternating custody by hand is error-prone.

## Tech & approach
- React / Next.js project, managed with pnpm
- Must work in desktop and mobile browsers
- Data stored in localStorage (database support planned for later)
- Built step by step — each step verified before moving on

## Calendar display
- Poster/wall-calendar style: all months visible at once in a grid
- Show 3 months in the past and 12 months in the future (15 months total)
- Weeks are the primary visual unit; date numbers are de-emphasized
- ISO week numbers are displayed (e.g., "W14")
- Today is clearly marked

## Schedules
A schedule is a coloring rule defined by:
- A **start date**
- A **cycle length** (1, 2, or 3 weeks)

From the start date, weeks alternate between two customizable, labeled colors (e.g., green = "Mom", yellow = "Dad"). The user can rename the labels and change the colors.

### Multiple schedules
The calendar can contain multiple schedules. They are ordered by start date. Each schedule runs from its start date until the start of the next schedule (or indefinitely if it's the last one).

**Example**: Schedule A starts Jan 1 (2-week cycle). Schedule B starts Feb 1 (3-week cycle). Schedule A colors Jan 1–Jan 31. Schedule B colors Feb 1 onward.

### Deleting a schedule
When a schedule is deleted, the previous schedule extends forward to fill the gap — its alternating pattern continues as if the deleted schedule never existed.

**Example**: If Schedule B (Feb 1) is deleted, Schedule A (Jan 1) now continues its 2-week alternation from Feb 1 onward, picking up where the pattern would naturally fall.

### Day-level overrides
Individual days can be recolored without affecting the rest of the schedule. Override colors are chosen from the defined label colors. Overrides persist even if the underlying schedule changes.

## Suggestions welcome
If you find possible functional improvements during development, suggest them for consideration.
