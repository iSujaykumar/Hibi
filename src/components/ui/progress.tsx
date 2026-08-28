import { cn } from "@/lib/utils";

export function Meter({
  value,
  max = 100,
  className,
  barClassName,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, max <= 0 ? 0 : (value / max) * 100));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-fg/10", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full origin-left rounded-full bg-accent", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
