import type { GameState } from "../../types/hibi.ts";
import { canonicalPlayDifficulty } from "./config.ts";
import { adaptiveHint } from "./protocol.ts";
import { habitStreak } from "./streaks.ts";
import { localDateId, shiftLocalDate } from "./dates.ts";

export type SystemRecommendation = {
  id: string;
  title: string;
  body: string;
};

export function recommendations(state: GameState, today = localDateId()): SystemRecommendation[] {
  const out: SystemRecommendation[] = [];
  const active = state.habits.filter((h) => h.active && !h.archived);

  if (active.length === 0) {
    out.push({
      id: "empty",
      title: "Protocol idle",
      body: "No quests are active. Generate a starting protocol from your focus, or create a custom quest.",
    });
    return out;
  }

  if (active.length > 12) {
    out.push({
      id: "too_many",
      title: "System recommendation",
      body: "Many quests are active. Consider consolidating into a smaller daily board.",
    });
  }

  const last14 = Array.from({ length: 14 }, (_, i) => shiftLocalDate(today, -i));
  let hits = 0;
  let possible = 0;
  for (const habit of active) {
    const dates = state.completions
      .filter((c) => c.habitId === habit.id && c.completed)
      .map((c) => c.date);
    const { current } = habitStreak(dates, today);
    const habitHits = last14.filter((d) => dates.includes(d)).length;
    const rate = habitHits / 14;
    hits += habitHits;
    possible += 14;

    if (rate < 0.4 && dates.length >= 5) {
      out.push({
        id: `reduce-${habit.id}`,
        title: "Ease the load",
        body: `${habit.name} is landing below 40%. Lower the difficulty or pause it — a missed day is not a verdict.`,
      });
    } else if (rate > 0.9 && current >= 14) {
      out.push({
        id: `raise-${habit.id}`,
        title: "Ready to climb",
        body: `${habit.name} is stable. You can raise the difficulty when you want more challenge.`,
      });
    }
  }

  const overall = possible > 0 ? hits / possible : 0;
  const hint = adaptiveHint({
    completionRate14: overall,
    current: canonicalPlayDifficulty(state.player.playDifficulty),
  });
  if (hint) {
    out.push({
      id: "adaptive",
      title: hint === canonicalPlayDifficulty(state.player.playDifficulty) ? "Hold" : "Adaptive note",
      body:
        overall >= 0.9
          ? `Your protocol is holding. ${hint[0]?.toUpperCase()}${hint.slice(1)} is available when you want more challenge.`
          : `Recent completions are light. Dropping toward ${hint} keeps the path sustainable — come back when you're ready.`,
    });
  }

  const todayDone = state.completions.filter((c) => c.date === today && c.completed).length;
  if (todayDone === 0 && active.length > 0) {
    out.push({
      id: "start-today",
      title: "Next action",
      body: "No quests completed today. Start with the smallest one.",
    });
  }

  return out.slice(0, 3);
}
