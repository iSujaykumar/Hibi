import { Check, Flame, Minus, Plus, Star } from "lucide-react";
import type { Habit, HabitCompletion } from "@/types/hibi";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, QUEST_KIND_LABELS, STAT_ABBR_LABELS, STAT_LABELS } from "@/lib/i18n/catalog";
import { starsFor } from "@/lib/habits";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/progress";
import { SystemFrame } from "@/components/system/frame";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { StatKey } from "@/types/hibi";

export function QuestCard({
  habit,
  completion,
  streak,
  onComplete,
  onIncrement,
  busy,
  weekProgress,
}: {
  habit: Habit;
  completion?: HabitCompletion;
  streak: number;
  onComplete: () => void;
  onIncrement?: (delta: number) => void;
  busy?: boolean;
  weekProgress?: { value: number; target: number };
}) {
  const weekly = habit.frequency === "weekly" || habit.kind === "weekly";
  const weekDone = weekly && weekProgress ? weekProgress.value >= weekProgress.target : false;
  const done = weekly ? Boolean(completion?.completed) : Boolean(completion?.completed);
  const value = completion?.value ?? 0;
  const target = habit.type === "binary" || habit.type === "negative" ? 1 : Math.max(1, habit.target);
  const needsStepper =
    !weekly && (habit.type === "numeric" || habit.type === "duration" || habit.type === "counter");
  const stats = Object.entries(habit.statRewards)
    .filter(([, v]) => (v ?? 0) > 0)
    .slice(0, 2);
  const kindLabel = QUEST_KIND_LABELS[habit.kind] ?? habit.kind;

  return (
    <SystemFrame className={cn("p-4", (done || weekDone) && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] text-accent uppercase">
            {kindLabel} · {CATEGORY_LABELS[habit.category]}
          </p>
          <Link
            to="/habits/$id"
            params={{ id: habit.id }}
            className="mt-1 block font-display text-lg text-fg"
          >
            {habit.name}
          </Link>
          {habit.description ? <p className="mt-1 text-sm text-muted">{habit.description}</p> : null}
        </div>
        {done || weekDone ? (
          <span className="grid size-10 place-items-center rounded-md bg-success/15 text-success" aria-label="Completed">
            <Check className="size-5" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-0.5">
          {DIFFICULTY_LABELS[habit.difficulty]}
          <span className="ml-1 inline-flex text-accent">
            {Array.from({ length: starsFor(habit.difficulty) }).map((_, i) => (
              <Star key={i} className="size-3 fill-current" />
            ))}
          </span>
        </span>
        <span className="tabular-nums">+{habit.xpReward} XP</span>
        {stats.map(([k, v]) => (
          <span key={k} title={STAT_LABELS[k as StatKey]}>
            {STAT_ABBR_LABELS[k as StatKey] ?? k} +{v}
          </span>
        ))}
        {streak > 0 && !weekly ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <Flame className="size-3.5" />
            <span className="tabular-nums">{streak} day streak</span>
          </span>
        ) : null}
      </div>

      {weekly && weekProgress ? (
        <div className="mt-3">
          <Meter value={weekProgress.value} max={weekProgress.target} label={`${habit.name} weekly progress`} />
          <p className="mt-1 text-xs tabular-nums text-muted">
            {weekProgress.value} / {weekProgress.target} {habit.unit || "days"} this week
          </p>
        </div>
      ) : null}

      {needsStepper ? (
        <div className="mt-3">
          <Meter value={value} max={target} label={`${habit.name} progress`} />
          <p className="mt-1 text-xs tabular-nums text-muted">
            {value} / {target} {habit.unit}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        {needsStepper && !done && onIncrement ? (
          <>
            <Button variant="secondary" size="icon" aria-label="Decrease" onClick={() => onIncrement(-1)}>
              <Minus />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Increase" onClick={() => onIncrement(1)}>
              <Plus />
            </Button>
          </>
        ) : null}
        <Button
          className="ml-auto min-w-32"
          variant={done || weekDone ? "secondary" : "primary"}
          disabled={done || busy}
          onClick={onComplete}
        >
          {done || weekDone
            ? weekly && !weekDone
              ? "Logged today"
              : "Completed"
            : habit.type === "negative"
              ? "Avoided"
              : weekly
                ? "Log today"
                : "Complete quest"}
        </Button>
      </div>
    </SystemFrame>
  );
}
