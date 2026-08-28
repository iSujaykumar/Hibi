import type { GameState, Habit, HabitCompletion } from "@/types/hibi";
import { habitStreak } from "@/lib/game/streaks";
import { weeklyCount } from "@/lib/game/engine";
import { localDateId, shiftLocalDate, startOfWeek } from "@/lib/game/dates";

export function todayCompletions(state: GameState, date = localDateId()) {
  return state.completions.filter((c) => c.date === date);
}

export function completionFor(state: GameState, habitId: string, date = localDateId()) {
  return state.completions.find((c) => c.habitId === habitId && c.date === date);
}

export function activeHabits(state: GameState): Habit[] {
  return state.habits.filter((h) => h.active && !h.archived);
}

export function weekProgress(state: GameState, habit: Habit, date = localDateId()) {
  const need = Math.max(1, habit.target || 1);
  const value = weeklyCount(state, habit.id, date);
  return { value, target: need, start: startOfWeek(date) };
}

export function dueToday(state: GameState, date = localDateId()): Habit[] {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return activeHabits(state)
    .filter((h) => {
      if (h.startDate && h.startDate > date) return false;
      if (h.frequency === "monthly") return true;
      if (h.frequency === "weekly" || h.kind === "weekly") {
        const progress = weekProgress(state, h, date);
        const doneToday = Boolean(completionFor(state, h.id, date)?.completed);
        return doneToday || progress.value < progress.target;
      }
      if (h.frequency === "daily") return true;
      return weekday === 1 || Boolean(completionFor(state, h.id, date));
    })
    .sort((a, b) => {
      const kindRank = (k: Habit["kind"]) =>
        k === "daily" ? 3 : k === "weekly" ? 2 : k === "side" ? 0 : 1;
      return kindRank(b.kind) - kindRank(a.kind) || priorityWeight(b.priority) - priorityWeight(a.priority);
    });
}

function priorityWeight(p: Habit["priority"]): number {
  return { low: 0, medium: 1, high: 2, critical: 3 }[p];
}

export function streakOf(state: GameState, habitId: string, date = localDateId()) {
  const dates = state.completions.filter((c) => c.habitId === habitId && c.completed).map((c) => c.date);
  return habitStreak(dates, date);
}

export function dailyProgress(state: GameState, date = localDateId()) {
  const due = dueToday(state, date).filter((h) => h.frequency === "daily" && h.kind !== "side");
  const done = due.filter((h) => completionFor(state, h.id, date)?.completed).length;
  return { done, total: due.length };
}

export function xpToday(state: GameState, date = localDateId()) {
  return state.ledger.filter((l) => l.date === date).reduce((s, l) => s + l.amount, 0);
}

export function weeklyCounts(state: GameState, date = localDateId()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const id = shiftLocalDate(start, i);
    const n = state.completions.filter((c) => c.date === id && c.completed).length;
    return { date: id, count: n, label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ?? "" };
  });
}

export function heatmapValues(state: GameState, days: number, end = localDateId()) {
  const map = new Map<string, number>();
  for (const c of state.completions) {
    if (!c.completed) continue;
    map.set(c.date, (map.get(c.date) ?? 0) + 1);
  }
  const out: { date: string; count: number }[] = [];
  const endDate = new Date(`${end}T12:00:00`);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ date: id, count: map.get(id) ?? 0 });
  }
  return out;
}

export function stepFor(habit: Habit): number {
  if (habit.unit === "ml") return 250;
  if (habit.unit === "steps") return 1000;
  if (habit.unit === "pages") return 5;
  if (habit.unit === "min") return 5;
  if (habit.unit === "hr") return 1;
  if (habit.type === "counter") return Math.max(1, Math.round(habit.target / 10) || 1);
  return 1;
}

export function mostProductiveDay(state: GameState): string {
  const counts = new Map<number, number>();
  for (const c of state.completions) {
    if (!c.completed) continue;
    const day = new Date(`${c.date}T12:00:00`).getDay();
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  let best = 0;
  let bestN = -1;
  for (const [d, n] of counts) {
    if (n > bestN) {
      best = d;
      bestN = n;
    }
  }
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][best] ?? "—";
}

export type CompletionIndex = Map<string, HabitCompletion>;
