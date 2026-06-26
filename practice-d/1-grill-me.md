/grill-me @client-brief.md                                                                                                    
  ⎿  Read client-brief.md (21 lines)

● Let me explore the codebase first to inform my questions.

● Explore(Explore codebase structure for gamification planning)
  ⎿  Backgrounded agent (↓ to manage · ctrl+o to expand)

● Exploring the codebase — I'll start grilling you as soon as I have the lay of the land.

✻ Waiting for 1 background agent to finish

● Agent "Explore codebase structure for gamification planning" finished · 1m 29s

● Good, I have a solid picture of the codebase. Let me start drilling into the design decisions.

  ---
  Question 1 of ~10: What counts as "a day of activity" for streak purposes?

  The codebase has three activity signals: video watch events, lesson completions, and quiz attempts. The streak behavior is
  fundamentally different depending on which you use:
  
  - Any video watch event — most forgiving, a student who opens a video for 10 seconds keeps their streak
  - Lesson completion — stricter, requires actually finishing something
  - Any of the three — broadest, completing a quiz alone counts

  My recommendation: any of the three. Sarah's goal is retention, not rigor — the streak is a psychological hook to get students
  to open the app daily. A student who takes a 2-minute quiz to keep their 30-day streak is exactly the behavior you want.
  Making it completion-only risks frustrating students mid-video who can't finish that day.

  What's your instinct here?

  ---

  lets go with quiz                                                                                                             

● Noted — only quiz attempts count for streaks. Worth flagging: if a student is mid-course with no quiz available that day, they
  can't extend their streak at all. But that's a valid design choice — it creates a strong incentive specifically for quizzes,
  which was Sarah's ask.

  ---
  Question 2 of ~10: Calendar day or rolling 24-hour window for streak continuity?

  Two interpretations of "daily streak":

  - Calendar day — activity on Monday + activity on Tuesday = 2-day streak, regardless of whether it was 25 hours apart or 1
  hour apart. Easiest to understand. "Did you do a quiz today?"
  - Rolling 24-hour window — activity must occur within 24 hours of the previous activity. More precise but confusing: a student
  who does a quiz at 11pm one night and 1am the next feels cheated when their streak resets.

  My recommendation: calendar day, stored as an ISO date string (2026-06-26). It matches how users mentally model "daily
  habits," avoids timezone edge cases in the logic, and is simpler to query. The existing quizAttempts.attemptedAt timestamp
  already has what we need — just extract the date part.

  Calendar day or rolling window?

  ---
❯ ye, lets go with calendar                                                                                                     

● Question 3 of ~10: How many points does completing a quiz award, and does the score matter?

  Three options for quiz point rewards:

  - Flat points for any attempt — e.g. 10 points just for trying, regardless of score. Maximizes engagement but removes
  incentive to actually do well.
  - Flat points for passing only — e.g. 50 points if score ≥ passing threshold. Binary — you either get it or you don't. Simple.
  - Score-scaled points — e.g. base 50 points × (score%). A 90% gets 45 pts, a 60% gets 30 pts. Rewards quality but adds
  complexity.

  Sarah also asked to "tie quizzes in somehow" — she didn't specify score-based, just that quizzes currently feel pointless.

  My recommendation: flat points for passing only (50 pts), plus a smaller consolation for any attempt (10 pts). This gives
  students a reason to attempt quizzes (10 pts) while still rewarding mastery (50 pts on pass). It's two simple numbers, no
  multipliers, no floating point math. The passing threshold already exists in quizScoringService.computeResult() via the passed
  boolean.

  Which points model do you want?

  ---

  
❯ lets go with your recomendation                                                                                               

● 10 pts for any attempt, 50 pts for passing. Next:

  ---
  Question 4 of ~10: Should lesson completions also award points, or is it quiz-only?

  The brief mentions a general "points system so progress accumulates visibly" — not just quizzes. But you just said streaks are
  quiz-only. The points system could be broader:

  - Quiz-only points — keeps it simple and focused on the quiz incentive Sarah specifically called out. Students who never take
  quizzes accumulate nothing.
  - Lessons + quizzes — e.g. 20 pts per lesson completed, 10/50 for quizzes. Points feel meaningful even without quizzes. Better
  for courses that are mostly video.

  My recommendation: lessons + quizzes. Sarah said "points so progress accumulates visibly" — if a student watches 10 lessons
  and gets zero points because they haven't hit a quiz yet, the system feels broken. Lesson completion is already tracked
  cleanly in progressService.markLessonComplete(), so hooking in is trivial. Suggested value: 20 pts per lesson.

  Points for lessons too, or quiz-only?

✻ Cogitated for 7s

❯ only quiz                                                                                                                     

● Quiz-only it is. Moving on.

  ---
  Question 5 of ~10: How many levels, and what are the XP thresholds?

  Levels give students milestones to aim for. The main design choices are the curve shape:

  - Linear — every level costs the same (e.g. 100 pts each): Level 2 = 100, Level 3 = 200, Level 4 = 300. Predictable but late
  levels feel cheap.
  - Exponential — each level costs more than the last: Level 2 = 100, Level 3 = 300, Level 4 = 700. Feels earned but can feel
  unreachable.
  - Tiered steps — a few flat bands: Beginner (0–199), Intermediate (200–499), Advanced (500–999), Expert (1000+). Simple and
  named, feels like a rank rather than a grind.

  Given quiz-only points (max ~60 pts per quiz), a student completing 10 quizzes earns ~500 pts if they pass everything. That's
  the scale to calibrate against.

  My recommendation: 4 named tiers — Beginner (0), Intermediate (200), Advanced (500), Expert (1000). Named ranks resonate with
  professionals more than "Level 7." The thresholds are reachable but not trivial, and 4 tiers is easy to display and reason
  about.

  How many levels/tiers, and do you want named ranks or numbered levels?

  ---

  ❯  Tiered steps                                                                                                                 

● 4 named tiers: Beginner → Intermediate → Advanced → Expert. Next:
  
  ---
  Question 6 of ~10: Do we need a points ledger (audit log of every transaction), or just a running total on the user?

  Two approaches:

  - Running total only — add points and streakDays columns directly to the users table. Simple, fast to query, but if something
  goes wrong you can't reconstruct what happened.
  - Points ledger table — a userPointEvents table recording every award (userId, points, reason, quizAttemptId, awardedAt), plus
  a derived total. Auditable, debuggable, and lets you show students a history like "you earned 50 pts for passing Module 3
  Quiz."

  My recommendation: ledger table + denormalized total on the user. The ledger costs one extra insert per quiz attempt —
  trivial. In return you can debug "why does this student have 340 points?", retroactively fix awards if the scoring logic
  changes, and show a points history UI later. The running total on users keeps queries fast. The codebase already follows this
  pattern with quizAttempts as a log alongside aggregated progress.

  Ledger or running total only?

✻ Cooked for 10s

❯  Points ledger table —                                                                                                        

● Ledger table it is. Next:

  ---
  Question 7 of ~10: Where does the streak data live — on the user row, or in the ledger?

  The streak is separate from points — it's a count of consecutive days with a quiz attempt. Storage options:

  - On the users table — add streakDays, longestStreak, lastQuizDate columns. Simple, one row to update when a quiz is
  submitted.
  - Computed from the ledger on every request — query the points ledger ordered by date and count consecutive days. No extra
  columns, but expensive to compute for every page load.
  - Hybrid: user columns for current state, computed from quizAttempts for history — streakDays and lastQuizDate on users (fast
  reads), with quizAttempts as the source of truth if you ever need to recompute.

  My recommendation: hybrid — streakDays, longestStreak, and lastQuizDate on the users table. Fast reads for display, and
  quizAttempts already has full history if you need to audit or recompute. No new table needed for streaks specifically.

  Streak state on users table, or somewhere else?

✻ Cogitated for 7s

❯ hybrid                                                                                                                        

● Hybrid it is — streak state on users, quizAttempts as the source of truth. Next:

  ---
  Question 8 of ~10: Should existing users get retroactive points and streaks for past activity?

  The quizAttempts table already has full history with timestamps. Two choices:

  - Retroactive — on deploy, run a migration that awards points for all past quiz attempts and computes streaks from history.
  Existing students log in and immediately see a meaningful score. Better first impression.
  - Forward-only — points start at 0 for everyone on launch day. Simpler, no migration risk, but students who've done 50 quizzes
  feel cheated.

  My recommendation: retroactive. The data is all there in quizAttempts — a one-time migration script can replay every attempt
  through the same award logic. The risk of a migration bug is low since it's additive (no deletes, no schema changes to
  existing data). Students who've been active for months seeing "Beginner, 0 points" on day one would undermine the whole
  feature.

  Retroactive awards on deploy, or start fresh from launch day?

✻ Crunched for 11s

❯ Retroactive                                                                                                                   

● Next:

  ---
  Question 9 of ~10: Where does the gamification data appear in the UI?

  The brief says students should see progress visibly. Options:

  - Dashboard widget only — a compact "Level: Intermediate • 340 pts • 🔥 5-day streak" banner on the existing dashboard.tsx.
  Minimal surface area, ships fast.
  - Dedicated /progress page — full breakdown: tier progress bar, streak calendar, points history from the ledger. Richer but
  more build time.
  - Both — widget on dashboard that links to a dedicated page.

  My recommendation: both, but ship the dashboard widget first. The widget is the high-retention touchpoint Sarah cares about —
  students see it every time they visit. The dedicated page with points history is valuable but can come in a second pass. The
  dashboard loader already fetches user data, so adding gamification stats is a small addition.

  Widget only, dedicated page only, or both?

✻ Brewed for 7s

❯ both                                                                                                                          

● Last one:

  ---
  Question 10 of ~10: Should gamification live as its own service, or be embedded into existing services?

  The award logic needs to fire when quizScoringService.computeResult() runs. Two ways to wire that:

  - Embedded — computeResult() directly updates points, streak, and writes to the ledger. Fewer files, but quizScoringService
  now has two responsibilities and becomes harder to test in isolation.
  - Separate gamificationService — owns all point/streak logic. The route action that calls computeResult() then calls
  gamificationService.recordQuizActivity(userId, quizAttemptId, passed) as a second step. Clean separation, matches the existing
  service pattern, easy to unit test independently.

  My recommendation: separate gamificationService. Every other service in this codebase is single-responsibility. The route
  action is the right orchestration point — it already handles "submit quiz → compute result → redirect." Adding one more call
  there is natural. Testing gamification logic in isolation (without needing a full quiz setup) will be much easier.

  Embedded in quiz service, or separate gamificationService?

✻ Sautéed for 11s

❯ separate gamificationService?                                                                                                 

● We've got everything we need. Here's the full design spec we landed on:

  ---
  Gamification Design — Agreed Decisions

  ┌─────────────────────┬────────────────────────────────────────────────────────────────────┐
  │      Decision       │                               Choice                               │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Streak trigger      │ Quiz attempts only                                                 │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Streak continuity   │ Calendar day (ISO date comparison)                                 │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Points: any attempt │ 10 pts                                                             │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Points: passing     │ 50 pts                                                             │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Points scope        │ Quiz-only (no lesson points)                                       │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Tiers               │ Beginner (0) → Intermediate (200) → Advanced (500) → Expert (1000) │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Points storage      │ Ledger table + running total on users                              │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Streak storage      │ streakDays, longestStreak, lastQuizDate on users                   │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Retroactive         │ Yes — migration replays all past quizAttempts                      │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ UI                  │ Dashboard widget + dedicated /progress page                        │
  ├─────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Architecture        │ Separate gamificationService, called from route actions            │
  └─────────────────────┴────────────────────────────────────────────────────────────────────┘

  ---
  New schema additions needed:
  - users table: points, streakDays, longestStreak, lastQuizDate
  - New userPointEvents table: id, userId, points, reason (attempt/pass), quizAttemptId, awardedAt

  Ready to write the PRD, break it into issues, or start with TDD on gamificationService — your call.

✻ Sautéed for 7s

---



