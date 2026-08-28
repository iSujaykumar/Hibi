import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { QuestCard } from "@/components/quests/quest-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, Kicker } from "@/components/system/frame";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/i18n/catalog";
import { localDateId } from "@/lib/game/dates";
import { activeHabits, completionFor, stepFor, streakOf, weekProgress } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";
import type { Difficulty } from "@/types/hibi";

export const Route = createFileRoute("/_app/quests")({ component: QuestsPage });

function QuestsPage() {
  const state = useAppStore((s) => s.state);
  const complete = useAppStore((s) => s.complete);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [diff, setDiff] = useState<string>("all");
  const [tab, setTab] = useState<"active" | "done" | "bonus">("active");
  if (!state) return null;
  const today = localDateId();
  const habits = activeHabits(state);

  const filtered = useMemo(() => {
    return habits.filter((h) => {
      if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && h.category !== cat) return false;
      if (diff !== "all" && h.difficulty !== diff) return false;
      const done = Boolean(completionFor(state, h.id, today)?.completed);
      if (tab === "active") return !done;
      if (tab === "done") return done;
      return h.priority === "low";
    });
  }, [habits, q, cat, diff, tab, state, today]);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <Kicker>Quest board</Kicker>
          <h1 className="font-display text-3xl">Today's quests</h1>
        </div>
        <Button asChild size="sm">
          <Link to="/habits/new">
            <Plus className="size-4" />
            Quest
          </Link>
        </Button>
      </header>

      <div className="flex gap-2">
        {(["active", "done", "bonus"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-10 rounded-md px-3 text-sm capitalize ${tab === id ? "bg-accent text-accent-fg" : "bg-card text-muted"}`}
          >
            {id === "active" ? "Active" : id === "done" ? "Completed" : "Bonus"}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle" />
          <Input className="pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={diff} onChange={(e) => setDiff(e.target.value)}>
          <option value="all">All difficulties</option>
          {(["easy", "normal", "hard", "elite"] as Difficulty[]).map((id) => (
            <option key={id} value={id}>
              {DIFFICULTY_LABELS[id]}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No quests in this view."
          body="Generate a protocol from your focus, or create a custom quest."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => void useAppStore.getState().seedProtocol()}>Generate protocol</Button>
              <Button asChild variant="secondary">
                <Link to="/habits/new">Create custom quest</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((habit) => (
            <QuestCard
              key={habit.id}
              habit={habit}
              completion={completionFor(state, habit.id, today)}
              streak={streakOf(state, habit.id, today).current}
              weekProgress={
                habit.frequency === "weekly" || habit.kind === "weekly"
                  ? weekProgress(state, habit, today)
                  : undefined
              }
              onComplete={() => void complete(habit.id)}
              onIncrement={(delta) =>
                void complete(habit.id, {
                  value: Math.max(
                    0,
                    (completionFor(state, habit.id, today)?.value ?? 0) + stepFor(habit) * delta,
                  ),
                })
              }
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="flex-1">
          <Link to="/bosses">Boss battles</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link to="/routines">Routines</Link>
        </Button>
      </div>
    </div>
  );
}
