import { useState, type FormEvent } from "react";
import type { CategoryId, Difficulty, Frequency, Habit, HabitType, Priority, QuestKind, StatKey } from "@/types/hibi";
import { STAT_KEYS } from "@/types/hibi";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/input";
import { SystemFrame } from "@/components/system/frame";
import { HABIT_TEMPLATES } from "@/lib/game/templates";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, PRIORITY_LABELS, QUEST_KIND_LABELS, STAT_LABELS } from "@/lib/i18n/catalog";
import { makeHabit } from "@/lib/habits";
import { difficultyXpBase } from "@/lib/game/progression";

const TYPES: HabitType[] = ["binary", "numeric", "duration", "counter", "negative"];
const KINDS: QuestKind[] = ["daily", "weekly", "side", "challenge", "mission"];
const FREQ: Frequency[] = ["daily", "weekly", "monthly"];
const DIFF: Difficulty[] = ["easy", "normal", "hard", "elite"];
const PRIO: Priority[] = ["low", "medium", "high", "critical"];

export function HabitForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Habit>;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Habit>>(
    initial ?? { type: "binary", frequency: "daily", difficulty: "normal", kind: "daily", priority: "medium", category: "growth" },
  );

  function set<K extends keyof Habit>(key: K, value: Habit[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = (draft.name ?? "").trim();
    if (!name) return;
    const difficulty = draft.difficulty ?? "normal";
    onSave(
      makeHabit({
        ...draft,
        id: initial?.id,
        name,
        xpReward: Number(draft.xpReward) || difficultyXpBase(difficulty),
        target: Number(draft.target) || 1,
        createdAt: initial?.createdAt,
      }),
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!initial?.id ? (
        <SystemFrame label="Templates">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {HABIT_TEMPLATES.slice(0, 12).map((t) => (
              <button
                key={t.name}
                type="button"
                className="h-10 shrink-0 rounded-md bg-surface px-3 text-sm text-muted"
                onClick={() => setDraft((d) => ({ ...d, ...t }))}
              >
                {t.name}
              </button>
            ))}
          </div>
        </SystemFrame>
      ) : null}

      <SystemFrame label="Quest">
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" className="mt-2" value={draft.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
        <FieldLabel htmlFor="desc" className="mt-4 block">
          Description
        </FieldLabel>
        <Textarea id="desc" className="mt-2" value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select className="mt-2" value={draft.category ?? "custom"} onChange={(e) => set("category", e.target.value as CategoryId)}>
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Type</FieldLabel>
            <Select className="mt-2" value={draft.type ?? "binary"} onChange={(e) => set("type", e.target.value as HabitType)}>
              {TYPES.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Frequency</FieldLabel>
            <Select className="mt-2" value={draft.frequency ?? "daily"} onChange={(e) => set("frequency", e.target.value as Frequency)}>
              {FREQ.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Kind</FieldLabel>
            <Select className="mt-2" value={draft.kind ?? "daily"} onChange={(e) => set("kind", e.target.value as QuestKind)}>
              {KINDS.map((id) => (
                <option key={id} value={id}>
                  {QUEST_KIND_LABELS[id]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <Select
              className="mt-2"
              value={draft.difficulty ?? "normal"}
              onChange={(e) => {
                const difficulty = e.target.value as Difficulty;
                setDraft((d) => ({ ...d, difficulty, xpReward: difficultyXpBase(difficulty) }));
              }}
            >
              {DIFF.map((id) => (
                <option key={id} value={id}>
                  {DIFFICULTY_LABELS[id]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Priority</FieldLabel>
            <Select className="mt-2" value={draft.priority ?? "medium"} onChange={(e) => set("priority", e.target.value as Priority)}>
              {PRIO.map((id) => (
                <option key={id} value={id}>
                  {PRIORITY_LABELS[id]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="xp">XP reward</FieldLabel>
            <Input id="xp" className="mt-2" type="number" min={1} value={draft.xpReward ?? 45} onChange={(e) => set("xpReward", Number(e.target.value))} />
          </div>
          <div>
            <FieldLabel htmlFor="target">Goal</FieldLabel>
            <Input id="target" className="mt-2" type="number" min={1} value={draft.target ?? 1} onChange={(e) => set("target", Number(e.target.value))} />
          </div>
          <div>
            <FieldLabel htmlFor="unit">Unit</FieldLabel>
            <Input id="unit" className="mt-2" value={draft.unit ?? ""} onChange={(e) => set("unit", e.target.value)} placeholder="ml, pages, min" />
          </div>
          <div>
            <FieldLabel htmlFor="rem">Reminder</FieldLabel>
            <Input id="rem" className="mt-2" type="time" value={draft.reminder ?? ""} onChange={(e) => set("reminder", e.target.value || null)} />
          </div>
        </div>
        <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">Stat impact</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {STAT_KEYS.map((key: StatKey) => (
            <label key={key} className="flex items-center justify-between gap-2 rounded-md bg-surface px-3 py-2 text-sm">
              {STAT_LABELS[key]}
              <Input
                className="h-9 w-16"
                type="number"
                min={0}
                value={draft.statRewards?.[key] ?? 0}
                onChange={(e) =>
                  set("statRewards", { ...draft.statRewards, [key]: Number(e.target.value) || 0 })
                }
              />
            </label>
          ))}
        </div>
      </SystemFrame>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Save
        </Button>
      </div>
    </form>
  );
}
