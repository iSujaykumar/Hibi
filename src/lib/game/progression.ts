import type { Archetype, PlayDifficulty, PlayerStats, RankId, StatKey } from "../../types/hibi.ts";
import { ALL_STAT_KEYS, STAT_KEYS } from "../../types/hibi.ts";
import { ARCHETYPE_CONFIG, canonicalPlayDifficulty } from "./config.ts";

export const MAX_LEVEL = 400;
export const MAX_QUEST_XP = 500;
export const MAX_STAT_REWARD = 5;
export const MAX_XP_AWARD = 1000;

export function clampInt(n: unknown, min: number, max: number, fallback = min): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

export function clampQuestXp(n: unknown): number {
  return clampInt(n, 1, MAX_QUEST_XP, 20);
}

export function clampStatReward(n: unknown): number {
  return clampInt(n, 0, MAX_STAT_REWARD, 0);
}

export function xpRequired(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return Math.round(100 * Math.pow(lvl, 1.18));
}

export function totalXpToReach(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i += 1) total += xpRequired(i);
  return total;
}

export function progressFromTotalXp(totalXp: number): {
  level: number;
  xp: number;
  needed: number;
} {
  const xp = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number(totalXp) || 0)));
  let level = 1;
  let remaining = xp;
  while (level < MAX_LEVEL) {
    const need = xpRequired(level);
    if (remaining < need) return { level, xp: remaining, needed: need };
    remaining -= need;
    level += 1;
  }
  const need = xpRequired(level);
  return { level, xp: Math.min(remaining, need), needed: need };
}

export function maxTotalXp(): number {
  return totalXpToReach(MAX_LEVEL) + xpRequired(MAX_LEVEL);
}

export const RANK_ORDER: RankId[] = ["E", "D", "C", "B", "A", "S", "SS", "SSS", "EX"];

export const RANK_REQUIREMENTS: { rank: RankId; level: number; achievements: number }[] = [
  { rank: "E", level: 1, achievements: 0 },
  { rank: "D", level: 5, achievements: 3 },
  { rank: "C", level: 15, achievements: 7 },
  { rank: "B", level: 30, achievements: 15 },
  { rank: "A", level: 50, achievements: 25 },
  { rank: "S", level: 75, achievements: 40 },
  { rank: "SS", level: 100, achievements: 55 },
  { rank: "SSS", level: 130, achievements: 70 },
  { rank: "EX", level: 170, achievements: 90 },
];

export function rankFor(level: number, achievementCount: number): RankId {
  let current: RankId = "E";
  for (const req of RANK_REQUIREMENTS) {
    if (level >= req.level && achievementCount >= req.achievements) current = req.rank;
  }
  return current;
}

export function nextRankRequirement(rank: RankId): {
  rank: RankId;
  level: number;
  achievements: number;
} | null {
  const idx = RANK_ORDER.indexOf(rank);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return null;
  return RANK_REQUIREMENTS[idx + 1] ?? null;
}

export function difficultyXpBase(difficulty: "easy" | "normal" | "hard" | "elite"): number {
  switch (difficulty) {
    case "easy":
      return 20;
    case "normal":
      return 45;
    case "hard":
      return 90;
    case "elite":
      return 200;
  }
}

export function playDifficultyMultiplier(play: PlayDifficulty): number {
  switch (canonicalPlayDifficulty(play)) {
    case "initiate":
      return 1.2;
    case "elite":
      return 0.9;
    case "ascendant":
      return 0.85;
    default:
      return 1;
  }
}

export function streakBonus(streak: number): number {
  if (streak >= 30) return 0.25;
  if (streak >= 14) return 0.15;
  if (streak >= 7) return 0.1;
  if (streak >= 3) return 0.05;
  return 0;
}

export function comboBonus(combo: number): number {
  if (combo >= 8) return 0.25;
  if (combo >= 5) return 0.2;
  if (combo >= 3) return 0.1;
  if (combo >= 2) return 0.05;
  return 0;
}

export function computeXpAward(opts: {
  base: number;
  playDifficulty: PlayDifficulty;
  streak: number;
  combo: number;
}): number {
  const base = clampQuestXp(opts.base);
  const bonus = Math.min(0.4, streakBonus(opts.streak) + comboBonus(opts.combo));
  const raw = base * playDifficultyMultiplier(opts.playDifficulty) * (1 + bonus);
  return clampInt(Math.round(raw), 1, MAX_XP_AWARD, 1);
}

export function mergeStats(base: PlayerStats, delta: Partial<PlayerStats>): PlayerStats {
  const next = { ...base };
  for (const key of ALL_STAT_KEYS) {
    const add = delta[key] ?? 0;
    next[key] = Math.max(0, (next[key] ?? 0) + add);
  }
  return next;
}

export function archetypeStatBoost(archetype: Archetype): Partial<PlayerStats> {
  return ARCHETYPE_CONFIG[archetype]?.startingStats ?? { willpower: 2, focus: 1 };
}

export function autoStatGainsForLevel(level: number): Partial<PlayerStats> {
  const keys: StatKey[] = STAT_KEYS;
  const primary = keys[level % keys.length];
  const secondary = keys[(level * 3) % keys.length];
  return { [primary]: 1, [secondary]: 1 };
}

export function applyStatRewards(base: PlayerStats, delta: Partial<PlayerStats>): PlayerStats {
  const mapped: Partial<PlayerStats> = { ...delta };
  if (delta.vitality) mapped.energy = (mapped.energy ?? 0) + delta.vitality;
  if (delta.discipline) mapped.willpower = (mapped.willpower ?? 0) + delta.discipline;
  if (delta.consistency) mapped.willpower = (mapped.willpower ?? 0) + delta.consistency;
  return mergeStats(base, mapped);
}

export function dailyRating(completed: number, total: number): "S" | "A" | "B" | "C" | "D" {
  if (total <= 0) return "C";
  const ratio = completed / total;
  if (ratio >= 1) return "S";
  if (ratio >= 0.8) return "A";
  if (ratio >= 0.6) return "B";
  if (ratio >= 0.4) return "C";
  return "D";
}
