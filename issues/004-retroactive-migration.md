## Parent PRD

`issues/prd.md`

## What to build

A one-time migration script that replays all existing `quizAttempts` records through the same award logic as `recordQuizActivity()`, so students who already have quiz history see a meaningful starting balance and streak on day one of the feature launch.

**End-to-end behavior:**
1. Script is run once at deploy time, before the gamification UI goes live
2. All `quizAttempts` are processed in ascending `attemptedAt` order, per user
3. Each attempt awards points and updates the streak exactly as the live system would
4. The script is idempotent — re-running it does not create duplicate ledger entries

## Acceptance criteria

- [ ] The migration script processes all `quizAttempts` in ascending `attemptedAt` order
- [ ] For each attempt, it awards points and updates streak state using the same logic as `recordQuizActivity()` (not a separate re-implementation)
- [ ] Before writing any award, the script checks whether a `userPointEvents` row already exists for that `quizAttemptId`; if it does, the attempt is skipped
- [ ] After the script runs, each user's `points`, `streakDays`, `longestStreak`, and `lastQuizDate` reflect their full historical activity
- [ ] The script can be run safely more than once with identical end state
- [ ] The script logs a summary on completion: number of attempts processed, number skipped (already awarded), number of users affected

## Blocked by

- Blocked by `issues/001-points-tiers-dashboard-widget.md`
- Blocked by `issues/002-streak-tracking.md`
- Must be run in production before Issues 1 and 2 go live so students see non-zero balances from day one

## User stories addressed

- User story 10 (existing quiz history is recognised from day one)
