import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GateBackdrop } from "@/components/brand/gate-splash";
import { COPY } from "@/lib/game/messages";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({ component: TitleScreen });

function TitleScreen() {
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.state?.player.onboarded);

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-end overflow-hidden bg-black px-6 pb-16 text-center text-white">
      <GateBackdrop />
      <div className="enter-up relative z-10 flex w-full max-w-md flex-col items-center">
        <h1 className="font-display text-5xl font-semibold tracking-[0.28em] sm:text-7xl">HIBI</h1>
        <p className="mt-4 font-display text-[11px] tracking-[0.28em] text-white/70 uppercase">
          {COPY.brand.system}
        </p>
        <p className="mt-6 text-sm text-white/75">{COPY.brand.line}</p>
        <Button
          className="mt-10 min-w-56 tracking-[0.14em] uppercase"
          size="lg"
          onClick={() => navigate({ to: onboarded ? "/home" : "/onboarding" })}
        >
          {onboarded ? COPY.actions.continue : COPY.actions.enter}
        </Button>
        <p className="mt-4 text-xs text-white/50">
          {onboarded ? COPY.brand.tagline : COPY.brand.short}
        </p>
      </div>
    </main>
  );
}
