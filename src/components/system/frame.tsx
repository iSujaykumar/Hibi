import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SystemFrame({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={cn("system-frame p-5", className)}>
      {label ? (
        <p className="mb-3 font-display text-[11px] font-medium tracking-[0.22em] text-accent uppercase">
          {label}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <SystemFrame className="text-center">
      <Kicker>System ready</Kicker>
      <h2 className="mt-3 font-display text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </SystemFrame>
  );
}
