import type { GameState, Rarity } from "../../types/hibi.ts";
import { STAT_KEYS } from "../../types/hibi.ts";

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  xp: number;
  secret?: boolean;
  title?: string;
  check: (state: GameState) => boolean;
};

function completedCount(state: GameState): number {
  return state.completions.filter((c) => c.completed).length;
}

function completedByCategory(state: GameState, category: string): number {
  const ids = new Set(state.habits.filter((h) => h.category === category).map((h) => h.id));
  return state.completions.filter((c) => c.completed && ids.has(c.habitId)).length;
}

function hardCompletions(state: GameState): number {
  const hard = new Set(
    state.habits.filter((h) => h.difficulty === "hard" || h.difficulty === "elite").map((h) => h.id),
  );
  return state.completions.filter((c) => c.completed && hard.has(c.habitId)).length;
}

function perfectDailyDays(state: GameState): number {
  const dailyIds = state.habits.filter((h) => h.frequency === "daily" && h.active && !h.archived).map((h) => h.id);
  if (dailyIds.length === 0) return 0;
  const byDate = new Map<string, Set<string>>();
  for (const c of state.completions) {
    if (!c.completed) continue;
    if (!dailyIds.includes(c.habitId)) continue;
    const set = byDate.get(c.date) ?? new Set();
    set.add(c.habitId);
    byDate.set(c.date, set);
  }
  let n = 0;
  for (const set of byDate.values()) {
    if (set.size >= dailyIds.length) n += 1;
  }
  return n;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_blood",
    name: "First Blood",
    description: "Complete your first quest.",
    rarity: "common",
    xp: 25,
    check: (s) => completedCount(s) >= 1,
  },
  {
    id: "awakened",
    name: "Awakened",
    description: "Reach level 5.",
    rarity: "uncommon",
    xp: 50,
    check: (s) => s.player.level >= 5,
  },
  {
    id: "consistent",
    name: "Consistent",
    description: "Maintain a 7-day streak.",
    rarity: "uncommon",
    xp: 80,
    title: "the_consistent",
    check: (s) => s.player.longestStreak >= 7 || s.player.currentStreak >= 7,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 30-day streak.",
    rarity: "epic",
    xp: 200,
    title: "the_relentless",
    check: (s) => s.player.longestStreak >= 30 || s.player.currentStreak >= 30,
  },
  {
    id: "century",
    name: "Century",
    description: "Complete 100 quests.",
    rarity: "rare",
    xp: 150,
    check: (s) => completedCount(s) >= 100,
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Complete 50 difficult quests.",
    rarity: "epic",
    xp: 180,
    title: "iron_will",
    check: (s) => hardCompletions(s) >= 50,
  },
  {
    id: "early_riser",
    name: "Early Riser",
    description: "Complete 20 morning-coded health or sleep quests.",
    rarity: "rare",
    xp: 120,
    title: "early_riser",
    check: (s) => completedByCategory(s, "sleep") + completedByCategory(s, "health") >= 20,
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Complete 50 learning sessions.",
    rarity: "rare",
    xp: 140,
    title: "the_scholar",
    check: (s) => completedByCategory(s, "study") >= 50,
  },
  {
    id: "relentless",
    name: "Relentless",
    description: "Complete every daily quest for 14 days.",
    rarity: "legendary",
    xp: 300,
    check: (s) => perfectDailyDays(s) >= 14,
  },
  {
    id: "pathfinder",
    name: "Pathfinder",
    description: "Create 8 unique quests.",
    rarity: "uncommon",
    xp: 60,
    title: "the_pathfinder",
    check: (s) => s.habits.length >= 8,
  },
  {
    id: "strategist",
    name: "Strategist",
    description: "Reach Rank C.",
    rarity: "rare",
    xp: 160,
    title: "the_strategist",
    check: (s) => ["C", "B", "A", "S", "SS", "SSS", "EX"].includes(s.player.rank),
  },
  {
    id: "body_tempered",
    name: "Body Tempered",
    description: "Complete 30 fitness quests.",
    rarity: "uncommon",
    xp: 90,
    check: (s) => completedByCategory(s, "fitness") >= 30,
  },
  {
    id: "still_mind",
    name: "Still Mind",
    description: "Complete 20 mind quests.",
    rarity: "uncommon",
    xp: 90,
    check: (s) => completedByCategory(s, "mind") >= 20,
  },
  {
    id: "deep_focus",
    name: "Deep Focus",
    description: "Raise Focus to 20.",
    rarity: "rare",
    xp: 110,
    check: (s) => s.player.stats.focus >= 20,
  },
  {
    id: "titan",
    name: "Titan",
    description: "Reach level 30.",
    rarity: "epic",
    xp: 250,
    check: (s) => s.player.level >= 30,
  },
  {
    id: "sovereign",
    name: "Sovereign",
    description: "Reach Rank A.",
    rarity: "legendary",
    xp: 400,
    check: (s) => ["A", "S", "SS", "SSS", "EX"].includes(s.player.rank),
  },
  {
    id: "boss_breaker",
    name: "Time Breaker",
    description: "Defeat a boss challenge.",
    rarity: "epic",
    xp: 180,
    check: (s) => s.bosses.some((b) => b.defeated),
  },
  {
    id: "collector",
    name: "Collector",
    description: "Unlock 10 achievements.",
    rarity: "rare",
    xp: 100,
    check: (s) => s.achievements.length >= 10,
  },
  {
    id: "balanced",
    name: "Balanced Form",
    description: "Have every attribute at 10 or higher.",
    rarity: "epic",
    xp: 200,
    check: (s) => STAT_KEYS.every((k) => s.player.stats[k] >= 10),
  },
  {
    id: "shadow_step",
    name: "Shadow Step",
    description: "Complete 5 quests in a single day.",
    rarity: "uncommon",
    xp: 70,
    secret: true,
    check: (s) => {
      const byDate = new Map<string, number>();
      for (const c of s.completions) {
        if (!c.completed) continue;
        byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
      }
      return [...byDate.values()].some((n) => n >= 5);
    },
  },
  {
    id: "mythic_will",
    name: "Beyond the Gate",
    description: "Reach Rank S.",
    rarity: "mythic",
    xp: 800,
    secret: true,
    check: (s) => ["S", "SS", "SSS", "EX"].includes(s.player.rank),
  },
];

export const TITLES: { id: string; name: string }[] = [
  { id: "beginner", name: "The Beginner" },
  { id: "the_consistent", name: "The Consistent" },
  { id: "the_scholar", name: "The Scholar" },
  { id: "early_riser", name: "The Early Riser" },
  { id: "iron_will", name: "The Iron Will" },
  { id: "the_pathfinder", name: "The Pathfinder" },
  { id: "the_relentless", name: "The Relentless" },
  { id: "the_strategist", name: "The Strategist" },
];

export function titleName(id: string | null | undefined): string {
  if (!id) return "The Beginner";
  return TITLES.find((t) => t.id === id)?.name ?? id;
}

export function evaluateAchievements(state: GameState): AchievementDef[] {
  const unlocked = new Set(state.achievements.map((a) => a.id));
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(state));
}
