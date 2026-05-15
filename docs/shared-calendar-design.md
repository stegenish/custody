# Shared Calendar Design

This document records the agreed product and architecture decisions for turning the current local custody calendar into a two-parent shared app.

## Product Scope

- The app starts with one custody group only.
- A custody group has exactly two parents.
- All children in the custody group share the same schedule.
- Keep the implementation aware of a future multi-group model, but do not build multi-group UI in the first version.
- `thomas.stegen@gmail.com` is allowed by default from the beginning and acts as the initial/admin parent.
- Thomas has extra admin permissions only for invite management.
- Both parents have equal permissions for calendar schedule/proposal behavior.

## Hosting, Auth, And Backend

- Host the Next.js app on Vercel's free/Hobby tier.
- Use Supabase for Google login, database storage, and shared state.
- Use Google login only for the first version.
- Apple login is deferred. It is possible later, but Sign in with Apple web setup adds Apple Developer Program overhead and likely annual cost.
- The current `localStorage` model should move to Supabase/Postgres for shared calendar data.
- Keep private display preferences, such as label names/colors, separate from agreed schedule data where practical.

Sources checked during planning:

- Vercel limits: https://vercel.com/docs/limits/overview
- Vercel Functions limits: https://vercel.com/docs/functions/limitations/
- Supabase pricing/auth limits: https://supabase.com/pricing
- Apple Developer Program membership: https://developer.apple.com/programs/whats-included/
- Sign in with Apple web configuration: https://developer-mdn.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web

## Parent Invitation Flow

- The first parent/admin can create a private invite link for the second parent.
- The invite link is reusable until the second parent successfully joins.
- Once the second parent joins, the group is full and the invite becomes invalid.
- Thomas can regenerate the invite link.
- Removing/reinviting the second parent is restricted to Thomas/admin for now.

## Calendar Model

- The shared agreed calendar is the source of truth.
- Each parent can have a private draft proposal layered on top of the shared calendar.
- Editing a draft should feel similar to editing the current calendar.
- Custody dates and schedule rules always change through proposals.
- Direct edits to shared custody schedule/override data are not allowed outside the proposal workflow.
- Shared date notes are separate and can be edited directly without proposal approval.
- Dates and schedules are always interpreted as Norway local dates, using Europe/Oslo semantics rather than the user's device timezone.

## Proposals

- Only one sent/active proposal exists for the custody group at a time.
- Each parent can have at most one private draft proposal.
- A draft starts from the shared agreed calendar and persists across sessions.
- If the shared agreed calendar changes, all drafts are cleared.
- A proposal stores a complete proposed calendar model, not a list of operations.
- Accepting a proposal replaces the shared calendar model with the accepted proposed model.
- Proposals can change both:
  - underlying repeating schedule rules
  - day-level overrides
- Swaps, vacations, and special cases are represented as day-level overrides unless the user explicitly changes the underlying schedule rules.
- Parent labels/colors can be personal display preferences and should not require agreement.

## Proposal Lifecycle

Use these states:

- `draft`: private to the author.
- `sent`: visible to both parents and awaiting receiver action.
- `withdrawn`: sender pulled it back for editing; it disappears from the receiver's normal pending view.
- `rejected`: receiver declined it; it remains available to the sender as an editable draft.
- `countered`: receiver edited it and sent a new revision back; proposal ownership flips.
- `accepted`: accepted by the other parent and applied to the shared calendar.

Rules:

- Proposals are accepted/rejected as one package.
- The receiver can edit a sent proposal; this creates a new revision owned by the countering parent.
- Normal UI shows only the latest revision.
- Older revisions are kept internally for audit/history.
- Sender can withdraw, edit, and resend while pending.
- Sender can reset/discard the proposal at any time.
- When a proposal is accepted, the shared calendar changes and all drafts/proposals are cleared.
- Acceptance by the other parent is enough to update the shared calendar.

## Version Safety

- Acceptance must be version-safe.
- The receiver must accept the exact proposal revision they viewed.
- If the sender edits/resends while the receiver has an older revision open, the app must block acceptance and require the receiver to reload/review the new revision.
- Proposal revisions should therefore have immutable revision IDs or version numbers.
- Shared calendar records should also have a version so stale proposals can be detected and cleared if the shared calendar changes.

## Proposal Review UI

- Review should show the full resulting calendar.
- Changed visible dates should be visually distinguished.
- The app currently shows 3 months in the past and 12 months in the future; changed dates in this whole visible 15-month range should be discoverable.
- Avoid making long-running repeating schedule changes visually overwhelming.
- A reasonable first UI:
  - base/agreed colors remain normal or muted
  - dates changed by the proposal show proposed color plus a subtle marker, outline, tint, or similar indicator
  - selecting a changed date can show before/after details and related comments

## Comments

- Proposal comments are plain text only.
- Comments can be associated with any date, not only changed dates.
- Comments are discussion only and are not part of the accepted calendar model.
- Comments carry forward across proposal revisions.
- Comments can always be edited.
- Only the comment author can edit/delete their own comments.
- Deleted comments are soft-deleted internally and hidden from normal UI.
- Proposal comments can optionally be promoted into shared date notes when a proposal is accepted.
- Calendar cells should show indicators for comments, with details shown outside the cell when the date is selected.
- Email replies are not supported; notification emails should link back to the app.

## Shared Date Notes

- Shared date notes are permanent informational notes on dates in the agreed/shared calendar.
- Shared date notes do not require proposal approval.
- Either parent can create notes.
- Notes are tied to the parent who created them.
- Only the creator can edit/delete their own notes.
- Notes can be edited/deleted forever by their creator.
- Deleted notes are soft-deleted internally and hidden from normal UI.
- Keep notes forever; there are expected to be few.
- Calendar cells should show note indicators, with details shown outside the cell when the date is selected.
- Notes are plain text only.

## Audit And History

- Keep history internally for accountability/debugging.
- Store accepted, rejected, countered, withdrawn, and older proposal revisions internally.
- Do not build a visible proposal history screen in the first version.
- Withdrawn proposals disappear from the other parent's normal UI.
- Rejected proposals remain available to the sender as an editable draft.

## Email Notifications

Send email notifications for:

- proposal sent
- proposal countered
- proposal accepted
- proposal rejected
- comment added to an active proposal

Notifications should link back to the app. Email replies are not supported.

## Holidays

- Public holidays remain visible as informational calendar styling.
- The current app marks Norwegian public holidays plus Sundays.
- Add Bodø school holidays as informational markers.
- Bodø school holidays should be visible to both parents always.
- School holidays do not affect custody scheduling automatically.
- Public holiday and school holiday indicators should be visually distinct.
- School holidays need an indicator only in the first version; no selected-date label/details are required.
- During development, school holiday data can be scraped/imported from official Bodø kommune sources and then maintained/updated later.

Source checked during planning:

- Bodø kommune skoleruta: https://bodo.kommune.no/tjenester/barnehage-og-skole/skole/ferie-og-fridager-i-skolen-skoleruta-permisjon-fra-undervisning/ferie-og-fridager-i-skolen-skoleruta/

Known Bodø school year 2025-2026 dates from the official page snippet checked on 2026-05-15:

- School starts: 2025-08-14
- Autumn break: 2025-09-29 to 2025-10-03
- Student-free day: 2025-11-21
- Last school day before Christmas: 2025-12-19
- First school day after New Year: 2026-01-05
- Winter break: 2026-03-02 to 2026-03-06
- Easter break: 2026-03-30 to 2026-04-07
- Student-free day: 2026-05-15
- Last school day: 2026-06-19

Before hard-coding future years, re-check the official source or Lovdata.

## Implementation Notes

- Follow `AGENTS.md` / `CLAUDE.md` project instructions.
- Use pnpm.
- Use Jest and add tests incrementally.
- Keep date handling injectable in tests.
- Prefer short, focused functions and avoid duplicated calendar/proposal logic.
- Keep timezone-sensitive custody logic based on stable local date keys rather than UTC timestamps.
- Suggested future database shape should leave room for multiple custody groups, even though the first product has one group only.
