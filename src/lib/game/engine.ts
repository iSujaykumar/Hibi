import type {
  ActivityEvent,
  Boss,
  EngineEvent,
  GameState,
  Habit,
  HabitCompletion,
  Player,
  PlayerStats,
  Routine,
} from "../../types/hibi.ts";
import { uid } from "../utils.ts";
import { evaluateAchievements, titleName } from "./achievements.ts";
import { localDateId, shiftLocalDate, startOfWeek } from "./dates.ts";
import {
  applyStatRewards,
  autoStatGainsForLevel,
  computeXpAward,
  dailyRating,
  difficultyXpBase,
  mergeStats,
  nextRankRequirement,
  progressFromTotalXp,
  rankFor,
} from "./progression.ts";
import { applyStreakOnComplete, shieldsEarnedForStreak } from "./streaks.ts";

function nowIso(): string {
  return new Date().toISOString();
}

function logEvent(kind: ActivityEvent["kind"], title: string, detail: string): ActivityEvent {
  return { id: uid(), at: nowIso(), kind, title, detail };
}

function completionId(habitId: string, date: string): string {
  return `${habitId}:${date}`;
}

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

function addXp(player: Player, amount: number, events: EngineEvent[]): Player {
  if (amount <= 0) return player;
  const before = player.level;
  const totalXp = player.totalXp + amount;
  const { level, xp, needed: _needed } = progressFromTotalXp(totalXp);
  let stats = { ...player.stats };
  let unspent = player.unspentStatPoints;
  for (let lvl = before + 1; lvl <= level; lvl += 1) {
    const gains = autoStatGainsForLevel(lvl);
    stats = mergeStats(stats, gains);
    unspent += 3;
    events.push({ type: "level_up", from: lvl - 1, to: lvl, statGains: gains });
  }
  return {
    ...player,
    totalXp,
    xp,
    level,
    stats,
    unspentStatPoints: unspent,
    updatedAt: nowIso(),
  };
}

function applyRank(state: GameState, events: EngineEvent[]): GameState {
  const next = rankFor(state.player.level, state.achievements.length);
  if (next !== state.player.rank) {
    events.push({ type: "rank_up", from: state.player.rank, to: next });
    return { ...state, player: { ...state.player, rank: next, updatedAt: nowIso() } };
  }
  return state;
}

function grantAchievements(state: GameState, events: EngineEvent[]): GameState {
  let current = state;
  // Loop so achievements that depend on other unlocks can resolve in one tick.
  for (let i = 0; i < 4; i += 1) {
    const unlocked = evaluateAchievements(current);
    if (unlocked.length === 0) break;
    for (const a of unlocked) {
      current = {
        ...current,
        achievements: [...current.achievements, { id: a.id, unlockedAt: nowIso() }],
        activity: [
          logEvent("achievement", "Achievement unlocked", a.name),
          ...current.activity,
        ].slice(0, 200),
      };
      events.push({ type: "achievement", id: a.id, name: a.name, rarity: a.rarity, xp: a.xp });
      if (a.xp > 0) {
        const player = addXp(current.player, a.xp, events);
        current = {
          ...current,
          player,
          ledger: [
            {
              id: uid(),
              date: localDateId(),
              amount: a.xp,
              source: `Achievement: ${a.name}`,
              createdAt: nowIso(),
            },
            ...current.ledger,
          ],
        };
      }
      if (a.title && !current.player.unlockedTitles.includes(a.title)) {
        current = {
          ...current,
          player: {
            ...current.player,
            unlockedTitles: [...current.player.unlockedTitles, a.title],
          },
        };
        events.push({ type: "title_unlocked", id: a.title, name: titleName(a.title) });
      }
    }
  }
  return applyRank(current, events);
}

function targetFor(habit: Habit): number {
  if (habit.type === "binary" || habit.type === "negative") return 1;
  return Math.max(1, habit.target || 1);
}

function isCompleteValue(habit: Habit, value: number): boolean {
  return value >= targetFor(habit);
}

function isWeeklyHabit(habit: Habit): boolean {
  return habit.frequency === "weekly" || habit.kind === "weekly";
}

function weekLedgerSource(habitId: string, date: string): string {
  return `weekly:${habitId}:${startOfWeek(date)}`;
}

export function weeklyCount(state: GameState, habitId: string, date: string): number {
  const start = startOfWeek(date);
  const end = shiftLocalDate(start, 6);
  return state.completions.filter(
    (c) => c.habitId === habitId && c.completed && c.date >= start && c.date <= end,
  ).length;
}

function dailyHabits(state: GameState): Habit[] {
  return state.habits.filter(
    (h) =>
      h.active &&
      !h.archived &&
      h.frequency === "daily" &&
      h.kind !== "side" &&
      h.kind !== "challenge" &&
      h.kind !== "boss",
  );
}

function maybeDailyBonus(state: GameState, date: string, events: EngineEvent[]): GameState {
  if (state.player.lastDailyBonusDate === date) return state;
  const dailies = dailyHabits(state);
  if (dailies.length === 0) return state;
  const done = dailies.every((h) =>
    state.completions.some((c) => c.habitId === h.id && c.date === date && c.completed),
  );
  if (!done) return state;
  const xp = 150;
  events.push({ type: "daily_bonus", xp });
  const player = addXp(
    { ...state.player, lastDailyBonusDate: date },
    xp,
    events,
  );
  return {
    ...state,
    player,
    ledger: [
      { id: uid(), date, amount: xp, source: "Daily bonus", createdAt: nowIso() },
      ...state.ledger,
    ],
    activity: [
      logEvent("bonus", "Daily bonus", `+${xp} XP`),
      ...state.activity,
    ].slice(0, 200),
  };
}

function maybeRoutineBonus(state: GameState, date: string, events: EngineEvent[]): GameState {
  let current = state;
  for (const routine of state.routines) {
    if (routine.habitIds.length === 0) continue;
    const flag = `routine:${routine.id}:${date}`;
    if (current.ledger.some((l) => l.source === flag)) continue;
    const allDone = routine.habitIds.every((id) =>
      current.completions.some((c) => c.habitId === id && c.date === date && c.completed),
    );
    if (!allDone) continue;
    const xp = routine.bonusXp;
    events.push({ type: "routine_bonus", name: routine.name, xp });
    current = {
      ...current,
      player: addXp(current.player, xp, events),
      ledger: [
        { id: uid(), date, amount: xp, source: flag, createdAt: nowIso() },
        ...current.ledger,
      ],
    };
  }
  return current;
}

function tickBosses(state: GameState, habit: Habit, date: string, events: EngineEvent[]): GameState {
  const bosses = state.bosses.map((boss) => {
    if (boss.defeated) return boss;
    if (date < boss.startDate || date > boss.endDate) return boss;
    let match = false;
    if (boss.habitId) match = habit.id === boss.habitId;
    else if (boss.category) match = habit.category === boss.category;
    else match = true;
    if (!match) return boss;
    const progress = Math.min(boss.target, boss.progress + 1);
    const defeated = progress >= boss.target;
    const next: Boss = {
      ...boss,
      progress,
      defeated,
      defeatedAt: defeated ? nowIso() : boss.defeatedAt,
    };
    if (defeated && !boss.defeated) {
      events.push({ type: "boss_defeated", name: boss.name, xp: boss.xpReward });
    }
    return next;
  });
  let current: GameState = { ...state, bosses };
  for (const ev of events) {
    if (ev.type === "boss_defeated") {
      current = {
        ...current,
        player: addXp(current.player, ev.xp, events),
        ledger: [
          {
            id: uid(),
            date,
            amount: ev.xp,
            source: `Boss: ${ev.name}`,
            createdAt: nowIso(),
          },
          ...current.ledger,
        ],
        activity: [
          logEvent("boss", "Boss defeated", ev.name),
          ...current.activity,
        ].slice(0, 200),
      };
    }
  }
  return current;
}

export function dailyTick(state: GameState, today = localDateId()): GameState {
  const player = { ...state.player };
  if (player.lastActiveDate === today) {
    return state;
  }
  const yesterday = shiftLocalDate(today, -1);
  if (player.lastStreakDate && player.lastStreakDate !== today && player.lastStreakDate !== yesterday) {
    player.pendingMissDate = shiftLocalDate(player.lastStreakDate, 1);
  }
  const created = player.createdAt ? player.createdAt.slice(0, 10) : today;
  const origin = created.includes("-") && created.length === 10 ? created : today;
  const dayCount = Math.max(1, Math.floor((Date.parse(`${today}T12:00:00`) - Date.parse(`${origin}T12:00:00`)) / 86_400_000) + 1);
  player.dayCount = Number.isFinite(dayCount) ? dayCount : player.dayCount + 1;
  player.lastActiveDate = today;
  player.comboCount = 0;
  player.comboDate = today;
  player.updatedAt = nowIso();

  const yCompletions = state.completions.filter((c) => c.date === yesterday && c.completed);
  const yDailies = dailyHabits(state);
  const yXp = state.ledger.filter((l) => l.date === yesterday).reduce((s, l) => s + l.amount, 0);
  const review =
    player.lastDailyReviewDate === yesterday
      ? state.lastReview
      : {
          date: yesterday,
          completed: yCompletions.length,
          total: Math.max(yDailies.length, yCompletions.length),
          xp: yXp,
          bestStat: null,
          streak: player.currentStreak,
          rating: dailyRating(yCompletions.length, Math.max(yDailies.length, 1)),
        };

  return { ...state, player, lastReview: review };
}

export function completeHabit(
  state: GameState,
  habitId: string,
  opts: { date?: string; value?: number; increment?: number } = {},
): { state: GameState; events: EngineEvent[] } {
  const events: EngineEvent[] = [];
  const date = opts.date ?? localDateId();
  const habit = state.habits.find((h) => h.id === habitId && h.active && !h.archived);
  if (!habit) return { state, events };

  let next = cloneState(state);
  const id = completionId(habitId, date);
  const existing = next.completions.find((c) => c.id === id);

  const weekly = isWeeklyHabit(habit);
  let value = existing?.value ?? 0;
  if (opts.increment != null) value += opts.increment;
  else if (opts.value != null) value = opts.value;
  else if (habit.type === "binary" || habit.type === "negative" || weekly) value = 1;
  else value = Math.max(value, targetFor(habit));

  const dayDone = weekly ? value >= 1 : isCompleteValue(habit, value);

  if (existing?.completed) {
    events.push({ type: "already_complete", habitId });
    return { state, events };
  }

  const record: HabitCompletion = {
    id,
    habitId,
    date,
    value,
    completed: dayDone,
    xpEarned: existing?.xpEarned ?? 0,
    createdAt: existing?.createdAt ?? nowIso(),
  };

  next.completions = [record, ...next.completions.filter((c) => c.id !== id)];

  if (!dayDone) {
    events.push({ type: "progress", habitId, value, target: weekly ? 1 : targetFor(habit) });
    return { state: next, events };
  }

  if (weekly) {
    const count = weeklyCount(next, habitId, date);
    const need = Math.max(1, habit.target || 1);
    const weekSource = weekLedgerSource(habitId, date);
    const alreadyAwarded = next.ledger.some((l) => l.source === weekSource);
    if (count < need) {
      events.push({ type: "progress", habitId, value: count, target: need });
      return { state: next, events };
    }
    if (alreadyAwarded) {
      events.push({ type: "already_complete", habitId });
      return { state: next, events };
    }
  }

  const comboDate = next.player.comboDate === date ? next.player.comboCount : 0;
  const combo = comboDate + 1;
  const streakPreview = Math.max(next.player.currentStreak, 1);
  const xp = computeXpAward({
    base: habit.xpReward || difficultyXpBase(habit.difficulty),
    playDifficulty: next.player.playDifficulty,
    streak: streakPreview,
    combo,
  });

  record.xpEarned = xp;
  next.completions = [record, ...next.completions.filter((c) => c.id !== id)];

  const streak = applyStreakOnComplete({
    lastStreakDate: next.player.lastStreakDate,
    currentStreak: next.player.currentStreak,
    longestStreak: next.player.longestStreak,
    date,
    shields: next.player.streakShields,
    protectionEnabled: next.settings.streakProtection,
  });

  let shields = next.player.streakShields - (streak.usedShield ? 1 : 0);
  shields += shieldsEarnedForStreak(streak.currentStreak);

  let player: Player = {
    ...next.player,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastStreakDate: streak.lastStreakDate,
    streakShields: Math.max(0, shields),
    pendingMissDate: streak.usedShield ? null : next.player.pendingMissDate,
    comboCount: combo,
    comboDate: date,
    stats: applyStatRewards(next.player.stats, habit.statRewards),
  };
  player = addXp(player, xp, events);

  const ledgerSource = weekly ? weekLedgerSource(habitId, date) : habit.name;

  next = {
    ...next,
    player,
    ledger: [
      {
        id: uid(),
        date,
        amount: xp,
        source: ledgerSource,
        habitId: habit.id,
        createdAt: nowIso(),
      },
      ...next.ledger,
    ],
    activity: [
      logEvent("quest", "Quest complete", `${habit.name} · +${xp} XP`),
      ...next.activity,
    ].slice(0, 200),
  };

  events.push({
    type: "quest_complete",
    habitId,
    name: habit.name,
    xp,
    stats: habit.statRewards,
    combo,
  });

  next = tickBosses(next, habit, date, events);
  next = maybeDailyBonus(next, date, events);
  next = maybeRoutineBonus(next, date, events);
  next = grantAchievements(next, events);

  return { state: next, events };
}

export function spendStat(state: GameState, key: keyof PlayerStats): GameState {
  if (state.player.unspentStatPoints <= 0) return state;
  return {
    ...state,
    player: {
      ...state.player,
      unspentStatPoints: state.player.unspentStatPoints - 1,
      stats: mergeStats(state.player.stats, { [key]: 1 }),
      updatedAt: nowIso(),
    },
  };
}

export function useStreakShield(state: GameState, today = localDateId()): GameState {
  if (!state.settings.streakProtection) return state;
  if (state.player.streakShields <= 0) return state;
  if (!state.player.pendingMissDate) return state;
  return {
    ...state,
    player: {
      ...state.player,
      streakShields: state.player.streakShields - 1,
      lastStreakDate: shiftLocalDate(today, -1),
      pendingMissDate: null,
      updatedAt: nowIso(),
    },
  };
}

export function upsertHabit(state: GameState, habit: Habit): GameState {
  const exists = state.habits.some((h) => h.id === habit.id);
  const habits = exists
    ? state.habits.map((h) => (h.id === habit.id ? habit : h))
    : [habit, ...state.habits];
  return grantAchievements({ ...state, habits }, []);
}

export function removeHabit(state: GameState, habitId: string, mode: "archive" | "delete"): GameState {
  if (mode === "archive") {
    return {
      ...state,
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, archived: true, active: false, updatedAt: nowIso() } : h,
      ),
    };
  }
  return {
    ...state,
    habits: state.habits.filter((h) => h.id !== habitId),
    completions: state.completions.filter((c) => c.habitId !== habitId),
    routines: state.routines.map((r) => ({
      ...r,
      habitIds: r.habitIds.filter((id) => id !== habitId),
    })),
  };
}

export function upsertRoutine(state: GameState, routine: Routine): GameState {
  const exists = state.routines.some((r) => r.id === routine.id);
  return {
    ...state,
    routines: exists
      ? state.routines.map((r) => (r.id === routine.id ? routine : r))
      : [routine, ...state.routines],
  };
}

export function upsertBoss(state: GameState, boss: Boss): GameState {
  const exists = state.bosses.some((b) => b.id === boss.id);
  return {
    ...state,
    bosses: exists ? state.bosses.map((b) => (b.id === boss.id ? boss : b)) : [boss, ...state.bosses],
  };
}

export function nextRankHint(state: GameState) {
  return nextRankRequirement(state.player.rank);
}

export { completionId };
