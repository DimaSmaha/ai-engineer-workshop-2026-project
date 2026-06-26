import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { users, userPointEvents } from "~/db/schema";

const TIERS = [
  { name: "Expert", min: 1000 },
  { name: "Advanced", min: 500 },
  { name: "Intermediate", min: 200 },
  { name: "Beginner", min: 0 },
] as const;

const TIER_ORDER = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const TIER_THRESHOLDS = [0, 200, 500, 1000] as const;

export function computeTier(points: number): string {
  for (const tier of TIERS) {
    if (points >= tier.min) return tier.name;
  }
  return "Beginner";
}

export function computeTierProgress(points: number): number {
  const tierIndex = TIER_ORDER.indexOf(computeTier(points) as (typeof TIER_ORDER)[number]);

  if (tierIndex === TIER_ORDER.length - 1) return 100;

  const currentMin = TIER_THRESHOLDS[tierIndex];
  const nextMin = TIER_THRESHOLDS[tierIndex + 1];
  return Math.round(((points - currentMin) / (nextMin - currentMin)) * 100);
}

const ATTEMPT_POINTS = 10;
const PASS_POINTS = 50;

export function recordQuizActivity(userId: number, quizAttemptId: number, passed: boolean): void {
  db.insert(userPointEvents)
    .values({ userId, points: ATTEMPT_POINTS, reason: "attempt", quizAttemptId })
    .run();

  db.update(users)
    .set({ points: sql`${users.points} + ${ATTEMPT_POINTS}` })
    .where(eq(users.id, userId))
    .run();

  if (passed) {
    db.insert(userPointEvents)
      .values({ userId, points: PASS_POINTS, reason: "pass", quizAttemptId })
      .run();

    db.update(users)
      .set({ points: sql`${users.points} + ${PASS_POINTS}` })
      .where(eq(users.id, userId))
      .run();
  }
}

export function getGamificationSummary(userId: number): {
  points: number;
  tier: string;
  tierProgressPercent: number;
  streakDays: number;
  longestStreak: number;
} {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return { points: 0, tier: "Beginner", tierProgressPercent: 0, streakDays: 0, longestStreak: 0 };
  }

  return {
    points: user.points,
    tier: computeTier(user.points),
    tierProgressPercent: computeTierProgress(user.points),
    streakDays: user.streakDays,
    longestStreak: user.longestStreak,
  };
}
