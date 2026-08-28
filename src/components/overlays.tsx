import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { STAT_LABELS } from "@/lib/i18n/catalog";
import { SystemFrame } from "@/components/system/frame";
import type { PlayerStats, StatKey } from "@/types/hibi";

function CountUp({ to, active }: { to: number; active: boolean }) {
  const [n, setN] = useState(active ? 0 : to);
  useEffect(() => {
    if (!active) {
      setN(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      setN(Math.round(to * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return <span className="tabular-nums">{n}</span>;
}

function StatLines({ stats }: { stats: Partial<PlayerStats> }) {
  const rows = Object.entries(stats).filter(([, v]) => (v ?? 0) > 0);
  if (rows.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1 text-sm text-muted">
      {rows.map(([k, v]) => (
        <li key={k}>
          +{v} {STAT_LABELS[k as StatKey] ?? k}
        </li>
      ))}
    </ul>
  );
}

export function ProgressionOverlays() {
  const overlay = useAppStore((s) => s.overlay);
  const dismiss = useAppStore((s) => s.dismissOverlay);
  const animate = useAppStore((s) => s.state?.settings.xpAnimations !== false);
  const reduced = useAppStore((s) => Boolean(s.state?.settings.reducedMotion));
  const count = animate && !reduced;

  useEffect(() => {
    if (!overlay || overlay.kind !== "quest") return;
    if (overlay.levelTo || overlay.rankTo || overlay.achievement) return;
    const t = window.setTimeout(() => dismiss(), 2800);
    return () => window.clearTimeout(t);
  }, [overlay, dismiss]);

  if (!overlay) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      onClick={overlay.kind === "quest" && !overlay.levelTo && !overlay.rankTo ? dismiss : undefined}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <SystemFrame className="system-window p-8 text-center">
        {overlay.kind === "quest" ? (
          <>
            <p className="font-display text-[11px] tracking-[0.28em] text-accent uppercase">Quest complete</p>
            <h2 id="overlay-title" className="mt-3 font-display text-3xl">
              {overlay.name}
            </h2>
            <p className="mt-5 font-display text-4xl text-accent">
              +<CountUp to={overlay.xp} active={count} /> XP
            </p>
            {overlay.combo > 1 ? (
              <p className="mt-2 text-xs tracking-[0.16em] text-warning uppercase">Combo ×{overlay.combo}</p>
            ) : null}
            <StatLines stats={overlay.stats} />
            {overlay.levelTo ? (
              <p className="mt-5 font-display text-sm tracking-[0.18em] text-accent uppercase">
                Level up {overlay.levelFrom} → {overlay.levelTo}
              </p>
            ) : null}
            {overlay.rankTo ? (
              <p className="mt-2 font-display text-sm tracking-[0.18em] text-legendary uppercase">
                Rank {overlay.rankFrom} → {overlay.rankTo}
              </p>
            ) : null}
            {overlay.achievement ? (
              <p className="mt-2 text-sm text-muted">
                Achievement · {overlay.achievement.name}
              </p>
            ) : null}
          </>
        ) : null}
        {overlay.kind === "level" ? (
          <>
            <p className="font-display text-[11px] tracking-[0.24em] text-accent uppercase">Level up</p>
            <h2 id="overlay-title" className="mt-3 font-display text-4xl">
              Level {overlay.to}
            </h2>
            <StatLines stats={overlay.gains} />
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
    </div>
  );
}

export function XpToasts() {
  return null;
}
