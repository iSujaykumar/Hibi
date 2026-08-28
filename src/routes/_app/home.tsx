import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Plus } from "lucide-react";
import { PlayerHero } from "@/components/player/player-hero";
import { QuestCard } from "@/components/quests/quest-card";
import { Button } from "@/components/ui/button";
import { EmptyState, Kicker, SystemFrame } from "@/components/system/frame";
import { greetingForHour } from "@/lib/game/dates";
import { messageForDate } from "@/lib/game/messages";
import { recommendations } from "@/lib/game/recommendations";
import { xpRequired } from "@/lib/game/progression";
import {
  completionFor,
  dailyProgress,
  dueToday,
  stepFor,
  streakOf,
  weekProgress,
  xpToday,
} from "@/lib/selectors";
import { localDateId } from "@/lib/game/dates";
import { useAppStore } from "@/store/app-store";
import { formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/_app/home")({ component: HomePage });

function HomePage() {
  const state = useAppStore((s) => s.state);
  const complete = useAppStore((s) => s.complete);
  const recover = useAppStore((s) => s.recoverStreak);
  const dismissReview = useAppStore((s) => s.dismissReview);
  if (!state) return null;
  const { player } = state;
  const today = localDateId();
  const hour = new Date().getHours();
  const greet = greetingForHour(hour);
  const due = dueToday(state, today);
  const progress = dailyProgress(state, today);
  const recs = recommendations(state, today);
  const needed = xpRequired(player.level);
  const remaining = Math.max(0, needed - player.xp);

  return (
    <div className="space-y-5">
      <header className="enter-up">
        <Kicker>
          Good {greet}, player
        </Kicker>
        <h1 className="mt-1 font-display text-3xl">Day {player.dayCount}</h1>
        <p className="mt-1 text-sm text-muted">{messageForDate(today)}</p>
      </header>

      {player.pendingMissDate && player.streakShields > 0 && state.settings.streakProtection ? (
        <SystemFrame label="Quest incomplete">
          <p className="text-sm text-muted">
            A day was missed. Recovery is available. Reset and continue.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void recover()}>Recover</Button>
            <Button variant="ghost" onClick={() => void useAppStore.getState().updatePlayer({ pendingMissDate: null })}>
              Continue
            </Button>
          </div>
        </SystemFrame>
      ) : null}

      {state.lastReview && player.lastDailyReviewDate !== state.lastReview.date ? (
        <SystemFrame label="Daily report">
          <p className="font-display text-2xl">Rating {state.lastReview.rating}</p>
          <p className="mt-2 text-sm text-muted">
            Quests {state.lastReview.completed} / {state.lastReview.total} · +{state.lastReview.xp} XP
          </p>
          <p className="mt-3 text-sm text-subtle">Tomorrow's objective: keep going.</p>
          <Button className="mt-4" variant="secondary" onClick={() => void dismissReview()}>
            Dismiss
          </Button>
        </SystemFrame>
      ) : null}

      <PlayerHero player={player} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Today" value={`${progress.done} / ${progress.total} quests`} />
        <StatChip
          label="Streak"
          value={`${player.currentStreak} days`}
          icon
        />
        <StatChip label="Next level" value={`${formatNumber(remaining)} XP away`} />
        <StatChip label="Today XP" value={`+${formatNumber(xpToday(state, today))}`} />
        {player.comboCount > 1 ? (
          <StatChip label="Combo" value={`×${player.comboCount}`} />
        ) : null}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Kicker>Today's quests</Kicker>
            <h2 className="font-display text-xl">Active board</h2>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/habits/new">
              <Plus className="size-4" />
              Quest
            </Link>
          </Button>
        </div>
        {due.length === 0 ? (
          <EmptyState
            title="No active quests."
            body="Hibi can generate a starting protocol from your focus, or you can create a custom quest."
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
            {due.slice(0, 6).map((habit) => (
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
                    value: Math.max(0, (completionFor(state, habit.id, today)?.value ?? 0) + stepFor(habit) * delta),
                  })
                }
              />
            ))}
          </div>
        )}
        {progress.total > 0 ? (
          <p className="mt-4 text-center text-xs tracking-[0.16em] text-muted uppercase">
            Daily bonus · complete all · +150 XP · {progress.done}/{progress.total}
          </p>
        ) : null}
      </section>

      {recs.length > 0 ? (
        <SystemFrame label="System recommendation">
          <ul className="space-y-2 text-sm text-muted">
            {recs.map((r) => (
              <li key={r.id}>{r.body}</li>
            ))}
          </ul>
        </SystemFrame>
      ) : null}
    </div>
  );
}

function StatChip({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-xl bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 flex items-center gap-1 font-display text-sm">
        {icon ? <Flame className="size-3.5 text-warning" /> : null}
        {value}
      </p>
    </div>
  );
}
