import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Plus } from "lucide-react";
import { PlayerHero } from "@/components/player/player-hero";
import { QuestCard } from "@/components/quests/quest-card";
import { Button } from "@/components/ui/button";
import { EmptyState, Kicker, SystemFrame } from "@/components/system/frame";
import { recommendations } from "@/lib/game/recommendations";
import { xpRequired, nextRankRequirement } from "@/lib/game/progression";
import { gateForRank, nextGate, seasonForDate } from "@/lib/game/gates";
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
  const acceptWound = useAppStore((s) => s.acceptWound);
  const dismissReview = useAppStore((s) => s.dismissReview);
  if (!state) return null;
  const { player } = state;
  const today = localDateId();
  const hour = new Date().getHours();
  const due = dueToday(state, today);
  const progress = dailyProgress(state, today);
  const recs = recommendations(state, today);
  const needed = xpRequired(player.level);
  const remainingXp = Math.max(0, needed - player.xp);
  const remaining = Math.max(0, progress.total - progress.done);
  const gate = gateForRank(player.rank);
  const upcoming = nextGate(player.rank);
  const rankNeed = nextRankRequirement(player.rank);
  const season = seasonForDate(today);
  const late = remaining > 0 && hour >= 20;
  const clear = progress.total > 0 && remaining === 0;
  const wounded = Boolean(player.pendingMissDate);

  return (
    <div className="space-y-5">
      <header className="enter-up">
        <Kicker>Daily briefing</Kicker>
        <h1 className="mt-1 font-display text-3xl">Day {player.dayCount}</h1>
        <p className="mt-1 text-sm text-muted">
          {gate.name} · {season.name}
        </p>
        <p className="mt-2 text-sm text-fg">
          {progress.total === 0
            ? "No protocol issued. Generate one or create a quest."
            : clear
              ? "Protocol clear. The board is quiet."
              : late
                ? `${remaining} quest${remaining === 1 ? "" : "s"} still open. Penalty window.`
                : `${progress.total} quests issued · ${remaining} remaining.`}
        </p>
      </header>

      {wounded ? (
        <SystemFrame label="Streak wounded">
          <p className="font-display text-2xl text-danger">Rank at risk</p>
          <p className="mt-2 text-sm text-muted">
            A protocol day was missed. Streak of {player.currentStreak} will collapse unless recovered.
            {rankNeed ? ` Next rank ${rankNeed.rank} still needs level ${rankNeed.level} and ${rankNeed.achievements} achievements.` : ""}
          </p>
          <div className="mt-4 flex gap-2">
            {player.streakShields > 0 && state.settings.streakProtection ? (
              <Button onClick={() => void recover()}>Use shield ({player.streakShields})</Button>
            ) : null}
            <Button variant="ghost" onClick={() => void acceptWound()}>
              Accept the wound
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
        <StatChip label="Board" value={`${progress.done} / ${progress.total} clear`} />
        <StatChip label="Streak" value={`${player.currentStreak} days`} icon />
        <StatChip label="Next level" value={`${formatNumber(remainingXp)} XP`} />
        <StatChip label="Today XP" value={`+${formatNumber(xpToday(state, today))}`} />
        {player.comboCount > 1 ? <StatChip label="Combo" value={`×${player.comboCount}`} /> : null}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Kicker>Mission board</Kicker>
            <h2 className="font-display text-xl">{clear ? "Cleared" : "Active protocol"}</h2>
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
            {clear
              ? "Daily bonus armed · +150 XP"
              : `Daily bonus · complete all · +150 XP · ${progress.done}/${progress.total}`}
          </p>
        ) : null}
      </section>

      {upcoming ? (
        <SystemFrame label="Next gate">
          <p className="font-display text-xl">{upcoming.name}</p>
          <p className="mt-2 text-sm text-muted">
            Rank {upcoming.rank}
            {rankNeed ? ` · level ${rankNeed.level} · ${rankNeed.achievements} achievements` : null}
          </p>
          <p className="mt-2 text-xs text-subtle">{upcoming.blurb}</p>
        </SystemFrame>
      ) : (
        <SystemFrame label="Afterlight">
          <p className="font-display text-xl">{season.name}</p>
          <p className="mt-2 text-sm text-muted">
            Peak rank held. Seasons still rotate. Keep the protocol.
          </p>
        </SystemFrame>
      )}

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
