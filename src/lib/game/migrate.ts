import {
  ALL_STAT_KEYS,
  EMPTY_STATS,
  SCHEMA_VERSION,
  type Archetype,
  type GameState,
  type Habit,
  type PlayDifficulty,
  type Player,
  type PlayerStats,
  type QuestKind,
  type StatKey,
} from "../../types/hibi.ts";
import { ARCHETYPE_CONFIG, canonicalPlayDifficulty, canonicalArchetype } from "./config.ts";
import { DEFAULT_SETTINGS } from "./defaults.ts";
import { clampQuestXp, clampStatReward, MAX_QUEST_XP, maxTotalXp, progressFromTotalXp, xpRequired } from "./progression.ts";
import { titlesUpToRank } from "./gates.ts";

export function normalizeArchetype(value: unknown): Archetype {
  return canonicalArchetype(value);
}

export function normalizePlayDifficulty(value: unknown): PlayDifficulty {
  return canonicalPlayDifficulty(
    typeof value === "string" ? (value as PlayDifficulty) : "adventurer",
  );
}

export function normalizeStats(raw: unknown): PlayerStats {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const stats: PlayerStats = { ...EMPTY_STATS };
  for (const key of ALL_STAT_KEYS) {
    const n = Number(src[key]);
    if (Number.isFinite(n) && n >= 0) stats[key] = Math.min(999, Math.floor(n));
  }
  const vitality = Number(src.vitality);
  const discipline = Number(src.discipline);
  const consistency = Number(src.consistency);
  if (!src.energy && Number.isFinite(vitality) && vitality > 0) {
    stats.energy = Math.max(stats.energy, vitality);
  }
  if (Number.isFinite(discipline) && discipline > stats.willpower) {
    stats.willpower = Math.max(stats.willpower, discipline);
  }
  if (Number.isFinite(consistency) && consistency > 1 && stats.willpower < consistency) {
    stats.willpower = Math.max(stats.willpower, Math.round((stats.willpower + consistency) / 2));
  }
  if (!src.creativity) stats.creativity = Math.max(stats.creativity, 1);
  if (!src.social) stats.social = Math.max(stats.social, 1);
  return stats;
}

export function normalizeStatRewards(delta: Partial<PlayerStats> | undefined): Partial<PlayerStats> {
  if (!delta) return {};
  const out: Partial<PlayerStats> = {};
  for (const key of ALL_STAT_KEYS) {
    const n = clampStatReward(delta[key]);
    if (n > 0) out[key] = n;
  }
  if (delta.vitality) out.energy = (out.energy ?? 0) + clampStatReward(delta.vitality);
  if (delta.discipline) out.willpower = (out.willpower ?? 0) + clampStatReward(delta.discipline);
  if (delta.consistency) out.willpower = (out.willpower ?? 0) + clampStatReward(delta.consistency);
  return out;
}

const EXPERIENCE = new Set(["beginner", "some", "consistent", "expert"]);
const TIME = new Set(["low", "medium", "high"]);
const CHALLENGE = new Set(["gentle", "steady", "push"]);
const KINDS = new Set<QuestKind>(["daily", "weekly", "mission", "challenge", "boss", "side"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function migratePlayer(raw: Partial<Player> & { name?: string }): Player {
  const archetype = normalizeArchetype(raw.archetype);
  const boost = ARCHETYPE_CONFIG[archetype]?.startingStats ?? {};
  const stats = normalizeStats(raw.stats);
  for (const [k, v] of Object.entries(boost)) {
    const key = k as StatKey;
    if ((raw.stats as PlayerStats | undefined)?.[key] == null && typeof v === "number") {
      stats[key] = Math.max(stats[key], 1 + v);
    }
  }
  const totalXp = Math.min(maxTotalXp(), Math.max(0, Math.floor(Number(raw.totalXp) || 0)));
  const progressed = progressFromTotalXp(totalXp);
  const rank = raw.rank ?? "E";
  const unlockedTitles = Array.from(
    new Set([
      ...(Array.isArray(raw.unlockedTitles) ? raw.unlockedTitles : ["beginner"]),
      ...titlesUpToRank(rank),
    ]),
  );
  return {
    id: raw.id ?? "local",
    name: (raw.name ?? "Player").trim() || "Player",
    level: progressed.level,
    xp: progressed.xp,
    totalXp,
    rank,
    archetype,
    playDifficulty: normalizePlayDifficulty(raw.playDifficulty),
    focuses: Array.isArray(raw.focuses) && raw.focuses.length > 0 ? raw.focuses : ["growth"],
    stats,
    unspentStatPoints: raw.unspentStatPoints ?? 0,
    currentStreak: raw.currentStreak ?? 0,
    longestStreak: raw.longestStreak ?? 0,
    lastStreakDate: raw.lastStreakDate ?? null,
    streakShields: raw.streakShields ?? 1,
    pendingMissDate: raw.pendingMissDate ?? null,
    equippedTitle: raw.equippedTitle ?? "beginner",
    unlockedTitles,
    avatar: raw.avatar ?? ARCHETYPE_CONFIG[archetype].avatar,
    avatarFrame: raw.avatarFrame ?? "none",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    lastActiveDate: raw.lastActiveDate ?? "",
    onboarded: Boolean(raw.onboarded),
    dayCount: raw.dayCount ?? 1,
    lastDailyBonusDate: raw.lastDailyBonusDate ?? null,
    lastDailyReviewDate: raw.lastDailyReviewDate ?? null,
    lastWeeklyReviewDate: raw.lastWeeklyReviewDate ?? null,
    comboCount: raw.comboCount ?? 0,
    comboDate: raw.comboDate ?? null,
    experienceLevel: EXPERIENCE.has(String(raw.experienceLevel))
      ? (raw.experienceLevel as Player["experienceLevel"])
      : "some",
    availableTime: TIME.has(String(raw.availableTime))
      ? (raw.availableTime as Player["availableTime"])
      : "medium",
    challengePreference: CHALLENGE.has(String(raw.challengePreference))
      ? (raw.challengePreference as Player["challengePreference"])
      : "steady",
  };
}

export function migrateHabit(raw: Habit): Habit {
  const kind: QuestKind = KINDS.has(raw.kind) ? raw.kind : raw.frequency === "weekly" ? "weekly" : "daily";
  return {
    ...raw,
    kind,
    xpReward: clampQuestXp(raw.xpReward),
    target: Math.max(1, Math.floor(Number(raw.target) || 1)),
    statRewards: normalizeStatRewards(raw.statRewards),
    active: raw.active !== false,
    archived: Boolean(raw.archived),
  };
}

export function migrateState(raw: unknown): GameState | null {
  if (!isRecord(raw) || !isRecord(raw.player)) return null;
  const player = migratePlayer(raw.player as Partial<Player>);
  const habits = Array.isArray(raw.habits) ? (raw.habits as Habit[]).map(migrateHabit) : [];
  return {
    schemaVersion: SCHEMA_VERSION,
    player,
    habits,
    completions: Array.isArray(raw.completions) ? (raw.completions as GameState["completions"]) : [],
    ledger: Array.isArray(raw.ledger) ? (raw.ledger as GameState["ledger"]) : [],
    activity: Array.isArray(raw.activity) ? (raw.activity as GameState["activity"]) : [],
    achievements: Array.isArray(raw.achievements) ? (raw.achievements as GameState["achievements"]) : [],
    bosses: Array.isArray(raw.bosses) ? (raw.bosses as GameState["bosses"]) : [],
    routines: Array.isArray(raw.routines) ? (raw.routines as GameState["routines"]) : [],
    settings: { ...DEFAULT_SETTINGS, ...(isRecord(raw.settings) ? raw.settings : {}) } as GameState["settings"],
    lastReview: (raw.lastReview as GameState["lastReview"]) ?? null,
  };
}

export function needsMigration(state: GameState | null | undefined): boolean {
  if (!state) return false;
  if ((state.schemaVersion ?? 1) < SCHEMA_VERSION) return true;
  if (!state.player.experienceLevel) return true;
  if (state.player.stats.energy == null) return true;
  if (state.player.xp > xpRequired(state.player.level)) return true;
  if (state.habits.some((h) => (h.xpReward ?? 0) > MAX_QUEST_XP)) return true;
  return false;
}
