import { create } from "zustand";
import type {
  AppSettings,
  AvatarId,
  Boss,
  EngineEvent,
  GameState,
  Habit,
  Player,
  PlayerStats,
  Routine,
  StatKey,
} from "@/types/hibi";
import { SCHEMA_VERSION } from "@/types/hibi";
import { loadState, saveState, wipeState, isMemoryFallback } from "@/db/hibi-db";
import { parseBackup, mergeStates, serializeBackup } from "@/lib/game/backup";
import { createPlayer, DEFAULT_SETTINGS } from "@/lib/game/defaults";
import {
  completeHabit,
  dailyTick,
  removeHabit,
  spendStat,
  upsertBoss,
  upsertHabit,
  upsertRoutine,
  useStreakShield,
  acceptStreakWound,
} from "@/lib/game/engine";
import { clampQuestXp, difficultyXpBase } from "@/lib/game/progression";
import { generateProtocol } from "@/lib/game/protocol";
import { localDateId } from "@/lib/game/dates";
import { uid } from "@/lib/utils";
import { playQuestSound, playLevelSound } from "@/services/sound";

type Overlay =
  | {
      kind: "quest";
      name: string;
      xp: number;
      stats: Partial<PlayerStats>;
      combo: number;
      levelFrom?: number;
      levelTo?: number;
      rankFrom?: string;
      rankTo?: string;
      achievement?: { name: string; rarity: string };
    }
  | { kind: "level"; from: number; to: number; gains: Partial<PlayerStats> }
  | { kind: "rank"; from: string; to: string }
  | { kind: "achievement"; name: string; rarity: string }
  | null;

type AppStore = {
  hydrated: boolean;
  storageWarning: boolean;
  state: GameState | null;
  overlay: Overlay;
  lastEvents: EngineEvent[];
  hydrate: () => Promise<void>;
  persist: (state: GameState) => Promise<void>;
  setStateAndSave: (state: GameState) => Promise<void>;
  finishOnboarding: (player: Player, habits: Habit[]) => Promise<void>;
  seedProtocol: () => Promise<void>;
  complete: (habitId: string, opts?: { increment?: number; value?: number }) => Promise<EngineEvent[]>;
  saveHabit: (habit: Habit) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  allocate: (key: StatKey) => Promise<void>;
  recoverStreak: () => Promise<void>;
  acceptWound: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updatePlayer: (patch: Partial<Player>) => Promise<void>;
  setAvatar: (avatar: AvatarId) => Promise<void>;
  setTitle: (id: string) => Promise<void>;
  saveRoutine: (routine: Routine) => Promise<void>;
  saveBoss: (boss: Boss) => Promise<void>;
  dismissOverlay: () => void;
  clearLastEvents: () => void;
  dismissReview: () => Promise<void>;
  exportJson: () => string | null;
  importJson: (raw: unknown, mode: "replace" | "merge") => Promise<string | null>;
  resetProgress: () => Promise<void>;
  eraseAll: () => Promise<void>;
};

const emptyEvents: EngineEvent[] = [];

function pickOverlay(events: EngineEvent[]): Overlay {
  const quest = events.find((e) => e.type === "quest_complete");
  const rank = events.find((e) => e.type === "rank_up");
  const levels = events.filter((e) => e.type === "level_up");
  const ach = events.find((e) => e.type === "achievement");
  if (quest && quest.type === "quest_complete") {
    const first = levels[0];
    const last = levels[levels.length - 1];
    return {
      kind: "quest",
      name: quest.name,
      xp: quest.xp,
      stats: quest.stats,
      combo: quest.combo,
      levelFrom: first && first.type === "level_up" ? first.from : undefined,
      levelTo: last && last.type === "level_up" ? last.to : undefined,
      rankFrom: rank && rank.type === "rank_up" ? rank.from : undefined,
      rankTo: rank && rank.type === "rank_up" ? rank.to : undefined,
      achievement: ach && ach.type === "achievement" ? { name: ach.name, rarity: ach.rarity } : undefined,
    };
  }
  if (rank && rank.type === "rank_up") return { kind: "rank", from: rank.from, to: rank.to };
  if (levels.length > 0) {
    const first = levels[0];
    const last = levels[levels.length - 1];
    if (first.type === "level_up" && last.type === "level_up") {
      const gains: Partial<PlayerStats> = {};
      for (const ev of levels) {
        if (ev.type !== "level_up") continue;
        for (const [k, v] of Object.entries(ev.statGains)) {
          const key = k as StatKey;
          gains[key] = (gains[key] ?? 0) + (v ?? 0);
        }
      }
      return { kind: "level", from: first.from, to: last.to, gains };
    }
  }
  if (ach && ach.type === "achievement") {
    return { kind: "achievement", name: ach.name, rarity: ach.rarity };
  }
  return null;
}

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  storageWarning: false,
  state: null,
  overlay: null,
  lastEvents: emptyEvents,

  hydrate: async () => {
    if (get().hydrated) return;
    const loaded = await loadState();
    if (!loaded) {
      set({ hydrated: true, state: null, storageWarning: isMemoryFallback() });
      return;
    }
    const ticked = dailyTick(loaded);
    if (ticked !== loaded) await saveState(ticked);
    set({ hydrated: true, state: ticked, storageWarning: isMemoryFallback() });
  },

  persist: async (state) => {
    await saveState(state);
  },

  setStateAndSave: async (state) => {
    set({ state });
    await saveState(state);
  },

  finishOnboarding: async (player, habits) => {
    const onboarded: Player = { ...player, onboarded: true };
    const next: GameState = {
      schemaVersion: SCHEMA_VERSION,
      player: onboarded,
      habits,
      completions: [],
      ledger: [],
      activity: [
        {
          id: uid(),
          at: new Date().toISOString(),
          kind: "system",
          title: "Protocol initialized",
          detail: `${player.name} · ${player.focuses[0] ?? "growth"} · Rank E`,
        },
      ],
      achievements: [],
      bosses: [],
      routines: [],
      settings: { ...DEFAULT_SETTINGS },
      lastReview: null,
    };
    set({ state: next });
    await saveState(next);
  },

  seedProtocol: async () => {
    const current = get().state;
    if (!current) return;
    const generated = generateProtocol({
      focus: current.player.focuses[0] ?? "growth",
      archetype: current.player.archetype,
      difficulty: current.player.playDifficulty,
      experience: current.player.experienceLevel ?? "some",
      availableTime: current.player.availableTime ?? "medium",
      challengePreference: current.player.challengePreference ?? "steady",
      seed: current.player.name,
    });
    const existing = new Set(current.habits.map((h) => h.templateId).filter(Boolean));
    const names = new Set(current.habits.map((h) => h.name.toLowerCase()));
    let next = current;
    for (const habit of generated.habits) {
      if (habit.templateId && existing.has(habit.templateId)) continue;
      if (names.has(habit.name.toLowerCase())) continue;
      next = upsertHabit(next, habit);
    }
    set({ state: next });
    await saveState(next);
  },

  complete: async (habitId, opts) => {
    const current = get().state;
    if (!current) return [];
    const { state, events } = completeHabit(current, habitId, opts);
    if (events.some((e) => e.type === "already_complete") && events.length === 1) {
      return events;
    }
    const overlay = pickOverlay(events);
    set({ state, lastEvents: events, overlay: overlay ?? get().overlay });
    await saveState(state);
    const settings = state.settings;
    if (settings.questSounds && events.some((e) => e.type === "quest_complete")) playQuestSound();
    if (settings.questSounds && events.some((e) => e.type === "level_up" || e.type === "rank_up")) {
      playLevelSound();
    }
    return events;
  },

  saveHabit: async (habit) => {
    const current = get().state;
    if (!current) return;
    const next = upsertHabit(current, {
      ...habit,
      xpReward: clampQuestXp(habit.xpReward || difficultyXpBase(habit.difficulty)),
      updatedAt: new Date().toISOString(),
    });
    set({ state: next });
    await saveState(next);
  },

  archiveHabit: async (habitId) => {
    const current = get().state;
    if (!current) return;
    const next = removeHabit(current, habitId, "archive");
    set({ state: next });
    await saveState(next);
  },

  deleteHabit: async (habitId) => {
    const current = get().state;
    if (!current) return;
    const next = removeHabit(current, habitId, "delete");
    set({ state: next });
    await saveState(next);
  },

  allocate: async (key) => {
    const current = get().state;
    if (!current) return;
    const next = spendStat(current, key);
    set({ state: next });
    await saveState(next);
  },

  recoverStreak: async () => {
    const current = get().state;
    if (!current) return;
    const next = useStreakShield(current);
    set({ state: next });
    await saveState(next);
  },

  acceptWound: async () => {
    const current = get().state;
    if (!current) return;
    const next = acceptStreakWound(current);
    set({ state: next });
    await saveState(next);
  },

  updateSettings: async (patch) => {
    const current = get().state;
    if (!current) return;
    const next = { ...current, settings: { ...current.settings, ...patch } };
    set({ state: next });
    await saveState(next);
  },

  updatePlayer: async (patch) => {
    const current = get().state;
    if (!current) return;
    const next = { ...current, player: { ...current.player, ...patch, updatedAt: new Date().toISOString() } };
    set({ state: next });
    await saveState(next);
  },

  setAvatar: async (avatar) => {
    await get().updatePlayer({ avatar });
  },

  setTitle: async (id) => {
    await get().updatePlayer({ equippedTitle: id });
  },

  saveRoutine: async (routine) => {
    const current = get().state;
    if (!current) return;
    const next = upsertRoutine(current, routine);
    set({ state: next });
    await saveState(next);
  },

  saveBoss: async (boss) => {
    const current = get().state;
    if (!current) return;
    const next = upsertBoss(current, boss);
    set({ state: next });
    await saveState(next);
  },

  dismissOverlay: () => set({ overlay: null, lastEvents: emptyEvents }),
  clearLastEvents: () => set({ lastEvents: emptyEvents }),

  dismissReview: async () => {
    const current = get().state;
    if (!current) return;
    const next = {
      ...current,
      player: { ...current.player, lastDailyReviewDate: current.lastReview?.date ?? localDateId() },
      lastReview: null,
    };
    set({ state: next });
    await saveState(next);
  },

  exportJson: () => {
    const current = get().state;
    if (!current) return null;
    return JSON.stringify(serializeBackup(current), null, 2);
  },

  importJson: async (raw, mode) => {
    const parsed = parseBackup(raw);
    if (!parsed.ok) return parsed.error;
    const current = get().state;
    const incoming = parsed.backup.state;
    const next =
      mode === "merge" && current ? mergeStates(current, incoming) : incoming;
    set({ state: next });
    await saveState(next);
    return null;
  },

  resetProgress: async () => {
    const current = get().state;
    if (!current) return;
    const player = createPlayer({
      name: current.player.name,
      archetype: current.player.archetype,
      playDifficulty: current.player.playDifficulty,
      focuses: current.player.focuses,
      avatar: current.player.avatar,
      experienceLevel: current.player.experienceLevel,
      availableTime: current.player.availableTime,
      challengePreference: current.player.challengePreference,
      onboarded: true,
    });
    const next: GameState = {
      ...current,
      schemaVersion: SCHEMA_VERSION,
      player,
      completions: [],
      ledger: [],
      activity: [],
      achievements: [],
      bosses: current.bosses.map((b) => ({ ...b, progress: 0, defeated: false, defeatedAt: undefined })),
      lastReview: null,
    };
    set({ state: next });
    await saveState(next);
  },

  eraseAll: async () => {
    await wipeState();
    set({ state: null, overlay: null, lastEvents: [] });
  },
}));

export function useGame(): GameState {
  const state = useAppStore((s) => s.state);
  if (!state) {
    throw new Error("HIBI has not been initialized.");
  }
  return state;
}
