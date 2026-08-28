import type { AppSettings, Habit } from "@/types/hibi";

const timers = new Set<number>();

export async function requestNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function canNotify(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

export function showNotification(title: string, body: string) {
  if (!canNotify()) return;
  try {
    new Notification(title, { body, silent: false });
  } catch {
    /* ignore */
  }
}

export function clearScheduled() {
  for (const t of timers) window.clearTimeout(t);
  timers.clear();
}

function msUntilHour(hour: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function scheduleReminders(settings: AppSettings, habits: Habit[], remainingToday: number, streak: number) {
  if (typeof window === "undefined") return;
  clearScheduled();
  const arm = (delay: number, fn: () => void) => {
    const id = window.setTimeout(fn, delay);
    timers.add(id);
  };
  if (settings.morningReminder) {
    arm(msUntilHour(settings.morningHour), () => {
      showNotification("HIBI", "Morning protocol is ready. Open your quest board.");
    });
  }
  if (settings.eveningReminder) {
    arm(msUntilHour(settings.eveningHour), () => {
      if (remainingToday > 0) {
        showNotification("Quest reminder", "Your evening quest is waiting.");
      }
    });
  }
  if (settings.streakReminders && streak >= 3 && remainingToday > 0) {
    arm(msUntilHour(21), () => {
      showNotification("Streak warning", `Your ${streak}-day streak is still alive.`);
    });
  }
  if (settings.habitReminders) {
    for (const habit of habits) {
      if (!habit.reminder || !habit.active || habit.archived) continue;
      const [h, m] = habit.reminder.split(":").map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h || 0, m || 0, 0, 0);
      if (target.getTime() <= now.getTime()) continue;
      arm(target.getTime() - now.getTime(), () => {
        showNotification("Quest reminder", habit.name);
      });
    }
  }
}
