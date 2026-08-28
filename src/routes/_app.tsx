import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.state?.player.onboarded);
  useEffect(() => {
    if (!onboarded) navigate({ to: "/onboarding" });
  }, [onboarded, navigate]);
  if (!onboarded) return null;
  return <AppShell />;
}
