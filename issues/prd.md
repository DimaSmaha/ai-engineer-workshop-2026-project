# PRD: Student Gamification System

## Problem Statement

Students on the Cadence platform sign up, complete a handful of lessons, and then drop off. There is no visible sense of accumulated progress beyond a per-lesson "complete" checkbox. Students have no milestones to aim for, no habit-forming feedback loop, and no incentive to engage with quizzes. One student summarised the problem directly: "I finished 40 lessons and I have nothing to show for it."

## Solution

Introduce a private, per-student gamification layer that rewards quiz engagement with points, tracks daily learning streaks, and unlocks named tier ranks as students progress. Every element is visible only to the student themselves — no leaderboards, no competition. The goal is to give students a tangible, accumulating record of their effort and a reason to return each day.

## User Stories

1. As a student, I want to earn points when I attempt a quiz, so that I feel rewarded for engaging with course material even if I don't pass.
2. As a student, I want to earn bonus points when I pass a quiz, so that I have an incentive to study and perform well rather than just clicking through.
3. As a student, I want to see my total points on my dashboard, so that I can see my effort accumulate over time at a glance.
4. As a student, I want to be assigned a named tier rank (Beginner, Intermediate, Advanced, Expert) based on my points, so that I have meaningful milestones to work toward.
5. As a student, I want to see which tier I am currently in and how many points I need to reach the next tier, so that I know exactly how far away my next milestone is.
6. As a student, I want to maintain a daily streak counter when I attempt at least one quiz per calendar day, so that I am motivated to engage with the platform every day.
7. As a student, I want to see my current streak count on my dashboard, so that I feel the psychological pull to keep it going.
8. As a student, I want my streak to reset if I miss a full calendar day with no quiz activity, so that the streak accurately reflects my consistency.
9. As a student, I want to see my longest-ever streak, so that I have a personal record to try to beat.
10. As a student, I want my points history to reflect all quiz attempts I made before this feature launched, so that my existing effort is recognised from day one.
11. As a student, I want a dedicated progress page where I can see my full points history, so that I can review every quiz event that contributed to my score.
12. As a student, I want my progress page to show the reason for each point award (attempt vs. pass), so that I understand exactly how my points were earned.
13. As a student, I want the dashboard to show my tier name, current points, and current streak in a compact widget, so that the most important stats are always visible without navigating away.
14. As a student, I want my tier to update automatically as soon as I cross a threshold, so that the achievement feels immediate.
15. As a student, I want all my gamification data to be private to me, so that I am not compared to or judged against other students.
16. As a student, I want my streak to be based on calendar days in my local context, so that attempting a quiz at 11:55pm still counts for that day.
17. As a student, I want to see a progress bar showing how far through my current tier I am, so that I have a visual sense of momentum.

## Implementation Decisions

### Schema Changes

**`users` table additions:**
- `points` — integer, not null, default 0; denormalised running total for fast reads
- `streakDays` — integer, not null, default 0; current consecutive-day streak
- `longestStreak` — integer, not null, default 0; all-time best streak
- `lastQuizDate` — nullable text (ISO date string, e.g. `2026-06-26`); the calendar date of the most recent quiz attempt, used for streak continuity checks

**New `userPointEvents` table (points ledger):**
- `id` — primary key
- `userId` — foreign key to users
- `points` — integer; number of points awarded in this event
- `reason` — enum: `attempt` | `pass`
- `quizAttemptId` — foreign key to quizAttempts; links the award to the specific attempt
- `awardedAt` — timestamp

### Point Values

- Any quiz attempt: **+10 points**
- Passing a quiz (score meets passing threshold): **+50 points** (awarded in addition to the attempt points, so a passing attempt yields 60 pts total)

### Tier Thresholds

| Tier | Minimum Points |
|---|---|
| Beginner | 0 |
| Intermediate | 200 |
| Advanced | 500 |
| Expert | 1000 |

### Streak Rules

- Only quiz attempts trigger streak activity (not video watches or lesson completions)
- Streak continuity is based on **calendar day** — the ISO date string of `attemptedAt` is compared to `lastQuizDate`
- If `lastQuizDate` is yesterday: increment `streakDays` by 1
- If `lastQuizDate` is today: streak is already counted for today, no change
- If `lastQuizDate` is two or more days ago (or null): reset `streakDays` to 1
- `longestStreak` is updated whenever `streakDays` exceeds it

### New Module: `gamificationService`

A standalone service responsible for all gamification logic. It is not embedded in `quizScoringService`. Its public interface covers:

- `recordQuizActivity(userId, quizAttemptId, passed)` — awards points (attempt + conditional pass bonus), updates streak state, writes to the ledger, updates the running total on the user row. Called by the quiz submission route action immediately after `computeResult()` returns.
- `getGamificationSummary(userId)` — returns current points, tier name, progress to next tier (as a percentage), current streak, and longest streak. Used by the dashboard loader and the progress page loader.
- `getPointsHistory(userId)` — returns the full ordered list of point events from the ledger, joined with quiz metadata for display.
- `computeTier(points)` — pure function mapping a point total to a tier name. Stateless, easy to test.
- `computeStreakUpdate(lastQuizDate, todayDate, currentStreak)` — pure function encapsulating streak state machine logic. Stateless, easy to test.

### Retroactive Migration

A one-time data migration will replay all existing `quizAttempts` records (ordered by `attemptedAt` ascending) through the same award logic as `recordQuizActivity`. This ensures students who already have quiz history see a meaningful starting balance. The migration is idempotent if re-run (it checks whether a `userPointEvent` already exists for a given `quizAttemptId`).

### Route Changes

- **Quiz submission action** (`courses.$courseSlug.lessons.$lessonSlug` or similar): after calling `computeResult()`, call `gamificationService.recordQuizActivity()` with the result.
- **Dashboard loader**: call `gamificationService.getGamificationSummary(userId)` and include the result in the loader data.
- **New `/progress` route**: loader calls `getGamificationSummary()` and `getPointsHistory()`. Renders tier progress bar, streak stats, and a chronological list of point events.

### UI Components

- **Dashboard gamification widget**: compact banner showing tier name, total points, tier progress bar, and current streak. Links to `/progress`.
- **Progress page**: full-page view with tier card, streak stats (current + longest), and a scrollable points history table.

## Testing Decisions

Good tests for this feature test **observable outcomes through the service's public interface**, not internal implementation details. For example: "calling `recordQuizActivity` with `passed=true` results in the user's points increasing by 60 and a ledger entry with reason `pass` existing" — not "the internal `_awardPoints` helper was called twice."

**Modules to test:**

- **`gamificationService`** — primary test target. Tests should cover:
  - Attempt-only award (10 pts, one ledger entry)
  - Pass award (60 pts total, two ledger entries — one `attempt`, one `pass`)
  - Streak increment (activity yesterday → streak +1)
  - Streak same-day idempotency (activity today already counted → no streak change)
  - Streak reset (gap of 2+ days → streak resets to 1)
  - `longestStreak` updates correctly
  - Tier promotion (points crossing a threshold → correct tier returned)
  - `computeTier` pure function for all boundary values
  - `computeStreakUpdate` pure function for all cases (first activity, continuation, same-day, reset)
  - Retroactive migration: replaying N past attempts produces the correct final point total and streak

**Prior art:** `progressService.test.ts` (26 test cases) demonstrates the standard pattern — `beforeEach` creates a fresh in-memory DB via `createTestDb()`, seeds base data with `seedBaseData()`, and mocks the db module. Gamification tests should follow this exact pattern.

## Out of Scope

- Leaderboards or any comparison between students
- Points or streaks for lesson completions or video watches
- Badges or achievement unlocks beyond tier ranks
- Streak freeze / grace day mechanics
- Push notifications or email nudges for streak risk
- Instructor or admin visibility into individual student gamification data
- Social sharing of tier achievements
- Points decay or expiry

## Further Notes

- The "calendar day" streak definition means the server must be aware of the user's local date, not just UTC. The simplest approach is to derive the date from the `attemptedAt` timestamp stored in `quizAttempts`, which reflects server time. A future improvement could accept the client's local date in the quiz submission request.
- Tier thresholds and point values are currently hardcoded. If product wants to tune these after launch, extracting them to a configuration object (not a database table) is the recommended first step.
- The points ledger is append-only. Never delete or update ledger rows — always add a correcting entry if an award needs to be reversed.
