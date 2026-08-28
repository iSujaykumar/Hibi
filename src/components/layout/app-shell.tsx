import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Award, Home, ScrollText, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/game/messages";
import { HibiMark } from "@/components/brand/logo";

const ITEMS = [
  { to: "/home", label: COPY.nav.home, icon: Home },
  { to: "/quests", label: COPY.nav.quests, icon: ScrollText },
  { to: "/progress", label: COPY.nav.progress, icon: TrendingUp },
  { to: "/achievements", label: COPY.nav.achievements, icon: Award },
  { to: "/profile", label: COPY.nav.profile, icon: User },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed top-0 left-0 hidden h-dvh w-56 flex-col border-r border-border px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <HibiMark className="size-8" />
          <span className="font-display text-sm tracking-[0.24em]">HIBI</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {ITEMS.map((item) => (
            <NavLink key={item.to} {...item} active={pathname === item.to || pathname.startsWith(`${item.to}/`)} />
          ))}
        </nav>
      </aside>
      <div className="lg:pl-56">
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 safe-bottom lg:max-w-5xl lg:px-8 lg:pb-12">
          <Outlet />
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex h-11 items-center gap-3 rounded-md px-3 text-sm",
        active ? "bg-card text-fg" : "text-muted hover:text-fg",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
