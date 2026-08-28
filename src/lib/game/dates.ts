// local YYYY-MM-DD — don't toISOString().slice(), that's UTC
export function localDateId(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(id: string): Date {
  const [y, m, d] = id.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shiftLocalDate(id: string, days: number): string {
  const dt = parseLocalDate(id);
  dt.setDate(dt.getDate() + days);
  return localDateId(dt);
}

export function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfWeek(id: string): string {
  const dt = parseLocalDate(id);
  const day = dt.getDay(); // 0 Sun
  const offset = day === 0 ? 6 : day - 1; // Monday start
  return shiftLocalDate(id, -offset);
}

export function greetingForHour(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function isDateId(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
