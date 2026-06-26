import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import {
  computeTier,
  computeTierProgress,
  recordQuizActivity,
  getGamificationSummary,
} from "./gamificationService";

let _moduleCounter = 0;

function createQuizAttempt(userId: number, passed: boolean) {
  _moduleCounter++;
  const mod = testDb
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: `Module ${_moduleCounter}`, position: _moduleCounter })
    .returning()
    .get();
  const lesson = testDb
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Lesson", position: 1 })
    .returning()
    .get();
  const quiz = testDb
    .insert(schema.quizzes)
    .values({ lessonId: lesson.id, title: "Test Quiz", passingScore: 0.7 })
    .returning()
    .get();
  return testDb
    .insert(schema.quizAttempts)
    .values({ userId, quizId: quiz.id, score: passed ? 1.0 : 0.5, passed })
    .returning()
    .get();
}

function getUser(userId: number) {
  return testDb.select().from(schema.users).where(eq(schema.users.id, userId)).get()!;
}

function getLedger() {
  return testDb.select().from(schema.userPointEvents).all();
}

describe("gamificationService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
    _moduleCounter = 0;
  });

  describe("computeTier", () => {
    it("returns Beginner for 0 points", () => {
      expect(computeTier(0)).toBe("Beginner");
    });

    it("returns Beginner for 199 points", () => {
      expect(computeTier(199)).toBe("Beginner");
    });

    it("returns Intermediate for 200 points", () => {
      expect(computeTier(200)).toBe("Intermediate");
    });

    it("returns Intermediate for 499 points", () => {
      expect(computeTier(499)).toBe("Intermediate");
    });

    it("returns Advanced for 500 points", () => {
      expect(computeTier(500)).toBe("Advanced");
    });

    it("returns Advanced for 999 points", () => {
      expect(computeTier(999)).toBe("Advanced");
    });

    it("returns Expert for 1000 points", () => {
      expect(computeTier(1000)).toBe("Expert");
    });
  });

  describe("computeTierProgress", () => {
    it("returns 0 for 0 points (start of Beginner)", () => {
      expect(computeTierProgress(0)).toBe(0);
    });

    it("returns 50 at midpoint of Beginner tier (100 pts)", () => {
      expect(computeTierProgress(100)).toBe(50);
    });

    it("returns 0 at start of Intermediate tier (200 pts)", () => {
      expect(computeTierProgress(200)).toBe(0);
    });

    it("returns 100 at Expert tier (no next tier)", () => {
      expect(computeTierProgress(1000)).toBe(100);
    });
  });

  describe("recordQuizActivity", () => {
    it("awards 10 points for an attempt-only and writes one ledger row", () => {
      const attempt = createQuizAttempt(base.user.id, false);

      recordQuizActivity(base.user.id, attempt.id, false);

      expect(getUser(base.user.id).points).toBe(10);

      const ledger = getLedger();
      expect(ledger).toHaveLength(1);
      expect(ledger[0].reason).toBe("attempt");
      expect(ledger[0].points).toBe(10);
      expect(ledger[0].userId).toBe(base.user.id);
      expect(ledger[0].quizAttemptId).toBe(attempt.id);
    });

    it("awards 60 points total for a passing attempt and writes two ledger rows", () => {
      const attempt = createQuizAttempt(base.user.id, true);

      recordQuizActivity(base.user.id, attempt.id, true);

      expect(getUser(base.user.id).points).toBe(60);

      const ledger = getLedger();
      expect(ledger).toHaveLength(2);

      const reasons = ledger.map((r) => r.reason).sort();
      expect(reasons).toEqual(["attempt", "pass"]);

      const attemptRow = ledger.find((r) => r.reason === "attempt")!;
      expect(attemptRow.points).toBe(10);

      const passRow = ledger.find((r) => r.reason === "pass")!;
      expect(passRow.points).toBe(50);
    });

    it("accumulates points across multiple quiz activities", () => {
      const attempt1 = createQuizAttempt(base.user.id, false);
      const attempt2 = createQuizAttempt(base.user.id, true);

      recordQuizActivity(base.user.id, attempt1.id, false);
      recordQuizActivity(base.user.id, attempt2.id, true);

      expect(getUser(base.user.id).points).toBe(70); // 10 + 60

      const ledger = getLedger();
      expect(ledger).toHaveLength(3); // 1 attempt + 1 attempt + 1 pass
    });
  });

  describe("getGamificationSummary", () => {
    it("returns zero state for a user with no activity", () => {
      const summary = getGamificationSummary(base.user.id);

      expect(summary.points).toBe(0);
      expect(summary.tier).toBe("Beginner");
      expect(summary.tierProgressPercent).toBe(0);
      expect(summary.streakDays).toBe(0);
      expect(summary.longestStreak).toBe(0);
    });

    it("reflects points and tier after quiz activity", () => {
      const attempt = createQuizAttempt(base.user.id, true);
      recordQuizActivity(base.user.id, attempt.id, true);

      const summary = getGamificationSummary(base.user.id);

      expect(summary.points).toBe(60);
      expect(summary.tier).toBe("Beginner");
      expect(summary.tierProgressPercent).toBe(30); // 60/200 * 100 = 30%
    });

    it("returns Intermediate tier and correct progress when points reach 200", () => {
      testDb
        .update(schema.users)
        .set({ points: 200 })
        .where(eq(schema.users.id, base.user.id))
        .run();

      const summary = getGamificationSummary(base.user.id);

      expect(summary.tier).toBe("Intermediate");
      expect(summary.points).toBe(200);
      expect(summary.tierProgressPercent).toBe(0); // 0% into Intermediate
    });
  });
});
