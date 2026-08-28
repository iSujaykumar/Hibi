import type { Player } from "@/types/hibi";
import { Meter } from "@/components/ui/progress";
import { PlayerAvatar } from "./avatar";
import { StatsGrid } from "./stats-grid";
import { SystemFrame } from "@/components/system/frame";
import { ARCHETYPE_META, playDifficultyLabel } from "@/lib/i18n/catalog";
import { FOCUS_CONFIG, isFocusId } from "@/lib/game/config";
import { titleName } from "@/lib/game/achievements";
import { nextRankRequirement, xpRequired } from "@/lib/game/progression";
import { formatNumber } from "@/lib/utils";

export function PlayerHero({ player }: { player: Player }) {
  const needed = xpRequired(player.level);
  const next = nextRankRequirement(player.rank);
  const focusId = player.focuses[0];
  const focusName = focusId && isFocusId(focusId) ? FOCUS_CONFIG[focusId].name : "Growth";
  const difficulty = playDifficultyLabel(player.playDifficulty);
  return (
    <SystemFrame label="Player">
      <div className="flex items-center gap-4">
        <PlayerAvatar avatar={player.avatar} rank={player.rank} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl leading-tight">{player.name}</p>
          <p className="mt-1 text-xs tracking-[0.16em] text-muted uppercase">
            {titleName(player.equippedTitle)} · Rank {player.rank} · Level {player.level}
          </p>
          <p className="mt-1 truncate text-xs text-subtle">
            {ARCHETYPE_META[player.archetype]?.name ?? "Adaptive"} · {focusName} · {difficulty.name}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between text-xs text-muted">
          <span>XP</span>
          <span className="tabular-nums">
            {formatNumber(player.xp)} / {formatNumber(needed)}
          </span>
        </div>
        <Meter value={player.xp} max={needed} label="Experience" className="h-2" />
        {next ? (
          <p className="mt-2 text-xs text-subtle">
            Next rank {next.rank}: level {next.level} and {next.achievements} achievements
          </p>
        ) : (
          <p className="mt-2 text-xs text-subtle">Peak rank attained.</p>
        )}
      </div>
      <div className="mt-5">
        <StatsGrid player={player} />
      </div>
    </SystemFrame>
  );
}
