import { cn } from "@/lib/utils";

export function HibiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-accent", className)} aria-hidden>
      <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.08" />
      <path fill="currentColor" d="M16 6 24 14h-4l-4-4-4 4H8Z" />
      <path fill="currentColor" d="M8 14h6v4h4v-4h6v14h-6v-6h-4v6H8Z" />
    </svg>
  );
}

export function HibiWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <HibiMark className="size-9" />
      <span className="font-display text-xl font-semibold tracking-[0.28em]">HIBI</span>
    </div>
  );
}
