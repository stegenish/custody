# Custody Calendar — Project Instructions

## Tech stack
- Next.js (App Router) with React
- pnpm for package management
- Jest for testing
- Styling: TBD (suggest Tailwind CSS)
- Data: localStorage initially, database later

## Responsive design
The app must work in desktop and mobile browsers.

## Shell usage
- Run PowerShell commands with profiles disabled when possible.

## Code guidelines
- Write and run tests incrementally (TDD) — tests should fail before implementing functionality. Use Jest.
- Prefer reasonably short functions.
- Avoid duplicated code.
- Prefer good variable and function/component names over comments. Use comments to explain concepts.

## Review process (after implementing 1–5 passing tests for a coherent concept)

### Phase 1: Look for errors and potential problems
Review the code for bugs. Follow the testing guidelines above.

### Phase 2: Refactor
This should not change behavior — run tests to verify.
- Factor out code duplication.
- Improve naming of concepts.
- Break up code into more manageable pieces.

### Commit after review
Git can help us retrace our steps if something goes wrong.

## Date handling
Use `new Date()` at runtime. For testing, inject dates via parameters rather than hardcoding.
