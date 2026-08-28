import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { RARITY_LABELS } from "@/lib/i18n/catalog";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { Rarity } from "@/types/hibi";

export const Route = createFileRoute("/_app/achievements")({ component: AchievementsPage });

const RARITY_COLOR: Record<Rarity, string> = {
  common: "text-muted",
  uncommon: "text-success",
  rare: "text-accent",
  epic: "text-warning",
  legendary: "text-legendary",
  mythic: "text-fg",
};

function AchievementsPage() {
  const state = useAppStore((s) => s.state);
  const [open, setOpen] = useState<string | null>(null);
  if (!state) return null;
  const unlocked = new Map(state.achievements.map((a) => [a.id, a.unlockedAt]));
  const reveal = state.settings.revealSecretAchievements;

  if (state.achievements.length === 0 && state.habits.length === 0) {
    return (
      <div className="space-y-5">
        <header>
          <Kicker>Collection</Kicker>
          <h1 className="font-display text-3xl">Achievements</h1>
        </header>
        <SystemFrame>
          <p className="font-display text-xl">No achievements yet</p>
          <p className="mt-2 text-sm text-muted">Complete your first quest to begin your collection.</p>
        </SystemFrame>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <Kicker>Collection</Kicker>
        <h1 className="font-display text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-muted">
          {unlocked.size} / {ACHIEVEMENTS.length} unlocked
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const date = unlocked.get(a.id);
          const hidden = a.secret && !date && !reveal;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setOpen(open === a.id ? null : a.id)}
              className={cn(
                "rounded-xl bg-card p-4 text-left shadow-[var(--shadow-border)]",
                !date && "opacity-60",
              )}
            >
              <p className={cn("text-[10px] tracking-[0.16em] uppercase", RARITY_COLOR[a.rarity])}>
                {RARITY_LABELS[a.rarity]}
              </p>
              <h2 className="mt-1 font-display text-lg">{hidden ? "???" : a.name}</h2>
              <p className="mt-1 text-sm text-muted">{hidden ? "Secret achievement." : a.description}</p>
              {open === a.id ? (
                <div className="mt-3 text-xs text-subtle">
                  {date ? <p>Unlocked {date.slice(0, 10)}</p> : <p>Locked</p>}
                  <p className="mt-1">Reward +{a.xp} XP</p>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
