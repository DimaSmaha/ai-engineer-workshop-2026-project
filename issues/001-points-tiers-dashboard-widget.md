## Parent PRD

`issues/prd.md`

## What to build

A complete end-to-end points and tier system: students earn points when they attempt or pass a quiz, and immediately see their running total, named tier rank, and tier progress bar in a new dashboard widget.

This is the foundation slice. All other gamification issues build on the schema and service introduced here.

**End-to-end behavior:**
1. Student submits a quiz
2. Server awards 10 pts for the attempt, plus 50 pts if they passed
3. Both events are written to the points ledger
4. Student lands back on the dashboard and sees updated points, their current tier (Beginner / Intermediate / Advanced / Expert), and a progress bar toward the next tier

See the Implementation Decisions section of the PRD for point values, tier thresholds, service interface, and schema details.

## Acceptance criteria

- [ ] `points` (integer, default 0) column exists on the `users` table
- [ ] `userPointEvents` ledger table exists with `userId`, `points`, `reason` (`attempt`|`pass`), `quizAttemptId`, `awardedAt`
- [ ] A Drizzle migration covers both schema changes
- [ ] `gamificationService.recordQuizActivity(userId, quizAttemptId, passed)` awards 10 pts for any attempt and an additional 50 pts if `passed` is true, writing a ledger row for each award and incrementing the `users.points` running total
- [ ] `gamificationService.computeTier(points)` returns the correct tier name at all four thresholds and their boundaries
- [ ] `gamificationService.getGamificationSummary(userId)` returns `{ points, tier, tierProgressPercent, streakDays, longestStreak }` (streak fields return 0 until Issue 2 is merged)
- [ ] The quiz submission route action calls `recordQuizActivity()` after `computeResult()` returns
- [ ] The dashboard loader includes the result of `getGamificationSummary()`
- [ ] A compact gamification widget is visible on the dashboard showing: tier name, total points, and a progress bar toward the next tier
- [ ] The widget is private — no other student's data is shown
- [ ] Unit tests cover: attempt-only award, pass award, tier boundary values, ledger row counts, and `getGamificationSummary` return shape

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1 (earn points for attempting a quiz)
- User story 2 (earn bonus points for passing)
- User story 3 (see total points on dashboard)
- User story 4 (named tier rank based on points)
- User story 5 (see current tier and points to next tier)
- User story 13 (compact dashboard widget)
- User story 14 (tier updates immediately on threshold crossing)
- User story 15 (all data is private to the student)
- User story 17 (progress bar within current tier)
