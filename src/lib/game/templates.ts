import type { CategoryId, Difficulty, Habit, HabitType, PlayerStats } from "../../types/hibi.ts";
import { libraryAsFormTemplates, type QuestTemplate } from "./quest-library.ts";

export type HabitTemplate = {
  name: string;
  description: string;
  icon: string;
  type: HabitType;
  category: CategoryId;
  difficulty: Difficulty;
  target: number;
  unit: string;
  statRewards: Partial<PlayerStats>;
  group: string;
  kind?: Habit["kind"];
  frequency?: Habit["frequency"];
};

export const HABIT_TEMPLATES: HabitTemplate[] = libraryAsFormTemplates();

export const BOSS_TEMPLATES = [
  {
    id: "procrastination",
    name: "The Procrastination Beast",
    description: "Complete 5 deep-work sessions within 7 days.",
    days: 7,
    target: 5,
    category: "productivity" as CategoryId,
    xpReward: 500,
  },
  {
    id: "sleepless",
    name: "The Sleepless Night",
    description: "Protect sleep 5 times this week.",
    days: 7,
    target: 5,
    category: "sleep" as CategoryId,
    xpReward: 400,
  },
  {
    id: "distraction",
    name: "The Distraction",
    description: "Complete 10 focus-coded quests in 10 days.",
    days: 10,
    target: 10,
    category: "productivity" as CategoryId,
    xpReward: 500,
  },
  {
    id: "comfort",
    name: "The Comfort Zone",
    description: "Finish 6 hard or elite quests in 8 days.",
    days: 8,
    target: 6,
    category: "fitness" as CategoryId,
    xpReward: 550,
  },
  {
    id: "chaos",
    name: "The Chaos Week",
    description: "Complete 20 quests in 7 days.",
    days: 7,
    target: 20,
    xpReward: 600,
  },
];

export const ROUTINE_PRESETS: { name: string; description: string; match: string[] }[] = [
  { name: "Morning Awakening", description: "Wake, water, stretch, meditate, plan.", match: ["Rise Check", "Hydration Protocol", "Recovery Protocol", "Still Point", "Dawn Briefing"] },
  { name: "Work Mode", description: "Deep work, study, review.", match: ["Deep Work Raid", "Knowledge Session", "Signal Sweep"] },
  { name: "Night Reset", description: "Space, journal, plan, sleep.", match: ["Surface Reset", "Field Log", "Dawn Briefing", "Lights-Out Gate"] },
];

export function templateToDraft(t: HabitTemplate | QuestTemplate): Partial<Habit> {
  if ("title" in t) {
    return {
      name: t.title,
      description: t.instruction,
      icon: t.icon,
      type: t.type,
      category: t.focus,
      difficulty: t.difficulty,
      target: t.target,
      unit: t.unit,
      statRewards: t.statRewards,
      kind: t.kind,
      frequency: t.frequency,
      priority: t.difficulty === "elite" || t.difficulty === "hard" ? "high" : "medium",
      templateId: t.id,
    };
  }
  return {
    name: t.name,
    description: t.description,
    icon: t.icon,
    type: t.type,
    category: t.category,
    difficulty: t.difficulty,
    target: t.target,
    unit: t.unit,
    statRewards: t.statRewards,
    kind: t.kind ?? "daily",
    frequency: t.frequency ?? "daily",
    priority: t.difficulty === "elite" || t.difficulty === "hard" ? "high" : "medium",
  };
}
