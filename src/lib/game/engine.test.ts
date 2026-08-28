import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPlayer, DEFAULT_SETTINGS } from "./defaults.ts";
import { completeHabit, dailyTick, acceptStreakWound } from "./engine.ts";
import { parseBackup, serializeBackup } from "./backup.ts";
import { localDateId, shiftLocalDate } from "./dates.ts";
import { progressFromTotalXp, rankFor, xpRequired, computeXpAward } from "./progression.ts";
import { applyStreakOnComplete, habitStreak } from "./streaks.ts";
import { gateForRank, titlesUpToRank, seasonForDate } from "./gates.ts";
import type { GameState, Habit } from "../../types/hibi.ts";

function habit(partial: Partial<Habit> = {}): Habit {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? "h1",
    name: partial.name ?? "Water",
    description: "",
    icon: "droplets",
    type: partial.type ?? "binary",
    kind: "daily",
    category: "health",
    difficulty: partial.difficulty ?? "easy",
    frequency: "daily",
    target: partial.target ?? 1,
    unit: partial.unit ?? "",
    xpReward: partial.xpReward ?? 20,
    statRewards: partial.statRewards ?? { vitality: 1 },
    priority: "medium",
    color: "cyan",
    reminder: null,
    startDate: localDateId(),
    active: true,
    archived: false,
    negative: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function state(over: Partial<GameState> = {}): GameState {
  return {
    schemaVersion: 2,
    player: createPlayer({ name: "Valkyrie", onboarded: true }),
    habits: [habit()],
    completions: [],
    ledger: [],
    activity: [],
    achievements: [],
    bosses: [],
    routines: [],
    settings: { ...DEFAULT_SETTINGS },
    lastReview: null,
    ...over,
  };
}

describe("xp curve", () => {
  it("requires 100 xp at level 1", () => {
    assert.equal(xpRequired(1), 100);
  });
  it("levels from total xp without skipping", () => {
    const p = progressFromTotalXp(100);
    assert.equal(p.level, 2);
    assert.equal(p.xp, 0);
  });
  it("caps bonus at 40%", () => {
    const xp = computeXpAward({ base: 100, playDifficulty: "normal", streak: 30, combo: 8 });
    assert.equal(xp, 140);
  });
  it("rejects absurd quest xp", () => {
    const xp = computeXpAward({ base: 10_000_000_000_000, playDifficulty: "normal", streak: 1, combo: 1 });
    assert.ok(xp <= 1000);
    const overflow = progressFromTotalXp(11_999_978_480_726);
    assert.equal(overflow.level, 400);
    assert.ok(overflow.xp <= overflow.needed);
  });
});

describe("ranks", () => {
  it("starts at E", () => assert.equal(rankFor(1, 0), "E"));
  it("promotes to D at level 5 with 3 achievements", () => assert.equal(rankFor(5, 3), "D"));
  it("does not promote without achievements", () => assert.equal(rankFor(5, 0), "E"));
});

describe("dates", () => {
  it("shifts across month boundaries", () => {
    assert.equal(shiftLocalDate("2026-01-31", 1), "2026-02-01");
  });
});

describe("streaks", () => {
  it("increments on consecutive days", () => {
    const a = applyStreakOnComplete({
      lastStreakDate: "2026-01-01",
      currentStreak: 1,
      longestStreak: 1,
      date: "2026-01-02",
      shields: 0,
      protectionEnabled: true,
    });
    assert.equal(a.currentStreak, 2);
  });
  it("uses a shield for a one-day gap", () => {
    const a = applyStreakOnComplete({
      lastStreakDate: "2026-01-01",
      currentStreak: 4,
      longestStreak: 4,
      date: "2026-01-03",
      shields: 1,
      protectionEnabled: true,
    });
    assert.equal(a.currentStreak, 5);
    assert.equal(a.usedShield, true);
  });
  it("breaks without a shield", () => {
    const a = applyStreakOnComplete({
      lastStreakDate: "2026-01-01",
      currentStreak: 4,
      longestStreak: 4,
      date: "2026-01-03",
      shields: 0,
      protectionEnabled: true,
    });
    assert.equal(a.currentStreak, 1);
  });
  it("computes current habit streak", () => {
    const s = habitStreak(["2026-01-01", "2026-01-02", "2026-01-03"], "2026-01-03");
    assert.equal(s.current, 3);
    assert.equal(s.best, 3);
  });
});

describe("habit completion", () => {
  it("awards xp once", () => {
    const s = state();
    const first = completeHabit(s, "h1", { date: "2026-08-01" });
    assert.ok(first.events.some((e) => e.type === "quest_complete"));
    const xp = first.state.player.totalXp;
    const second = completeHabit(first.state, "h1", { date: "2026-08-01" });
    assert.ok(second.events.some((e) => e.type === "already_complete"));
    assert.equal(second.state.player.totalXp, xp);
  });

  it("unlocks first blood", () => {
    const s = state();
    const next = completeHabit(s, "h1", { date: "2026-08-01" });
    assert.ok(next.state.achievements.some((a) => a.id === "first_blood"));
  });

  it("numeric habits wait for the target", () => {
    const s = state({ habits: [habit({ id: "h2", type: "numeric", target: 2000, unit: "ml" })] });
    const mid = completeHabit(s, "h2", { date: "2026-08-01", value: 500 });
    assert.ok(mid.events.some((e) => e.type === "progress"));
    assert.equal(mid.state.player.totalXp, 0);
    const done = completeHabit(mid.state, "h2", { date: "2026-08-01", value: 2000 });
    assert.ok(done.events.some((e) => e.type === "quest_complete"));
  });
});

describe("daily tick", () => {
  it("resets combo on a new day", () => {
    const s = state();
    s.player.comboCount = 5;
    s.player.comboDate = "2026-08-01";
    s.player.lastActiveDate = "2026-08-01";
    const next = dailyTick(s, "2026-08-02");
    assert.equal(next.player.comboCount, 0);
  });
});

describe("backup", () => {
  it("round-trips", () => {
    const s = state();
    const json = serializeBackup(s);
    const parsed = parseBackup(json);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.backup.state.player.name, "Valkyrie");
  });
  it("rejects garbage", () => {
    const parsed = parseBackup({ hello: true });
    assert.equal(parsed.ok, false);
  });
  it("migrates version 1 backups", () => {
    const parsed = parseBackup({
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      state: {
        player: { name: "Old", archetype: "mage", playDifficulty: "casual", stats: { vitality: 8, strength: 4 } },
        habits: [],
        completions: [],
      },
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.backup.state.player.archetype, "scholar");
      assert.equal(parsed.backup.state.player.playDifficulty, "initiate");
      assert.ok(parsed.backup.state.player.stats.energy >= 8);
      assert.equal(parsed.backup.version, 2);
    }
  });
});

describe("weekly quests", () => {
  it("awards xp once when the weekly target is first met", () => {
    const s = state({
      habits: [habit({ id: "w1", kind: "weekly", frequency: "weekly", target: 2, xpReward: 100 })],
    });
    const d1 = completeHabit(s, "w1", { date: "2026-08-03" }); // Monday
    assert.ok(d1.events.some((e) => e.type === "progress"));
    assert.equal(d1.state.player.totalXp, 0);
    const d2 = completeHabit(d1.state, "w1", { date: "2026-08-04" });
    assert.ok(d2.events.some((e) => e.type === "quest_complete"));
    const xp = d2.state.player.totalXp;
    assert.ok(xp > 0);
    const d3 = completeHabit(d2.state, "w1", { date: "2026-08-05" });
    assert.ok(d3.events.some((e) => e.type === "already_complete"));
    assert.equal(d3.state.player.totalXp, xp);
    const again = completeHabit(d2.state, "w1", { date: "2026-08-04" });
    assert.ok(again.events.some((e) => e.type === "already_complete"));
    assert.equal(again.state.player.totalXp, xp);
  });
});

describe("streak wound", () => {
  it("zeros the streak when the wound is accepted", () => {
    const s = state({
      player: {
        ...createPlayer({ name: "Valkyrie", onboarded: true }),
        currentStreak: 6,
        pendingMissDate: "2026-08-27",
        lastStreakDate: "2026-08-26",
      },
    });
    const next = acceptStreakWound(s);
    assert.equal(next.player.currentStreak, 0);
    assert.equal(next.player.pendingMissDate, null);
  });
});

describe("gates", () => {
  it("maps ranks to gate titles", () => {
    assert.equal(gateForRank("C").name, "Inner Gate");
    assert.ok(titlesUpToRank("C").includes("gate_c"));
    assert.ok(titlesUpToRank("C").includes("gate_e"));
    assert.ok(seasonForDate("2026-08-28").name.endsWith("Season"));
  });
});
