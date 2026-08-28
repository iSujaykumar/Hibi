import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { Meter } from "@/components/ui/progress";
import { BOSS_TEMPLATES } from "@/lib/game/templates";
import { localDateId, shiftLocalDate } from "@/lib/game/dates";
import { uid } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/_app/bosses")({ component: BossesPage });

function BossesPage() {
  const state = useAppStore((s) => s.state);
  const saveBoss = useAppStore((s) => s.saveBoss);
  if (!state) return null;
  const enabled = state.settings.bossBattles;
  const today = localDateId();

  function start(templateId: string) {
    const t = BOSS_TEMPLATES.find((b) => b.id === templateId);
    if (!t) return;
    void saveBoss({
      id: uid(),
      name: t.name,
      description: t.description,
      startDate: today,
      endDate: shiftLocalDate(today, t.days - 1),
      target: t.target,
      progress: 0,
      category: t.category,
      xpReward: t.xpReward,
      defeated: false,
      templateId: t.id,
    });
  }

  return (
    <div className="space-y-5">
      <header>
        <Kicker>Major challenges</Kicker>
        <h1 className="font-display text-3xl">Boss battles</h1>
      </header>
      {!enabled ? (
        <SystemFrame>
          <p className="text-sm text-muted">Boss battles are disabled in settings.</p>
        </SystemFrame>
      ) : null}
      {state.bosses.length === 0 ? (
        <p className="text-sm text-muted">No active bosses. Start one from the templates below.</p>
      ) : (
        <div className="space-y-3">
          {state.bosses.map((boss) => (
            <SystemFrame key={boss.id} label={boss.defeated ? "Defeated" : "Active"}>
              <h2 className="font-display text-xl">{boss.name}</h2>
              <p className="mt-1 text-sm text-muted">{boss.description}</p>
              <p className="mt-2 text-xs text-subtle">
                {boss.startDate} → {boss.endDate} · +{boss.xpReward} XP
              </p>
              <Meter className="mt-3 h-2" value={boss.progress} max={boss.target} label="Boss HP" />
              <p className="mt-1 text-xs tabular-nums text-muted">
                {boss.progress} / {boss.target}
              </p>
            </SystemFrame>
          ))}
        </div>
      )}
      <SystemFrame label="Templates">
        <div className="space-y-3">
          {BOSS_TEMPLATES.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display">{t.name}</p>
                <p className="text-sm text-muted">{t.description}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={!enabled} onClick={() => start(t.id)}>
                Engage
              </Button>
            </div>
          ))}
        </div>
      </SystemFrame>
    </div>
  );
}
