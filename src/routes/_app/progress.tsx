import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heatmap } from "@/components/progress/heatmap";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { Meter } from "@/components/ui/progress";
import { CATEGORY_LABELS, STAT_ABBR_LABELS, STAT_LABELS } from "@/lib/i18n/catalog";
import { localDateId } from "@/lib/game/dates";
import { formatNumber } from "@/lib/utils";
import { mostProductiveDay, weeklyCounts } from "@/lib/selectors";
import { useAppStore } from "@/store/app-store";
import { STAT_KEYS } from "@/types/hibi";
import { GATES, gateForRank, nextGate, seasonForDate } from "@/lib/game/gates";
import { nextRankRequirement } from "@/lib/game/progression";

export const Route = createFileRoute("/_app/progress")({ component: ProgressPage });

function ProgressPage() {
  const state = useAppStore((s) => s.state);
  const [range, setRange] = useState<90 | 180 | 365>(90);
  if (!state) return null;
  const { player } = state;
  const completed = state.completions.filter((c) => c.completed);
  const week = weeklyCounts(state);
  const gate = gateForRank(player.rank);
  const upcoming = nextGate(player.rank);
  const rankNeed = nextRankRequirement(player.rank);
  const season = seasonForDate(localDateId());
  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of completed) {
      const h = state.habits.find((x) => x.id === c.habitId);
      const cat = h?.category ?? "custom";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [completed, state.habits]);
  const best = byCat[0];
  const worst = byCat[byCat.length - 1];
  const daysActive = new Set(completed.map((c) => c.date)).size;
  const rate = daysActive === 0 ? 0 : Math.round((completed.length / Math.max(player.dayCount * Math.max(1, state.habits.length), 1)) * 100);

  return (
    <div className="space-y-5">
      <header>
        <Kicker>Analytics</Kicker>
        <h1 className="font-display text-3xl">Progress</h1>
      </header>

      <SystemFrame label="Gates">
        <p className="font-display text-2xl">{gate.name}</p>
        <p className="mt-1 text-sm text-muted">
          Rank {player.rank} · {season.name}
        </p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {GATES.map((g) => (
            <li
              key={g.rank}
              className={`rounded-md px-2 py-1 font-display text-[11px] tracking-[0.14em] uppercase ${
                g.rank === player.rank ? "bg-accent text-accent-fg" : "bg-surface text-muted"
              }`}
            >
              {g.rank}
            </li>
          ))}
        </ol>
        {upcoming ? (
          <p className="mt-3 text-sm text-subtle">
            Next: {upcoming.name} (Rank {upcoming.rank}
            {rankNeed ? ` · lv ${rankNeed.level} · ${rankNeed.achievements} achievements` : ""})
          </p>
        ) : (
          <p className="mt-3 text-sm text-subtle">Peak gate. Seasons still rotate.</p>
        )}
      </SystemFrame>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile k="Level" v={String(player.level)} />
        <Tile k="Rank" v={player.rank} />
        <Tile k="Total XP" v={formatNumber(player.totalXp)} />
        <Tile k="Quests" v={formatNumber(completed.length)} />
        <Tile k="Streak" v={`${player.currentStreak}d`} />
        <Tile k="Best streak" v={`${player.longestStreak}d`} />
        <Tile k="Completion" v={`${Math.min(100, rate)}%`} />
        <Tile k="Best day" v={mostProductiveDay(state)} />
      </div>

      <SystemFrame label="Weekly activity">
        <div className="flex h-40 items-end gap-2">
          {week.map((d) => {
            const max = Math.max(1, ...week.map((x) => x.count));
            const h = Math.max(d.count > 0 ? 12 : 4, Math.round((d.count / max) * 120));
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-10 rounded-sm bg-accent/80"
                  style={{ height: h }}
                  title={`${d.label}: ${d.count}`}
                />
                <span className="text-[10px] text-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
      </SystemFrame>

      <SystemFrame label="Activity heatmap">
        <div className="mb-3 flex gap-2">
          {([90, 180, 365] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRange(d)}
              className={`h-9 rounded-md px-3 text-xs ${range === d ? "bg-accent text-accent-fg" : "bg-surface text-muted"}`}
            >
              {d === 90 ? "3 months" : d === 180 ? "6 months" : "1 year"}
            </button>
          ))}
        </div>
        <Heatmap state={state} days={range} />
      </SystemFrame>

      <SystemFrame label="Attributes">
        <p className="mb-3 text-xs text-subtle">
          Game statistics for progression. STR, WIL, and ENE are not medical measurements.
        </p>
        <div className="space-y-3">
          {STAT_KEYS.map((key) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>
                  {STAT_ABBR_LABELS[key]} · {STAT_LABELS[key]}
                </span>
                <span className="tabular-nums">{player.stats[key]}</span>
              </div>
              <Meter value={player.stats[key]} max={Math.max(20, ...STAT_KEYS.map((k) => player.stats[k]))} />
            </div>
          ))}
        </div>
      </SystemFrame>

      <SystemFrame label="Categories">
        {byCat.length === 0 ? (
          <p className="text-sm text-muted">Complete quests to see category performance.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {byCat.map(([id, n]) => (
              <li key={id} className="flex justify-between">
                <span>{CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS] ?? id}</span>
                <span className="tabular-nums text-muted">{n}</span>
              </li>
            ))}
          </ul>
        )}
        {best && worst && best[0] !== worst[0] ? (
          <p className="mt-3 text-xs text-subtle">
            Strongest: {CATEGORY_LABELS[best[0] as keyof typeof CATEGORY_LABELS]}. Weakest:{" "}
            {CATEGORY_LABELS[worst[0] as keyof typeof CATEGORY_LABELS]}.
          </p>
        ) : null}
      </SystemFrame>

      <p className="text-xs text-subtle">Local date {localDateId()} · all figures derived from your ledger.</p>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{k}</p>
      <p className="mt-1 font-display text-lg tabular-nums">{v}</p>
    </div>
  );
}
