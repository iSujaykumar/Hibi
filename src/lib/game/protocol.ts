import type {
  Archetype,
  CanonicalPlayDifficulty,
  CategoryId,
  ChallengePreference,
  Difficulty,
  ExperienceLevel,
  Habit,
  PlayDifficulty,
  StatKey,
  TimeAvailability,
} from "../../types/hibi.ts";
import {
  canonicalPlayDifficulty,
  FOCUS_CONFIG,
  isFocusId,
  questLoadFor,
  statsForFocus,
  type FocusId,
} from "./config.ts";
import { QUEST_LIBRARY, habitFromTemplate, type QuestTemplate } from "./quest-library.ts";

export type ProtocolInput = {
  focus: CategoryId;
  archetype: Archetype;
  difficulty: PlayDifficulty;
  experience: ExperienceLevel;
  availableTime: TimeAvailability;
  challengePreference: ChallengePreference;
  seed?: string;
};

export type GeneratedProtocol = {
  habits: Habit[];
  templates: QuestTemplate[];
  dailyCount: number;
  weeklyCount: number;
  sideCount: number;
  estimatedMin: { min: number; max: number };
  dailyXp: number;
  weeklyXp: number;
  primaryStats: StatKey[];
  secondaryStats: StatKey[];
  focus: FocusId;
  archetype: Archetype;
  difficulty: CanonicalPlayDifficulty;
};

const DIFF_RANK: Record<Difficulty, number> = { easy: 0, normal: 1, hard: 2, elite: 3 };

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function preferredDifficulties(play: CanonicalPlayDifficulty, experience: ExperienceLevel): Difficulty[] {
  const base = {
    initiate: ["easy"] as Difficulty[],
    adventurer: ["easy", "normal"] as Difficulty[],
    elite: ["normal", "hard"] as Difficulty[],
    ascendant: ["hard", "elite"] as Difficulty[],
  }[play];
  if (experience === "beginner" && play !== "initiate") return ["easy", ...base];
  if (experience === "expert" && play === "initiate") return ["easy", "normal"];
  return base;
}

function scoreTemplate(t: QuestTemplate, input: ProtocolInput, play: CanonicalPlayDifficulty, preferred: Difficulty[]): number {
  let score = 0;
  if (t.focus === input.focus) score += 12;
  else score += 2;
  if (t.archetypes.length === 0) score += 1;
  else if (t.archetypes.includes(input.archetype)) score += 6;
  else score += -1;
  const idx = preferred.indexOf(t.difficulty);
  if (idx === 0) score += 8;
  else if (idx === 1) score += 3;
  else if (idx >= 0) score += 1;
  else {
    const want = DIFF_RANK[preferred[0] ?? "easy"];
    const gap = Math.abs(DIFF_RANK[t.difficulty] - want);
    score -= gap * 4;
  }
  if (input.challengePreference === "gentle" && t.difficulty === "easy") score += 1;
  if (input.challengePreference === "push" && (t.difficulty === "hard" || t.difficulty === "elite")) score += 1;
  return score;
}

function pickUnique(
  pool: QuestTemplate[],
  count: number,
  used: Set<string>,
  rng: () => number,
): QuestTemplate[] {
  const out: QuestTemplate[] = [];
  const usedTags = new Set<string>();
  const rest = [...pool];
  while (out.length < count && rest.length > 0) {
    rest.sort((a, b) => {
      const tagPenalty = (t: QuestTemplate) => t.tags.filter((tag) => usedTags.has(tag)).length;
      const d = tagPenalty(a) - tagPenalty(b) || b.xp - a.xp;
      return d;
    });
    const window = rest.slice(0, Math.min(count <= 1 ? 2 : 3, rest.length));
    const choice = window[Math.floor(rng() * window.length)] ?? rest[0];
    if (!choice) break;
    const i = rest.indexOf(choice);
    rest.splice(i, 1);
    if (used.has(choice.id)) continue;
    used.add(choice.id);
    for (const tag of choice.tags) usedTags.add(tag);
    out.push(choice);
  }
  return out;
}

function poolFor(focus: FocusId, kind: QuestTemplate["kind"], preferred: Difficulty[], extraFocuses: FocusId[]): QuestTemplate[] {
  const focuses = new Set<string>([focus, ...extraFocuses]);
  const exact = QUEST_LIBRARY.filter((t) => t.kind === kind && t.focus === focus && preferred.includes(t.difficulty));
  if (exact.length >= 1) return exact;
  const sameFocus = QUEST_LIBRARY.filter((t) => t.kind === kind && t.focus === focus);
  if (sameFocus.length >= 2) return sameFocus;
  return QUEST_LIBRARY.filter((t) => t.kind === kind && focuses.has(t.focus));
}

export function generateProtocol(input: ProtocolInput): GeneratedProtocol {
  const focus: FocusId = isFocusId(input.focus) ? input.focus : "growth";
  const play = canonicalPlayDifficulty(input.difficulty);
  const preferred = preferredDifficulties(play, input.experience);
  const load = questLoadFor({ difficulty: play, availableTime: input.availableTime });
  const cfg = FOCUS_CONFIG[focus];
  const rng = mulberry32(hashSeed(`${input.seed ?? ""}|${focus}|${input.archetype}|${play}|${input.experience}|${input.availableTime}|${input.challengePreference}`));

  const scored = (kind: QuestTemplate["kind"]) => {
    const pool = poolFor(focus, kind, preferred, cfg.adjacentFocuses);
    return [...pool].sort((a, b) => scoreTemplate(b, input, play, preferred) - scoreTemplate(a, input, play, preferred));
  };

  const used = new Set<string>();
  const dailies = pickUnique(scored("daily"), load.daily, used, rng);
  const weeklies = pickUnique(scored("weekly"), load.weekly, used, rng);
  const sides = load.side > 0 ? pickUnique(scored("side"), load.side, used, rng) : [];

  if (dailies.length === 0) {
    const fallback = QUEST_LIBRARY.filter((t) => t.focus === focus && t.kind === "daily").slice(0, 2);
    for (const t of fallback) {
      if (!used.has(t.id)) {
        dailies.push(t);
        used.add(t.id);
      }
    }
  }
  if (weeklies.length === 0) {
    const fallback = QUEST_LIBRARY.find((t) => t.focus === focus && t.kind === "weekly");
    if (fallback && !used.has(fallback.id)) weeklies.push(fallback);
  }

  const templates = [...dailies, ...weeklies, ...sides];
  const habits = templates.map((t) => habitFromTemplate(t));
  const dailyXp = dailies.reduce((s, t) => s + t.xp, 0);
  const weeklyXp = weeklies.reduce((s, t) => s + t.xp, 0);
  const minutes = dailies.reduce((s, t) => s + t.durationMin, 0);
  const { primary, secondary } = statsForFocus(focus);

  return {
    habits,
    templates,
    dailyCount: dailies.length,
    weeklyCount: weeklies.length,
    sideCount: sides.length,
    estimatedMin: { min: Math.max(10, minutes - 8), max: minutes + 10 },
    dailyXp,
    weeklyXp,
    primaryStats: primary,
    secondaryStats: secondary,
    focus,
    archetype: input.archetype,
    difficulty: play,
  };
}

export function replacementCandidates(current: QuestTemplate, input: ProtocolInput): QuestTemplate[] {
  const play = canonicalPlayDifficulty(input.difficulty);
  const preferred = preferredDifficulties(play, input.experience);
  return QUEST_LIBRARY.filter(
    (t) =>
      t.id !== current.id &&
      t.kind === current.kind &&
      (t.focus === current.focus || t.focus === input.focus) &&
      (preferred.includes(t.difficulty) || t.difficulty === current.difficulty),
  );
}

export function swapTemplate(current: QuestTemplate, input: ProtocolInput, excludedIds: string[]): QuestTemplate {
  const candidates = replacementCandidates(current, input).filter((t) => !excludedIds.includes(t.id));
  if (candidates.length === 0) return current;
  const seed = hashSeed(`${input.seed ?? ""}|swap|${current.id}|${excludedIds.join(",")}`);
  return candidates[seed % candidates.length] ?? current;
}

/**
 * Adaptive hint — used by recommendations, not auto-applied.
 * Repeated success nudges up; repeated misses nudge toward a lighter load.
 */
export function adaptiveHint(opts: {
  completionRate14: number;
  current: CanonicalPlayDifficulty;
}): CanonicalPlayDifficulty | null {
  const order: CanonicalPlayDifficulty[] = ["initiate", "adventurer", "elite", "ascendant"];
  const idx = order.indexOf(opts.current);
  if (idx < 0) return null;
  if (opts.completionRate14 >= 0.9 && idx < order.length - 1) return order[idx + 1] ?? null;
  if (opts.completionRate14 < 0.4 && idx > 0) return order[idx - 1] ?? null;
  return null;
}
