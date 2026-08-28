export const SYSTEM_MESSAGES = [
  "New day detected.",
  "Your next level is within reach.",
  "Small actions create powerful results.",
  "The system is watching your progress.",
  "Consistency compounds.",
  "One quest. Then another.",
  "Potential is unused power.",
  "Show up. The rest follows.",
  "Discipline is a trainable stat.",
  "Today is a clean slate.",
  "Strength is built in quiet repetitions.",
  "You do not need perfect. You need done.",
  "The gate opens for those who continue.",
  "Rest is part of the protocol.",
  "Focus is a choice you can practice.",
  "A missed quest is not a verdict.",
  "Recovery is available. Continue.",
  "The path is daily.",
  "Rank is earned slowly, then all at once.",
  "Keep the streak honest.",
  "Move your body. Clear your mind.",
  "Read. Write. Repeat.",
  "Protect the morning.",
  "Close the day on purpose.",
  "You are the protagonist of this system.",
];

export function messageForDate(dateId: string): string {
  let hash = 0;
  for (let i = 0; i < dateId.length; i += 1) hash = (hash * 31 + dateId.charCodeAt(i)) >>> 0;
  return SYSTEM_MESSAGES[hash % SYSTEM_MESSAGES.length] ?? SYSTEM_MESSAGES[0];
}

export const COPY = {
  brand: {
    name: "HIBI",
    tagline: "Every Day. Every Quest. Stronger You.",
    short: "Level Yourself. One Habit at a Time.",
    system: "Personal Progression System",
    line: "Every day is a new quest.",
  },
  nav: {
    home: "Home",
    quests: "Quests",
    progress: "Progress",
    achievements: "Achievements",
    profile: "Profile",
  },
  actions: {
    enter: "Enter System",
    continue: "Continue",
    complete: "Complete",
    createQuest: "Create Quest",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    archive: "Archive",
    restore: "Restore",
    export: "Export Data",
    import: "Import Data",
    recover: "Recover",
    allocate: "Allocate",
  },
} as const;
