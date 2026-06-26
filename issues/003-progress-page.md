## Parent PRD

`issues/prd.md`

## What to build

A dedicated `/progress` page giving students a full breakdown of their gamification stats: tier card with progress bar, streak stats (current and longest), and a chronological history of every point event from the ledger. The dashboard widget (from Issue 1) gains a link to this page.

**End-to-end behavior:**
1. Student clicks a link on the dashboard gamification widget
2. They land on `/progress`
3. They see their current tier, points, and progress toward the next tier
4. They see their current and longest streak
5. They see a list of all point events: date, quiz name, reason (attempt or pass), and points awarded

## Acceptance criteria

- [ ] A `/progress` route exists and is accessible to authenticated students
- [ ] The page loader calls `getGamificationSummary()` and a new `getPointsHistory(userId)` method on `gamificationService`
- [ ] `getPointsHistory()` returns ledger events in reverse-chronological order, each including: `awardedAt`, `points`, `reason`, and enough quiz metadata to display a human-readable label
- [ ] The page displays: tier name, total points, progress bar toward next tier
- [ ] The page displays: current streak and longest streak
- [ ] The page displays a scrollable list of all point events with date, label, reason, and points
- [ ] The dashboard widget includes a link to `/progress`
- [ ] Unauthenticated requests to `/progress` are redirected to login (consistent with existing auth pattern)
- [ ] A student cannot view another student's progress page

## Blocked by

- Blocked by `issues/001-points-tiers-dashboard-widget.md`

## User stories addressed

- User story 5 (see points needed to reach next tier)
- User story 11 (dedicated page for full points history)
- User story 12 (see reason for each point award)
- User story 17 (progress bar within current tier)
