import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HabitForm } from "@/features/habit-form";
import { Kicker } from "@/components/system/frame";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/_app/habits/new")({ component: NewHabitPage });

function NewHabitPage() {
  const navigate = useNavigate();
  const saveHabit = useAppStore((s) => s.saveHabit);
  return (
    <div className="space-y-5">
      <header>
        <Kicker>New quest</Kicker>
        <h1 className="font-display text-3xl">Create quest</h1>
      </header>
      <HabitForm
        onCancel={() => navigate({ to: "/quests" })}
        onSave={(habit) => {
          void saveHabit(habit).then(() => navigate({ to: "/quests" }));
        }}
      />
    </div>
  );
}
