import { BACKUP_VERSION, type GameState, type HibiBackup } from "../../types/hibi.ts";
import { migrateState } from "./migrate.ts";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function serializeBackup(state: GameState): HibiBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function parseBackup(raw: unknown): { ok: true; backup: HibiBackup } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "Backup is not a JSON object." };
  const version = raw.version;
  if (version !== 1 && version !== 2) return { ok: false, error: "Unsupported backup version." };
  if (!isRecord(raw.state)) return { ok: false, error: "Backup is missing state." };
  const migrated = migrateState(raw.state);
  if (!migrated || !migrated.player.name) {
    return { ok: false, error: "Backup is missing a valid player." };
  }
  return {
    ok: true,
    backup: {
      version: BACKUP_VERSION,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
      state: migrated,
    },
  };
}

export function mergeStates(current: GameState, incoming: GameState): GameState {
  const byId = <T extends { id: string }>(a: T[], b: T[]) => {
    const map = new Map<string, T>();
    for (const item of a) map.set(item.id, item);
    for (const item of b) map.set(item.id, item);
    return [...map.values()];
  };
  return {
    schemaVersion: Math.max(current.schemaVersion ?? 1, incoming.schemaVersion ?? 1),
    player: {
      ...current.player,
      ...incoming.player,
      totalXp: Math.max(current.player.totalXp, incoming.player.totalXp),
      longestStreak: Math.max(current.player.longestStreak, incoming.player.longestStreak),
      stats: { ...current.player.stats, ...incoming.player.stats },
    },
    habits: byId(current.habits, incoming.habits),
    completions: byId(current.completions, incoming.completions),
    ledger: byId(current.ledger, incoming.ledger),
    activity: byId(current.activity, incoming.activity).slice(0, 200),
    achievements: byId(current.achievements, incoming.achievements),
    bosses: byId(current.bosses, incoming.bosses),
    routines: byId(current.routines, incoming.routines),
    settings: { ...current.settings, ...incoming.settings },
    lastReview: incoming.lastReview ?? current.lastReview,
  };
}
