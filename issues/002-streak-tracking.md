## Parent PRD

`issues/prd.md`

## What to build

Daily quiz streak tracking: each time a student submits a quiz, the system checks whether they have activity on consecutive calendar days and updates their streak accordingly. The dashboard widget (introduced in Issue 1) is extended to show the current streak and longest-ever streak.

**End-to-end behavior:**
1. Student submits a quiz
2. Server compares today's calendar date against `lastQuizDate` on the user record
3. Streak increments if yesterday, holds if today already counted, resets to 1 if the gap is 2+ days
4. `longestStreak` is updated if the new streak exceeds it
5. Dashboard widget shows the updated streak count and longest streak

Streak is based on calendar day (ISO date string), not a rolling 24-hour window. Only quiz attempts trigger streak activity. See the PRD Implementation Decisions for the full state machine.

## Acceptance criteria

- [ ] `streakDays` (integer, default 0), `longestStreak` (integer, default 0), and `lastQuizDate` (nullable text, ISO date) columns exist on the `users` table
- [ ] A Drizzle migration covers all three new columns
- [ ] `gamificationService.computeStreakUpdate(lastQuizDate, todayDate, currentStreak)` is a pure function that returns the new streak value for all cases: first activity ever (null lastQuizDate), same-day repeat, consecutive-day continuation, and gap reset
- [ ] `recordQuizActivity()` calls `computeStreakUpdate()` and persists the result to `users.streakDays`, `users.longestStreak`, and `users.lastQuizDate`
- [ ] `getGamificationSummary()` returns correct non-zero values for `streakDays` and `longestStreak`
- [ ] The dashboard widget displays current streak and longest streak
- [ ] Unit tests cover all four `computeStreakUpdate` cases (null, same-day, continuation, reset) and that `longestStreak` updates only when the new streak exceeds the current record

## Blocked by

- Blocked by `issues/001-points-tiers-dashboard-widget.md`

## User stories addressed

- User story 6 (maintain a daily streak for quiz activity)
- User story 7 (see current streak on dashboard)
- User story 8 (streak resets on missed calendar day)
- User story 9 (see longest-ever streak)
- User story 16 (streak based on calendar day)
