import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { HibiMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/game/messages";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({ component: TitleScreen });

function TitleScreen() {
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.state?.player.onboarded);
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 53) % 100}%`,
        top: `${(i * 37) % 100}%`,
        delay: `${(i % 8) * 0.6}s`,
        duration: `${10 + (i % 5)}s`,
      })),
    [],
  );

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center text-fg">
      <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--hibi-accent) 14%, transparent), transparent 55%)",
        }}
      />
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}
      <div className="enter-up relative z-10 flex max-w-md flex-col items-center">
        <HibiMark className="size-16" />
        <h1 className="mt-6 font-display text-5xl font-semibold tracking-[0.28em] sm:text-7xl">HIBI</h1>
        <p className="mt-4 font-display text-[11px] tracking-[0.28em] text-muted uppercase">
          {COPY.brand.system}
        </p>
        <p className="mt-6 text-sm text-muted">{COPY.brand.line}</p>
        <Button
          className="mt-10 min-w-56 tracking-[0.14em] uppercase"
          size="lg"
          onClick={() => navigate({ to: onboarded ? "/home" : "/onboarding" })}
        >
          {onboarded ? COPY.actions.continue : COPY.actions.enter}
        </Button>
        {onboarded ? (
          <p className="mt-4 text-xs text-subtle">{COPY.brand.tagline}</p>
        ) : (
          <p className="mt-4 text-xs text-subtle">{COPY.brand.short}</p>
        )}
      </div>
    </main>
  );
}
