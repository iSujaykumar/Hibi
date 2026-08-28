import Dexie, { type Table } from "dexie";
import type {
  ActivityEvent,
  AppSettings,
  Boss,
  DailyReview,
  GameState,
  Habit,
  HabitCompletion,
  Player,
  Routine,
  UnlockedAchievement,
  XpTransaction,
} from "@/types/hibi";
import { DEFAULT_SETTINGS } from "@/lib/game/defaults";
import { migrateState, needsMigration } from "@/lib/game/migrate";

type MetaRow = { key: string; value: unknown };

class HibiDatabase extends Dexie {
  player!: Table<Player, string>;
  habits!: Table<Habit, string>;
  completions!: Table<HabitCompletion, string>;
  ledger!: Table<XpTransaction, string>;
  activity!: Table<ActivityEvent, string>;
  achievements!: Table<UnlockedAchievement, string>;
  bosses!: Table<Boss, string>;
  routines!: Table<Routine, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("hibi");
    this.version(1).stores({
      player: "id",
      habits: "id, category, active, archived",
      completions: "id, habitId, date, completed",
      ledger: "id, date, habitId",
      activity: "id, at, kind",
      achievements: "id",
      bosses: "id, defeated",
      routines: "id",
      meta: "key",
    });
  }
}

let db: HibiDatabase | null = null;
let memoryFallback = false;
let memory: GameState | null = null;

function canUseIdb(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): HibiDatabase | null {
  if (!canUseIdb()) return null;
  if (!db) db = new HibiDatabase();
  return db;
}

export function isMemoryFallback(): boolean {
  return memoryFallback;
}

function assemble(raw: Omit<GameState, "schemaVersion"> & { schemaVersion?: number }): GameState | null {
  return migrateState(raw);
}

export async function loadState(): Promise<GameState | null> {
  if (memory) {
    const migrated = needsMigration(memory) ? migrateState(memory) : memory;
    if (migrated && migrated !== memory) memory = migrated;
    return migrated ? structuredClone(migrated) : null;
  }
  const instance = getDb();
  if (!instance) return null;
  try {
    const [player, habits, completions, ledger, activity, achievements, bosses, routines, settingsRow, reviewRow, schemaRow] =
      await Promise.all([
        instance.player.get("local"),
        instance.habits.toArray(),
        instance.completions.toArray(),
        instance.ledger.toArray(),
        instance.activity.toArray(),
        instance.achievements.toArray(),
        instance.bosses.toArray(),
        instance.routines.toArray(),
        instance.meta.get("settings"),
        instance.meta.get("lastReview"),
        instance.meta.get("schemaVersion"),
      ]);
    if (!player) return null;
    const settings = (settingsRow?.value as AppSettings | undefined) ?? DEFAULT_SETTINGS;
    const assembled = assemble({
      schemaVersion: typeof schemaRow?.value === "number" ? schemaRow.value : 1,
      player,
      habits,
      completions,
      ledger,
      activity,
      achievements,
      bosses,
      routines,
      settings,
      lastReview: (reviewRow?.value as DailyReview | null | undefined) ?? null,
    });
    if (
      assembled &&
      needsMigration({
        ...assembled,
        schemaVersion: typeof schemaRow?.value === "number" ? schemaRow.value : 1,
        player,
        habits,
      })
    ) {
      memory = assembled;
      await saveState(assembled);
      return structuredClone(assembled);
    }
    memory = assembled;
    return assembled ? structuredClone(assembled) : null;
  } catch {
    memoryFallback = true;
    return memory;
  }
}

export async function saveState(state: GameState): Promise<void> {
  const migrated = migrateState(state) ?? state;
  memory = structuredClone(migrated);
  const instance = getDb();
  if (!instance || memoryFallback) return;
  try {
    await instance.transaction(
      "rw",
      [
        instance.player,
        instance.habits,
        instance.completions,
        instance.ledger,
        instance.activity,
        instance.achievements,
        instance.bosses,
        instance.routines,
        instance.meta,
      ],
      async () => {
        await instance.player.put(migrated.player);
        await instance.habits.clear();
        await instance.habits.bulkPut(migrated.habits);
        await instance.completions.clear();
        await instance.completions.bulkPut(migrated.completions);
        await instance.ledger.clear();
        await instance.ledger.bulkPut(migrated.ledger);
        await instance.activity.clear();
        await instance.activity.bulkPut(migrated.activity);
        await instance.achievements.clear();
        await instance.achievements.bulkPut(migrated.achievements);
        await instance.bosses.clear();
        await instance.bosses.bulkPut(migrated.bosses);
        await instance.routines.clear();
        await instance.routines.bulkPut(migrated.routines);
        await instance.meta.put({ key: "settings", value: migrated.settings });
        await instance.meta.put({ key: "lastReview", value: migrated.lastReview });
        await instance.meta.put({ key: "schemaVersion", value: migrated.schemaVersion });
      },
    );
  } catch {
    memoryFallback = true;
  }
}

export async function wipeState(): Promise<void> {
  memory = null;
  const instance = getDb();
  if (!instance) return;
  try {
    await instance.delete();
    db = null;
  } catch {
    /* ignore */
  }
}
