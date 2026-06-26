# Session Full Log — Gamification Feature Planning
**Date:** 2026-06-26  
**Model:** Claude Sonnet 4.6 | effort: high  
**Stats:** ctx: 25% | in: 50,005 tokens | out: 127 tokens | 


---

## Session Overview

Full planning session for adding a gamification system to the Cadence e-learning platform, driven by a client brief from Sarah Chen (VP Product). Covered: codebase exploration, design grilling (10 questions), PRD writing, and issue breakdown.

---

## Client Brief (Source: `client-brief.md`)

**From:** Sarah Chen, VP Product, Cadence  
**Channel:** #product-requests, 2 days ago

Retention numbers aren't great. Students sign up, do a few lessons, then drop off. No sense of progress beyond a "lesson complete" checkbox. One student said: "I finished 40 lessons and I have nothing to show for it."

**Requested features:**
- A points system so progress accumulates visibly over time
- Levels or ranks — milestones to aim for
- Streaks (like Duolingo). Students who do one lesson a day for a week are 3x more likely to finish a course
- Tie quizzes into it somehow — right now there's no incentive to do them

**Constraints:**
- No leaderboards or anything competitive
- Keep it private to each student
- Move on it this quarter

---

## Codebase Exploration Results

### Tech Stack
- **Framework:** React Router v7 with SSR (isomorphic TypeScript)
- **Database:** SQLite via better-sqlite3
- **ORM:** Drizzle ORM with migrations
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest with in-memory SQLite per test
- **Build:** Vite

### Relevant Data Models

**Users table:** id, name, email, role (Student/Instructor/Admin), avatarUrl, bio, createdAt  
— No gamification fields yet

**Progress tracking:**
- `lessonProgress`: userId, lessonId, status, completedAt
- `quizAttempts`: userId, quizId, score, passed, attemptedAt ← key for streaks
- `videoWatchEvents`: userId, lessonId, eventType, positionSeconds, createdAt
- `enrollments`: userId, courseId, enrolledAt, completedAt

**Content hierarchy:** courses → modules → lessons → quizzes → questions/options

### Existing Services
- `progressService.ts` (284 lines) — `markLessonComplete()`, `calculateProgress()`, `getNextIncompleteLesson()`
- `quizScoringService.ts` (392 lines) — `computeResult()`, grade calc (A/B/C/D/F), `getUserQuizHistory()`
- `videoTrackingService.ts` (149 lines) — `logWatchEvent()`, `calculateWatchProgress()`

**Key insight:** All three services store timestamps on every action → streak detection is feasible from existing data.

### Test Patterns
- `createTestDb()` — fresh in-memory SQLite per test
- `seedBaseData(testDb)` — creates user, instructor, category, course
- `vi.mock("~/db", () => ({ get db() { return testDb } }))` pattern
- 11 test files, 100+ test cases, `progressService.test.ts` has 26 cases

---

## Grilling Session — 10 Questions and Answers

### Q1: What counts as "a day of activity" for streak purposes?
Options: any video watch event / lesson completion / any of the three  
**Recommendation:** Any of the three (broadest, maximises retention)  
**Decision: Quiz attempts only**

### Q2: Calendar day or rolling 24-hour window for streak continuity?
**Recommendation:** Calendar day (ISO date string, matches mental model, no timezone edge cases)  
**Decision: Calendar day**

### Q3: How many points per quiz, and does score matter?
Options: flat for any attempt / flat for passing / score-scaled  
**Recommendation:** 10 pts for any attempt + 50 pts for passing (two simple numbers, no multipliers)  
**Decision: Recommendation accepted — 10 pts attempt, 50 pts passing**

### Q4: Should lesson completions also award points?
**Recommendation:** Yes — lessons + quizzes (points feel meaningful even without quizzes)  
**Decision: Quiz-only**

### Q5: How many levels, and named or numbered?
Options: linear / exponential / tiered named steps  
**Recommendation:** 4 named tiers — Beginner (0), Intermediate (200), Advanced (500), Expert (1000)  
**Decision: Tiered steps (4 named tiers)**

### Q6: Points ledger (audit log) or running total only?
**Recommendation:** Ledger table + denormalised total on user (debuggable, matches existing patterns)  
**Decision: Points ledger table**

### Q7: Where does streak data live?
Options: on users table / computed from ledger / hybrid  
**Recommendation:** Hybrid — `streakDays`, `longestStreak`, `lastQuizDate` on users table  
**Decision: Hybrid**

### Q8: Should existing users get retroactive points and streaks?
**Recommendation:** Yes — data is all in `quizAttempts`, migration is additive and low-risk  
**Decision: Retroactive**

### Q9: Where does gamification data appear in the UI?
Options: dashboard widget only / dedicated /progress page / both  
**Recommendation:** Both (widget ships first, /progress page follows)  
**Decision: Both**

### Q10: Should gamification live in its own service or be embedded?
**Recommendation:** Separate `gamificationService` — single responsibility, matches existing pattern, easier to test  
**Decision: Separate gamificationService**

---

## Final Design Spec

| Decision | Choice |
|---|---|
| Streak trigger | Quiz attempts only |
| Streak continuity | Calendar day (ISO date comparison) |
| Points: any attempt | 10 pts |
| Points: passing | 50 pts (60 total for a passing attempt) |
| Points scope | Quiz-only |
| Tiers | Beginner (0) → Intermediate (200) → Advanced (500) → Expert (1000) |
| Points storage | Ledger table + running total on `users` |
| Streak storage | `streakDays`, `longestStreak`, `lastQuizDate` on `users` |
| Retroactive | Yes — migration replays all past `quizAttempts` |
| UI | Dashboard widget + dedicated `/progress` page |
| Architecture | Separate `gamificationService`, called from route actions |

### Schema Additions

**`users` table — new columns:**
- `points` integer, not null, default 0
- `streakDays` integer, not null, default 0
- `longestStreak` integer, not null, default 0
- `lastQuizDate` text (ISO date string), nullable

**New `userPointEvents` table:**
- `id` — primary key
- `userId` — FK to users
- `points` — integer
- `reason` — enum: `attempt` | `pass`
- `quizAttemptId` — FK to quizAttempts
- `awardedAt` — timestamp

### New `gamificationService` Public Interface
- `recordQuizActivity(userId, quizAttemptId, passed)` — awards points, updates streak, writes ledger
- `getGamificationSummary(userId)` — returns points, tier, tierProgressPercent, streakDays, longestStreak
- `getPointsHistory(userId)` — full ordered ledger with quiz metadata
- `computeTier(points)` — pure function, points → tier name
- `computeStreakUpdate(lastQuizDate, todayDate, currentStreak)` — pure function, streak state machine

---

## PRD Written

File: `issues/prd.md`

Sections:
- Problem Statement
- Solution
- 17 User Stories
- Implementation Decisions (schema, service interface, tier thresholds, streak rules, route changes, UI components)
- Testing Decisions (what to test, prior art, what not to test)
- Out of Scope (leaderboards, lesson points, badges, streak freezes, push notifications, social sharing)
- Further Notes (calendar day / server time caveat, hardcoded thresholds, append-only ledger)

---

## Issues Created

### First breakdown (rejected — Slice 1 too horizontal)
- Issue 1: Schema + gamificationService foundation ← rejected as horizontal layer
- Issue 2: Live quiz awards + dashboard widget
- Issue 3: Dedicated /progress page
- Issue 4: Retroactive migration

### Revised breakdown (approved)

**`issues/001-points-tiers-dashboard-widget.md`**
- Type: AFK
- Blocked by: None
- Covers: schema (points + userPointEvents), gamificationService award logic + computeTier, quiz submission wiring, dashboard widget
- User stories: 1, 2, 3, 4, 5, 13, 14, 15, 17

**`issues/002-streak-tracking.md`**
- Type: AFK
- Blocked by: 001
- Covers: streak schema columns, computeStreakUpdate pure function, streak logic in recordQuizActivity, widget extension
- User stories: 6, 7, 8, 9, 16

**`issues/003-progress-page.md`**
- Type: AFK
- Blocked by: 001 (can run parallel with 002)
- Covers: /progress route, getPointsHistory(), tier card, streak stats, points history table, widget link
- User stories: 5, 11, 12, 17

**`issues/004-retroactive-migration.md`**
- Type: AFK
- Blocked by: 001 + 002; must run before production deploy
- Covers: replay all quizAttempts, idempotency check, logging summary
- User stories: 10

---

## Files Created This Session

| File | Purpose |
|---|---|
| `issues/prd.md` | Full PRD |
| `issues/001-points-tiers-dashboard-widget.md` | Issue 1 |
| `issues/002-streak-tracking.md` | Issue 2 |
| `issues/003-progress-page.md` | Issue 3 |
| `issues/004-retroactive-migration.md` | Issue 4 |
| `session-full.md` | This file |
| `session-summary.md` | Compact session summary |
