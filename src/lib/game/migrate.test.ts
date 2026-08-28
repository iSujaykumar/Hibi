import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { migrateState, normalizeArchetype, normalizePlayDifficulty, normalizeStats } from "./migrate.ts";

describe("normalizeArchetype", () => {
  it("maps legacy classes", () => {
    assert.equal(normalizeArchetype("mage"), "scholar");
    assert.equal(normalizeArchetype("assassin"), "strategist");
    assert.equal(normalizeArchetype("ranger"), "seeker");
    assert.equal(normalizeArchetype("warrior"), "warrior");
  });
});

describe("normalizePlayDifficulty", () => {
  it("maps legacy difficulties", () => {
    assert.equal(normalizePlayDifficulty("casual"), "initiate");
    assert.equal(normalizePlayDifficulty("normal"), "adventurer");
    assert.equal(normalizePlayDifficulty("hard"), "elite");
  });
});

describe("normalizeStats", () => {
  it("folds vitality into energy", () => {
    const stats = normalizeStats({ vitality: 9, strength: 4 });
    assert.equal(stats.strength, 4);
    assert.ok(stats.energy >= 9);
    assert.ok(stats.creativity >= 1);
    assert.ok(stats.social >= 1);
  });
});

describe("migrateState", () => {
  it("preserves xp, quests, and streaks", () => {
    const next = migrateState({
      player: {
        name: "Valkyrie",
        totalXp: 420,
        xp: 20,
        level: 4,
        currentStreak: 6,
        longestStreak: 9,
        archetype: "ranger",
        playDifficulty: "hard",
        onboarded: true,
        stats: { strength: 12, vitality: 7 },
      },
      habits: [{ id: "h1", name: "Walk", kind: "daily", frequency: "daily", active: true, archived: false, statRewards: { vitality: 1 } }],
      completions: [{ id: "h1:2026-08-01", habitId: "h1", date: "2026-08-01", completed: true, value: 1, xpEarned: 20, createdAt: "" }],
      ledger: [],
      achievements: [{ id: "first_blood", unlockedAt: "x" }],
    });
    assert.ok(next);
    assert.equal(next?.player.totalXp, 420);
    assert.equal(next?.player.currentStreak, 6);
    assert.equal(next?.player.archetype, "seeker");
    assert.equal(next?.player.playDifficulty, "elite");
    assert.equal(next?.habits[0]?.name, "Walk");
    assert.equal(next?.completions.length, 1);
    assert.equal(next?.achievements[0]?.id, "first_blood");
    assert.equal(next?.schemaVersion, 2);
  });

  it("repairs overflowed xp and quest rewards", () => {
    const next = migrateState({
      player: {
        name: "Kirito",
        totalXp: 11_999_978_480_726,
        xp: 11_999_978_480_726,
        level: 400,
        onboarded: true,
      },
      habits: [{ id: "h1", name: "Cheat", kind: "daily", frequency: "daily", xpReward: 10_000_000_000_000, target: 1, difficulty: "normal", statRewards: {} }],
    });
    assert.ok(next);
    assert.ok((next?.player.totalXp ?? 0) < 50_000_000);
    assert.ok((next?.player.xp ?? 0) <= 200_000);
    assert.equal(next?.habits[0]?.xpReward, 500);
  });
});
