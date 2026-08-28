import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/input";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { ROUTINE_PRESETS } from "@/lib/game/templates";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { activeHabits } from "@/lib/selectors";
import { localDateId } from "@/lib/game/dates";
import { completionFor } from "@/lib/selectors";

export const Route = createFileRoute("/_app/routines")({ component: RoutinesPage });

function RoutinesPage() {
  const state = useAppStore((s) => s.state);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const [name, setName] = useState("Morning Awakening");
  const [selected, setSelected] = useState<string[]>([]);
  if (!state) return null;
  const habits = activeHabits(state);
  const today = localDateId();

  function createFromPreset(presetName: string) {
    const preset = ROUTINE_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    const ids = habits.filter((h) => preset.match.includes(h.name)).map((h) => h.id);
    void saveRoutine({
      id: uid(),
      name: preset.name,
      description: preset.description,
      habitIds: ids,
      bonusXp: 80,
    });
  }

  return (
    <div className="space-y-5">
      <header>
        <Kicker>Sequences</Kicker>
        <h1 className="font-display text-3xl">Routines</h1>
      </header>
      {state.routines.map((r) => {
        const done = r.habitIds.filter((id) => completionFor(state, id, today)?.completed).length;
        return (
          <SystemFrame key={r.id} label="Routine">
            <h2 className="font-display text-xl">{r.name}</h2>
            <p className="text-sm text-muted">{r.description}</p>
            <p className="mt-2 text-xs tabular-nums text-subtle">
              {done} / {r.habitIds.length} today · bonus +{r.bonusXp} XP
            </p>
          </SystemFrame>
        );
      })}
      <SystemFrame label="Presets">
        <div className="space-y-2">
          {ROUTINE_PRESETS.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm">{p.name}</p>
                <p className="text-xs text-muted">{p.description}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => createFromPreset(p.name)}>
                Add
              </Button>
            </div>
          ))}
        </div>
      </SystemFrame>
      <SystemFrame label="Custom routine">
        <FieldLabel htmlFor="rname">Name</FieldLabel>
        <Input id="rname" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-3 space-y-2">
          {habits.map((h) => (
            <label key={h.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(h.id)}
                onChange={() =>
                  setSelected((prev) => (prev.includes(h.id) ? prev.filter((x) => x !== h.id) : [...prev, h.id]))
                }
              />
              {h.name}
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          onClick={() => {
            if (!name.trim() || selected.length === 0) return;
            void saveRoutine({
              id: uid(),
              name: name.trim(),
              description: "Custom routine",
              habitIds: selected,
              bonusXp: 80,
            });
            setSelected([]);
          }}
        >
          Save routine
        </Button>
      </SystemFrame>
    </div>
  );
}
