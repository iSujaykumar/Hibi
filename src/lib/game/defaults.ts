import { EMPTY_STATS, type AppSettings, type Player, type PlayerStats } from "../../types/hibi.ts";
import { localDateId } from "./dates.ts";
import { ARCHETYPE_CONFIG, canonicalArchetype, canonicalPlayDifficulty } from "./config.ts";
import { mergeStats } from "./progression.ts";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  reducedMotion: false,
  xpAnimations: true,
  questSounds: false,
  levelUpEffects: true,
  comboEffects: true,
  motivationalMessages: true,
  bossBattles: true,
  streakProtection: true,
  revealSecretAchievements: false,
  morningReminder: false,
  habitReminders: false,
  eveningReminder: false,
  streakReminders: false,
  weeklyReviewNotifs: false,
  morningHour: 8,
  eveningHour: 20,
  installDismissed: false,
};

export function createPlayer(partial: Partial<Player> & { name: string }): Player {
  const today = localDateId();
  const now = new Date().toISOString();
  const archetype = canonicalArchetype(partial.archetype ?? "adaptive");
  const stats: PlayerStats = mergeStats(
    { ...EMPTY_STATS },
    ARCHETYPE_CONFIG[archetype]?.startingStats ?? {},
  );
  return {
    id: "local",
    level: 1,
    xp: 0,
    totalXp: 0,
    rank: "E",
    focuses: partial.focuses ?? ["growth"],
    unspentStatPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    streakShields: 1,
    pendingMissDate: null,
    equippedTitle: "beginner",
    unlockedTitles: ["beginner"],
    avatar: partial.avatar ?? ARCHETYPE_CONFIG[archetype]?.avatar ?? "shadow",
    avatarFrame: "none",
    createdAt: now,
    updatedAt: now,
    lastActiveDate: today,
    onboarded: false,
    dayCount: 1,
    lastDailyBonusDate: null,
    lastDailyReviewDate: null,
    lastWeeklyReviewDate: null,
    comboCount: 0,
    comboDate: null,
    experienceLevel: "some",
    availableTime: "medium",
    challengePreference: "steady",
    ...partial,
    archetype,
    playDifficulty: canonicalPlayDifficulty(partial.playDifficulty ?? "adventurer"),
    stats: partial.stats ?? stats,
    name: (partial.name ?? "Player").trim() || "Player",
  };
}
