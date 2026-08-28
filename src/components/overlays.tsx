import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { STAT_LABELS } from "@/lib/i18n/catalog";
import { SystemFrame } from "@/components/system/frame";

export function ProgressionOverlays() {
  const overlay = useAppStore((s) => s.overlay);
  const dismiss = useAppStore((s) => s.dismissOverlay);
  if (!overlay) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
    >
      <SystemFrame className="w-full max-w-md p-8 text-center">
        {overlay.kind === "level" ? (
          <>
            <p className="font-display text-[11px] tracking-[0.24em] text-accent uppercase">Level up</p>
            <h2 id="overlay-title" className="mt-3 font-display text-4xl">
              Level {overlay.to}
            </h2>
            <ul className="mt-5 space-y-1 text-sm text-muted">
              {Object.entries(overlay.gains).map(([k, v]) =>
                v ? (
                  <li key={k}>
                    +{v} {STAT_LABELS[k as keyof typeof STAT_LABELS]}
                  </li>
                ) : null,
              )}
            </ul>
            <p className="mt-4 text-sm text-subtle">Your potential has increased.</p>
          </>
        ) : null}
        {overlay.kind === "rank" ? (
          <>
            <p className="font-display text-[11px] tracking-[0.24em] text-accent uppercase">Rank promoted</p>
            <h2 id="overlay-title" className="mt-3 font-display text-4xl">
              Rank {overlay.to}
            </h2>
            <p className="mt-4 text-sm text-muted">
              {overlay.from} → {overlay.to}
            </p>
          </>
        ) : null}
        {overlay.kind === "achievement" ? (
          <>
            <p className="font-display text-[11px] tracking-[0.24em] text-accent uppercase">
              New achievement
            </p>
            <h2 id="overlay-title" className="mt-3 font-display text-3xl">
              {overlay.name}
            </h2>
            <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">{overlay.rarity}</p>
          </>
        ) : null}
        <Button className="mt-8 w-full" onClick={dismiss}>
          Continue
        </Button>
      </SystemFrame>
    </div>
  );
}

export function XpToasts() {
  const events = useAppStore((s) => s.lastEvents);
  const quest = events.find((e) => e.type === "quest_complete");
  if (!quest || quest.type !== "quest_complete") return null;
  return (
    <div className="xp-float pointer-events-none fixed top-24 left-1/2 z-40 -translate-x-1/2 font-display text-sm tracking-wide text-accent">
      Quest complete · +{quest.xp} XP
    </div>
  );
}
