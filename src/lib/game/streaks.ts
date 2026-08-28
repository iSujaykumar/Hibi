import { daysBetween, shiftLocalDate } from "./dates.ts";

export type StreakUpdate = {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string;
  usedShield: boolean;
};

// gap of 1 day = continue; gap of 2 + a shield = continue; otherwise reset
export function applyStreakOnComplete(opts: {
  lastStreakDate: string | null;
  currentStreak: number;
  longestStreak: number;
  date: string;
  shields: number;
  protectionEnabled: boolean;
}): StreakUpdate {
  const { date } = opts;
  if (opts.lastStreakDate === date) {
    return {
      currentStreak: Math.max(1, opts.currentStreak),
      longestStreak: Math.max(opts.longestStreak, opts.currentStreak, 1),
      lastStreakDate: date,
      usedShield: false,
    };
  }

  if (!opts.lastStreakDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(opts.longestStreak, 1),
      lastStreakDate: date,
      usedShield: false,
    };
  }

  const gap = daysBetween(opts.lastStreakDate, date);
  if (gap === 1) {
    const next = opts.currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(opts.longestStreak, next),
      lastStreakDate: date,
      usedShield: false,
    };
  }

  if (gap === 2 && opts.protectionEnabled && opts.shields > 0) {
    const next = opts.currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(opts.longestStreak, next),
      lastStreakDate: date,
      usedShield: true,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(opts.longestStreak, 1),
    lastStreakDate: date,
    usedShield: false,
  };
}

export function habitStreak(dates: string[], today: string): { current: number; best: number } {
  const set = new Set(dates);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && daysBetween(prev, d) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  let current = 0;
  let cursor = today;
  if (!set.has(today)) cursor = shiftLocalDate(today, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = shiftLocalDate(cursor, -1);
  }
  return { current, best };
}

export function shieldsEarnedForStreak(streak: number): number {
  if (streak === 7 || streak === 14 || streak === 30 || (streak > 0 && streak % 50 === 0)) {
    return 1;
  }
  return 0;
}
