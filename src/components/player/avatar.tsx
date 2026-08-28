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

export function PlayerAvatar({
  avatar,
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
      <div
        className={cn(
          "grid place-items-center rounded-lg bg-accent/10 text-accent",
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
      {labeled ? (
        <div className="min-w-0">
          <p className="truncate font-display text-sm">{name}</p>
          <p className="truncate text-xs text-muted">{AVATAR_BLURBS[avatar]}</p>
        </div>
      ) : (
        <span className="sr-only">{name} avatar</span>
      )}
    </div>
  );
}

export function AvatarGlyph({ avatar }: { avatar: AvatarId }) {
  const Icon = ICONS[avatar] ?? Hexagon;
  return <Icon className="size-5" strokeWidth={1.6} />;
}
