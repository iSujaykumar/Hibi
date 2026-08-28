import type { Player, StatKey } from "@/types/hibi";
import { STAT_KEYS } from "@/types/hibi";
import { Meter } from "@/components/ui/progress";
import { STAT_ABBR, STAT_META, statsForFocus } from "@/lib/game/config";
import { cn } from "@/lib/utils";

export function StatsGrid({
  player,
  compact = false,
  highlightFocus = true,
}: {
  player: Player;
  compact?: boolean;
  highlightFocus?: boolean;
}) {
  const focus = player.focuses[0] ?? "growth";
  const { primary, secondary } = statsForFocus(focus);
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary);

  return (
    <div>
      <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
        {STAT_KEYS.map((key: StatKey) => {
          const meta = STAT_META[key];
          const featured = primarySet.has(key);
          const soft = secondarySet.has(key);
          return (
            <div
              key={key}
              className={cn(
                "rounded-md bg-surface px-3 py-2",
                highlightFocus && featured && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--hibi-accent)_45%,transparent)]",
              )}
              title={meta.blurb}
            >
              <p className="flex items-baseline justify-between gap-2 text-[10px] tracking-[0.14em] text-muted uppercase">
                <span>{STAT_ABBR[key]}</span>
                {featured ? <span className="text-accent">Primary</span> : soft ? <span>Secondary</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">{meta.name}</p>
              <p className="mt-1 font-display text-lg tabular-nums">{player.stats[key] ?? 1}</p>
              {!compact ? <Meter value={(player.stats[key] ?? 1) % 10} max={10} className="mt-2 h-1" /> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-subtle">
        STR, WIL, ENE and the rest are game statistics for progression — not medical measurements.
      </p>
    </div>
  );
}
