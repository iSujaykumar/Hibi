import type { Habit } from "../types/hibi.ts";
import { localDateId } from "./game/dates.ts";
import { difficultyXpBase } from "./game/progression.ts";
import { uid } from "./utils.ts";

export function makeHabit(partial: Partial<Habit> & { name: string }): Habit {
  const now = new Date().toISOString();
  const type = partial.type ?? "binary";
  const difficulty = partial.difficulty ?? "normal";
  return {
    id: partial.id ?? uid(),
    name: partial.name.trim(),
    description: partial.description ?? "",
    icon: partial.icon ?? "target",
    type,
    kind: partial.kind ?? "daily",
    category: partial.category ?? "custom",
    difficulty,
    frequency: partial.frequency ?? "daily",
    target: partial.target ?? 1,
    unit: partial.unit ?? "",
    xpReward: partial.xpReward ?? difficultyXpBase(difficulty),
    statRewards: partial.statRewards ?? {},
    priority: partial.priority ?? "medium",
    color: partial.color ?? "cyan",
    reminder: partial.reminder ?? null,
    startDate: partial.startDate ?? localDateId(),
    active: partial.active ?? true,
    archived: false,
    negative: type === "negative",
    createdAt: now,
    updatedAt: now,
    templateId: partial.templateId,
  };
}

export function starsFor(difficulty: Habit["difficulty"]): number {
  switch (difficulty) {
    case "easy":
      return 1;
    case "normal":
      return 2;
    case "hard":
      return 3;
    case "elite":
      return 4;
  }
}
