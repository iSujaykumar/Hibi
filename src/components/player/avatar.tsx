import {
  BookOpen,
  Compass,
  Eye,
  Hexagon,
  Shield,
  Sparkles,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { AvatarId, RankId } from "@/types/hibi";
import { AVATAR_BLURBS, AVATAR_LABELS } from "@/lib/i18n/catalog";
import { cn } from "@/lib/utils";

const ICONS: Record<AvatarId, LucideIcon> = {
  shadow: Hexagon,
  warrior: Swords,
  scholar: BookOpen,
  explorer: Compass,
  guardian: Shield,
  rogue: Eye,
  mage: Sparkles,
};

const RANK_FRAME: Record<RankId, string> = {
  E: "bg-accent/10 text-accent ring-1 ring-border",
  D: "bg-accent/12 text-accent ring-1 ring-accent/40",
  C: "bg-accent/15 text-accent ring-2 ring-accent/70 shadow-[0_0_18px_var(--hibi-glow)]",
  B: "bg-accent/20 text-accent ring-2 ring-accent shadow-[0_0_24px_var(--hibi-glow)]",
  A: "bg-warning/10 text-warning ring-2 ring-warning/80 shadow-[0_0_24px_color-mix(in_oklab,var(--hibi-warning)_40%,transparent)]",
  S: "bg-legendary/15 text-legendary ring-2 ring-legendary shadow-[0_0_28px_color-mix(in_oklab,var(--hibi-legendary)_50%,transparent)]",
  SS: "rank-pulse bg-legendary/20 text-legendary ring-2 ring-legendary",
  SSS: "rank-pulse bg-legendary/25 text-legendary ring-2 ring-legendary",
  EX: "rank-pulse bg-accent/25 text-accent ring-2 ring-accent",
};

export function PlayerAvatar({
  avatar,
  rank = "E",
  size = "md",
  labeled = false,
}: {
  avatar: AvatarId;
  rank?: RankId;
  size?: "sm" | "md" | "lg";
  labeled?: boolean;
}) {
  const Icon = ICONS[avatar] ?? Hexagon;
  const name = AVATAR_LABELS[avatar];
  return (
    <div className={cn("flex items-center gap-3", labeled && "min-w-0")}>
      <div className="relative shrink-0">
        <div
          className={cn(
            "grid place-items-center rounded-lg",
            RANK_FRAME[rank] ?? RANK_FRAME.E,
            size === "sm" && "size-10",
            size === "md" && "size-14",
            size === "lg" && "size-20",
          )}
          aria-hidden
        >
          <Icon
            className={cn(size === "sm" && "size-5", size === "md" && "size-6", size === "lg" && "size-8")}
            strokeWidth={1.6}
          />
        </div>
        <span
          className={cn(
            "absolute -right-1 -bottom-1 grid place-items-center rounded-sm bg-bg font-display font-semibold text-accent ring-1 ring-accent/40",
            size === "sm" && "size-4 text-[8px]",
            size === "md" && "size-5 text-[9px]",
            size === "lg" && "size-6 text-[10px]",
          )}
        >
          {rank}
        </span>
      </div>
      {labeled ? (
        <div className="min-w-0">
          <p className="truncate font-display text-sm">{name}</p>
          <p className="truncate text-xs text-muted">{AVATAR_BLURBS[avatar]}</p>
        </div>
      ) : (
        <span className="sr-only">
          {name} avatar, rank {rank}
        </span>
      )}
    </div>
  );
}

export function AvatarGlyph({ avatar }: { avatar: AvatarId }) {
  const Icon = ICONS[avatar] ?? Hexagon;
  return <Icon className="size-5" strokeWidth={1.6} />;
}
