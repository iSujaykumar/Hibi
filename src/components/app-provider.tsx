import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/app-store";
import { ProgressionOverlays, XpToasts } from "@/components/overlays";
import { GateBackdrop } from "@/components/brand/gate-splash";
import { scheduleReminders } from "@/services/notifications";
import { localDateId } from "@/lib/game/dates";

export function AppProvider({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const state = useAppStore((s) => s.state);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!state) return;
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.classList.toggle("reduce-motion", state.settings.reducedMotion);
  }, [state?.settings.theme, state?.settings.reducedMotion]);

  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!state) return;
    const today = localDateId();
    const remaining = state.habits.filter((h) => h.active && !h.archived && h.frequency === "daily")
      .filter((h) => !state.completions.some((c) => c.habitId === h.id && c.date === today && c.completed))
      .length;
    scheduleReminders(state.settings, state.habits, remaining, state.player.currentStreak);
  }, [state]);

  if (!hydrated) {
    return (
      <div className="relative isolate min-h-dvh overflow-hidden bg-black">
        <GateBackdrop overlay={false} />
      </div>
    );
  }

  return (
    <>
      {children}
      <ProgressionOverlays />
      <XpToasts />
      <Toaster theme="dark" position="top-center" richColors={false} />
    </>
  );
}
