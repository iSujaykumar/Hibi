import { heatmapValues } from "@/lib/selectors";
import type { GameState } from "@/types/hibi";
import { cn } from "@/lib/utils";

export function Heatmap({
  state,
  days,
}: {
  state: GameState;
  days: number;
}) {
  const values = heatmapValues(state, days);
  const max = Math.max(1, ...values.map((v) => v.count));
  return (
    <div className="overflow-x-auto">
      <div
        className="grid w-max grid-flow-col grid-rows-7 gap-1"
        role="img"
        aria-label="Activity heatmap"
      >
        {values.map((v) => {
          const t = v.count / max;
          return (
            <div
              key={v.date}
              title={`${v.date}: ${v.count} quests`}
              className={cn("heatmap-cell", v.count === 0 && "bg-fg/10")}
              style={
                v.count > 0
                  ? {
                      background: `color-mix(in oklab, var(--hibi-accent) ${Math.round(30 + t * 70)}%, transparent)`,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
