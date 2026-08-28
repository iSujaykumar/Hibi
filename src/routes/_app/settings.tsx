import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { requestNotifyPermission } from "@/services/notifications";
import { useAppStore } from "@/store/app-store";
import type { AppSettings, ThemeId } from "@/types/hibi";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

const THEMES: { id: ThemeId; name: string }[] = [
  { id: "system", name: "Dark System" },
  { id: "void", name: "Void" },
  { id: "midnight", name: "Midnight" },
  { id: "aurora", name: "Aurora" },
  { id: "obsidian", name: "Obsidian" },
  { id: "light", name: "Light" },
];

function SettingsPage() {
  const state = useAppStore((s) => s.state);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const exportJson = useAppStore((s) => s.exportJson);
  const importJson = useAppStore((s) => s.importJson);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const eraseAll = useAppStore((s) => s.eraseAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wipe, setWipe] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [pending, setPending] = useState<unknown>(null);
  if (!state) return null;
  const s = state.settings;

  function patch(p: Partial<AppSettings>) {
    void updateSettings(p);
  }

  function download() {
    const json = exportJson();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hibi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exported.");
  }

  async function onFile(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      setPending(raw);
    } catch {
      toast("That file is not valid JSON.");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <Kicker>Configuration</Kicker>
        <h1 className="font-display text-3xl">Settings</h1>
      </header>

      <SystemFrame label="Appearance">
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => patch({ theme: t.id })}
              className={`h-11 rounded-md text-sm ${s.theme === t.id ? "bg-accent text-accent-fg" : "bg-surface text-muted"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </SystemFrame>

      <SystemFrame label="Feedback">
        <Toggle label="XP animations" checked={s.xpAnimations} onChange={(v) => patch({ xpAnimations: v })} />
        <Toggle label="Quest sounds" checked={s.questSounds} onChange={(v) => patch({ questSounds: v })} />
        <Toggle label="Level-up effects" checked={s.levelUpEffects} onChange={(v) => patch({ levelUpEffects: v })} />
        <Toggle label="Combo effects" checked={s.comboEffects} onChange={(v) => patch({ comboEffects: v })} />
        <Toggle label="Motivational messages" checked={s.motivationalMessages} onChange={(v) => patch({ motivationalMessages: v })} />
        <Toggle label="Boss battles" checked={s.bossBattles} onChange={(v) => patch({ bossBattles: v })} />
        <Toggle label="Streak protection" checked={s.streakProtection} onChange={(v) => patch({ streakProtection: v })} />
        <Toggle label="Reduced motion" checked={s.reducedMotion} onChange={(v) => patch({ reducedMotion: v })} />
        <Toggle
          label="Reveal secret achievements"
          checked={s.revealSecretAchievements}
          onChange={(v) => patch({ revealSecretAchievements: v })}
        />
      </SystemFrame>

      <SystemFrame label="Notifications">
        <p className="mb-3 text-sm text-muted">
          Reminders fire in this browser when permission is granted. They never spam.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            const perm = await requestNotifyPermission();
            toast(perm === "granted" ? "Notifications allowed." : "Notifications were not allowed.");
          }}
        >
          Allow notifications
        </Button>
        <div className="mt-4 space-y-1">
          <Toggle label="Morning reminder" checked={s.morningReminder} onChange={(v) => patch({ morningReminder: v })} />
          <Toggle label="Habit reminders" checked={s.habitReminders} onChange={(v) => patch({ habitReminders: v })} />
          <Toggle label="Evening reminder" checked={s.eveningReminder} onChange={(v) => patch({ eveningReminder: v })} />
          <Toggle label="Streak reminders" checked={s.streakReminders} onChange={(v) => patch({ streakReminders: v })} />
          <Toggle label="Weekly review" checked={s.weeklyReviewNotifs} onChange={(v) => patch({ weeklyReviewNotifs: v })} />
        </div>
      </SystemFrame>

      <SystemFrame label="Install">
        <p className="text-sm text-muted">
          Install HIBI from your browser menu, or open the install guide from the preview chrome. Once
          dismissed, this notice stays quiet.
        </p>
        <Button className="mt-3" variant="secondary" onClick={() => patch({ installDismissed: true })}>
          Dismiss install hint
        </Button>
      </SystemFrame>

      <SystemFrame label="Data">
        <p className="text-sm text-muted">
          Your data is stored on this device. Export a backup regularly if you want protection against
          device or browser loss. HIBI does not sync to the cloud.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={download}>Export data</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </div>
        {pending ? (
          <div className="mt-4 rounded-md bg-surface p-3">
            <p className="text-sm">Import this backup?</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  const err = await importJson(pending, importMode);
                  if (err) toast(err);
                  else toast("Backup imported.");
                  setPending(null);
                }}
              >
                {importMode === "replace" ? "Replace" : "Merge"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setImportMode(importMode === "replace" ? "merge" : "replace")}>
                Mode: {importMode}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </SystemFrame>

      <SystemFrame label="Danger">
        <Button variant="danger" onClick={() => void resetProgress()}>
          Reset progress
        </Button>
        <p className="mt-4 text-sm text-muted">Erase all data. Type DELETE to confirm.</p>
        <Input className="mt-2" value={wipe} onChange={(e) => setWipe(e.target.value)} placeholder="DELETE" />
        <Button
          className="mt-3"
          variant="danger"
          disabled={wipe !== "DELETE"}
          onClick={async () => {
            await eraseAll();
            window.location.href = "/";
          }}
        >
          Erase all data
        </Button>
      </SystemFrame>

      <SystemFrame label="About HIBI">
        <p className="text-sm text-muted">
          HIBI is a local-first personal progression system. Version 1.0. Privacy: progression stays on
          this device unless you export it.
        </p>
      </SystemFrame>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex h-12 items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
