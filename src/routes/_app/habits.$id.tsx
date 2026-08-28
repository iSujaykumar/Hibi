import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HabitForm } from "@/features/habit-form";
import { Button } from "@/components/ui/button";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { Meter } from "@/components/ui/progress";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, QUEST_KIND_LABELS } from "@/lib/i18n/catalog";
import { localDateId, shiftLocalDate } from "@/lib/game/dates";
import { streakOf } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/_app/habits/$id")({ component: HabitDetailPage });

function HabitDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const state = useAppStore((s) => s.state);
  const saveHabit = useAppStore((s) => s.saveHabit);
  const archiveHabit = useAppStore((s) => s.archiveHabit);
  const deleteHabit = useAppStore((s) => s.deleteHabit);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!state) return null;
  const habit = state.habits.find((h) => h.id === id);
  if (!habit) {
    return (
      <SystemFrame>
        <p>Quest not found.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/quests" })}>
          Back
        </Button>
      </SystemFrame>
    );
  }
  const records = state.completions.filter((c) => c.habitId === habit.id && c.completed);
  const xp = records.reduce((s, c) => s + c.xpEarned, 0);
  const streak = streakOf(state, habit.id);
  const today = localDateId();
  const days = Array.from({ length: 28 }, (_, i) => shiftLocalDate(today, i - 27));
  const rate = Math.round((records.length / Math.max(1, state.player.dayCount)) * 100);

  if (editing) {
    return (
      <div className="space-y-5">
        <Kicker>Edit quest</Kicker>
        <h1 className="font-display text-3xl">{habit.name}</h1>
        <HabitForm
          initial={habit}
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            void saveHabit({ ...next, id: habit.id, createdAt: habit.createdAt });
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <Kicker>
          {QUEST_KIND_LABELS[habit.kind] ?? habit.kind} · {CATEGORY_LABELS[habit.category]}
        </Kicker>
        <h1 className="font-display text-3xl">{habit.name}</h1>
        <p className="mt-2 text-sm text-muted">{habit.description || "No description."}</p>
      </header>
      <SystemFrame>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info k="Difficulty" v={DIFFICULTY_LABELS[habit.difficulty]} />
          <Info k="Frequency" v={habit.frequency} />
          <Info k="Current streak" v={`${streak.current} days`} />
          <Info k="Best streak" v={`${streak.best} days`} />
          <Info k="Completions" v={String(records.length)} />
          <Info k="XP earned" v={String(xp)} />
          <Info k="Completion rate" v={`${Math.min(100, rate)}%`} />
          <Info k="Reward" v={`+${habit.xpReward} XP`} />
        </dl>
      </SystemFrame>
      <SystemFrame label="History">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const hit = records.some((c) => c.date === d);
            return (
              <div
                key={d}
                title={d}
                className={`aspect-square rounded-sm ${hit ? "bg-accent" : "bg-fg/10"}`}
              />
            );
          })}
        </div>
        <Meter className="mt-4" value={streak.current} max={Math.max(7, streak.best)} label="Streak" />
      </SystemFrame>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="secondary" onClick={() => void archiveHabit(habit.id).then(() => navigate({ to: "/quests" }))}>
          Archive
        </Button>
        {confirm ? (
          <Button
            variant="danger"
            onClick={() => void deleteHabit(habit.id).then(() => navigate({ to: "/quests" }))}
          >
            Confirm delete
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 capitalize">{v}</dd>
    </div>
  );
}
