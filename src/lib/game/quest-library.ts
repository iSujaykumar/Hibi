import type {
  Archetype,
  CategoryId,
  Difficulty,
  Frequency,
  Habit,
  HabitType,
  PlayerStats,
  QuestKind,
  StatKey,
} from "../../types/hibi.ts";
import { makeHabit } from "../habits.ts";
import { difficultyXpBase } from "./progression.ts";
import type { FocusId } from "./config.ts";

export type QuestTemplate = {
  id: string;
  focus: FocusId;
  archetypes: Archetype[];
  difficulty: Difficulty;
  kind: QuestKind;
  title: string;
  description: string;
  instruction: string;
  frequency: Frequency;
  type: HabitType;
  target: number;
  unit: string;
  xp: number;
  durationMin: number;
  statRewards: Partial<PlayerStats>;
  tags: string[];
  icon: string;
};

type Raw = {
  id: string;
  focus: FocusId;
  arch?: Archetype[];
  diff: Difficulty;
  kind: QuestKind;
  title: string;
  desc: string;
  how: string;
  freq?: Frequency;
  type?: HabitType;
  target?: number;
  unit?: string;
  xp?: number;
  mins?: number;
  stats: Partial<Record<StatKey, number>>;
  tags?: string[];
  icon?: string;
};

const KIND_ICON: Record<QuestKind, string> = {
  daily: "target",
  weekly: "calendar",
  mission: "flag",
  challenge: "swords",
  boss: "skull",
  side: "spark",
};

function inflate(raw: Raw): QuestTemplate {
  const kind = raw.kind;
  const frequency: Frequency = raw.freq ?? (kind === "weekly" ? "weekly" : "daily");
  const type = raw.type ?? (kind === "weekly" ? "counter" : "binary");
  const weeklyXp = { easy: 80, normal: 120, hard: 160, elite: 220 }[raw.diff];
  const xp =
    raw.xp ??
    (kind === "weekly"
      ? weeklyXp
      : kind === "side"
        ? Math.max(15, Math.round(difficultyXpBase(raw.diff) * 0.7))
        : difficultyXpBase(raw.diff));
  return {
    id: raw.id,
    focus: raw.focus,
    archetypes: raw.arch ?? [],
    difficulty: raw.diff,
    kind,
    title: raw.title,
    description: raw.desc,
    instruction: raw.how,
    frequency,
    type,
    target: raw.target ?? (kind === "weekly" ? 4 : 1),
    unit: raw.unit ?? (kind === "weekly" ? "days" : ""),
    xp,
    durationMin: raw.mins ?? (kind === "weekly" ? 0 : type === "duration" ? (raw.target ?? 10) : 8),
    statRewards: raw.stats,
    tags: raw.tags ?? [raw.focus, kind],
    icon: raw.icon ?? KIND_ICON[kind],
  };
}

const RAW: Raw[] = [
  // ── Fitness ──────────────────────────────────────────────
  { id: "fit-walk-10", focus: "fitness", arch: ["warrior", "guardian", "adaptive"], diff: "easy", kind: "daily", title: "Movement Initiation", desc: "A low-barrier walk to open the day.", how: "Walk for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { strength: 1, energy: 1 }, tags: ["walk", "movement"], icon: "footprints" },
  { id: "fit-activate", focus: "fitness", arch: ["warrior"], diff: "easy", kind: "daily", title: "Warrior's Activation", desc: "A short beginner session. No heroics.", how: "Complete a short beginner workout.", type: "duration", target: 12, unit: "min", mins: 12, stats: { strength: 1, willpower: 1 }, tags: ["workout"], icon: "dumbbell" },
  { id: "fit-hydrate", focus: "fitness", arch: ["guardian", "warrior"], diff: "easy", kind: "daily", title: "Hydration Protocol", desc: "Keep recovery resources topped up.", how: "Drink water regularly throughout the day.", type: "numeric", target: 1500, unit: "ml", mins: 2, stats: { energy: 1 }, tags: ["hydrate"], icon: "droplets" },
  { id: "fit-week-move", focus: "fitness", arch: ["warrior", "guardian", "strategist"], diff: "easy", kind: "weekly", title: "Consistency Trial", desc: "Four days of movement this week.", how: "Complete movement activity on 4 days this week.", target: 4, mins: 0, stats: { willpower: 2, strength: 1 }, tags: ["streak"], icon: "calendar" },
  { id: "fit-stretch", focus: "fitness", arch: ["guardian", "seeker"], diff: "easy", kind: "side", title: "Recovery Protocol", desc: "Optional mobility work.", how: "Complete a short stretching routine.", type: "duration", target: 8, unit: "min", mins: 8, stats: { energy: 1 }, tags: ["mobility"], icon: "stretch" },
  { id: "fit-walk-20", focus: "fitness", arch: ["warrior", "guardian"], diff: "normal", kind: "daily", title: "Field March", desc: "A real walk, not a stroll past the door.", how: "Walk for 20 minutes.", type: "duration", target: 20, unit: "min", mins: 20, stats: { strength: 1, energy: 1, willpower: 1 }, tags: ["walk"], icon: "footprints" },
  { id: "fit-session-25", focus: "fitness", arch: ["warrior"], diff: "normal", kind: "daily", title: "Training Block", desc: "A focused training session.", how: "Complete a 25-minute workout.", type: "duration", target: 25, unit: "min", mins: 25, stats: { strength: 2, willpower: 1 }, tags: ["workout"], icon: "dumbbell" },
  { id: "fit-week-5", focus: "fitness", arch: ["warrior", "strategist"], diff: "normal", kind: "weekly", title: "Five-Day Campaign", desc: "Train or move on 5 days.", how: "Complete training on 5 days this week.", target: 5, stats: { willpower: 2, strength: 1 }, tags: ["streak"] },
  { id: "fit-run-20", focus: "fitness", arch: ["warrior"], diff: "hard", kind: "daily", title: "Endurance Run", desc: "Cardio with intent.", how: "Run or cardio for 20 minutes.", type: "duration", target: 20, unit: "min", mins: 20, stats: { strength: 1, energy: 2 }, tags: ["run"], icon: "zap" },
  { id: "fit-strength-40", focus: "fitness", arch: ["warrior"], diff: "hard", kind: "daily", title: "Strength Trial", desc: "A demanding lift or bodyweight session.", how: "Complete a 40-minute strength session.", type: "duration", target: 40, unit: "min", mins: 40, stats: { strength: 2, willpower: 1 }, tags: ["workout"], icon: "dumbbell" },
  { id: "fit-elite-week", focus: "fitness", arch: ["warrior"], diff: "elite", kind: "weekly", title: "Iron Week", desc: "Six training days. Recovery still counts.", how: "Train on 6 days this week.", target: 6, stats: { strength: 2, willpower: 2 }, tags: ["streak"] },
  { id: "fit-pushups", focus: "fitness", arch: ["warrior", "adaptive"], diff: "normal", kind: "side", title: "Burst Protocol", desc: "A short strength burst.", how: "Complete 30 push-ups or an equivalent set.", type: "counter", target: 30, unit: "reps", mins: 6, stats: { strength: 1 }, tags: ["burst"], icon: "dumbbell" },

  // ── Health ───────────────────────────────────────────────
  { id: "hlt-water", focus: "health", arch: ["guardian", "warrior"], diff: "easy", kind: "daily", title: "Hydration Protocol", desc: "A simple wellness check-in.", how: "Hit a reasonable water target today.", type: "numeric", target: 1500, unit: "ml", mins: 2, stats: { energy: 1 }, tags: ["hydrate"], icon: "droplets" },
  { id: "hlt-meal", focus: "health", arch: ["guardian"], diff: "easy", kind: "daily", title: "Real Meal", desc: "Cook or choose one proper meal.", how: "Eat one balanced meal you prepared or chose on purpose.", type: "binary", mins: 20, stats: { energy: 1, willpower: 1 }, tags: ["nutrition"], icon: "apple" },
  { id: "hlt-walk", focus: "health", arch: ["guardian", "warrior"], diff: "easy", kind: "daily", title: "Daily Circulation", desc: "Light movement for general wellness.", how: "Move for 10 minutes — a walk is enough.", type: "duration", target: 10, unit: "min", mins: 10, stats: { energy: 1, strength: 1 }, tags: ["movement"], icon: "footprints" },
  { id: "hlt-week", focus: "health", arch: ["guardian", "strategist"], diff: "easy", kind: "weekly", title: "Wellness Week", desc: "Four days of a health routine.", how: "Complete your health routine on 4 days this week.", target: 4, stats: { energy: 2, willpower: 1 }, tags: ["streak"] },
  { id: "hlt-vitamins", focus: "health", arch: ["guardian"], diff: "easy", kind: "side", title: "Daily Check", desc: "A reminder, not a prescription.", how: "Take any regular supplement or medication you already use.", type: "binary", mins: 2, stats: { energy: 1, willpower: 1 }, tags: ["reminder"], icon: "heart" },
  { id: "hlt-meal-2", focus: "health", arch: ["guardian", "strategist"], diff: "normal", kind: "daily", title: "Kitchen Discipline", desc: "Two intentional meals.", how: "Eat two meals you chose with care.", type: "counter", target: 2, unit: "meals", mins: 30, stats: { energy: 1, willpower: 1 }, tags: ["nutrition"], icon: "apple" },
  { id: "hlt-outdoors", focus: "health", arch: ["seeker", "guardian"], diff: "normal", kind: "daily", title: "Fresh Air Trial", desc: "Get outside on purpose.", how: "Spend 15 minutes outdoors.", type: "duration", target: 15, unit: "min", mins: 15, stats: { energy: 1, social: 1 }, tags: ["outdoors"], icon: "sun" },
  { id: "hlt-week-5", focus: "health", arch: ["guardian"], diff: "normal", kind: "weekly", title: "Five-Day Recovery", desc: "Protect the routine five times.", how: "Complete your wellness routine on 5 days.", target: 5, stats: { energy: 2, willpower: 1 }, tags: ["streak"] },
  { id: "hlt-hard-cook", focus: "health", arch: ["guardian", "warrior"], diff: "hard", kind: "daily", title: "Provision Craft", desc: "Cook from real ingredients.", how: "Prepare a meal from whole ingredients.", type: "binary", mins: 40, stats: { energy: 1, willpower: 2 }, tags: ["nutrition"], icon: "apple" },

  // ── Study ────────────────────────────────────────────────
  { id: "stu-25", focus: "study", arch: ["scholar", "strategist", "seeker"], diff: "easy", kind: "daily", title: "Knowledge Session", desc: "A single focused block.", how: "Study for 25 minutes.", type: "duration", target: 25, unit: "min", mins: 25, stats: { intelligence: 1, focus: 1 }, tags: ["study"], icon: "graduation" },
  { id: "stu-recall", focus: "study", arch: ["scholar"], diff: "easy", kind: "daily", title: "Recall Trial", desc: "Close the loop on yesterday.", how: "Review yesterday's material for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { intelligence: 1, willpower: 1 }, tags: ["review"], icon: "book" },
  { id: "stu-read-10", focus: "study", arch: ["scholar", "seeker"], diff: "easy", kind: "daily", title: "Page One", desc: "Open the book. Stay with it.", how: "Read for 10 minutes with attention.", type: "duration", target: 10, unit: "min", mins: 10, stats: { intelligence: 1, focus: 1 }, tags: ["read"], icon: "book" },
  { id: "stu-week-5", focus: "study", arch: ["scholar", "strategist"], diff: "easy", kind: "weekly", title: "Scholar's Trial", desc: "Five study sessions this week.", how: "Complete 5 study sessions this week.", target: 5, stats: { intelligence: 2, willpower: 1 }, tags: ["streak"] },
  { id: "stu-notes", focus: "study", arch: ["scholar", "creator"], diff: "easy", kind: "side", title: "Knowledge Base", desc: "Optional organization.", how: "Organize your study notes for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { intelligence: 1, focus: 1 }, tags: ["organize"], icon: "list" },
  { id: "stu-45", focus: "study", arch: ["scholar"], diff: "normal", kind: "daily", title: "Deep Study", desc: "A real session, not a skim.", how: "Study for 45 minutes.", type: "duration", target: 45, unit: "min", mins: 45, stats: { intelligence: 2, focus: 1, willpower: 1 }, tags: ["study"], icon: "graduation" },
  { id: "stu-pages", focus: "study", arch: ["scholar", "seeker"], diff: "normal", kind: "daily", title: "Chapter Advance", desc: "Pages with intent.", how: "Read 20 pages.", type: "numeric", target: 20, unit: "pages", mins: 30, stats: { intelligence: 2, focus: 1 }, tags: ["read"], icon: "book" },
  { id: "stu-week-6", focus: "study", arch: ["scholar"], diff: "normal", kind: "weekly", title: "Curriculum Week", desc: "Six sessions.", how: "Complete 6 study sessions this week.", target: 6, stats: { intelligence: 2, willpower: 1 }, tags: ["streak"] },
  { id: "stu-90", focus: "study", arch: ["scholar", "strategist"], diff: "hard", kind: "daily", title: "Archive Dive", desc: "A long, protected block.", how: "Study for 90 minutes with the phone away.", type: "duration", target: 90, unit: "min", mins: 90, stats: { intelligence: 2, focus: 2, willpower: 1 }, tags: ["study"], icon: "graduation" },
  { id: "stu-practice", focus: "study", arch: ["scholar", "warrior"], diff: "hard", kind: "daily", title: "Problem Set", desc: "Active practice beats rereading.", how: "Complete a practice set or exercises for 40 minutes.", type: "duration", target: 40, unit: "min", mins: 40, stats: { intelligence: 2, willpower: 1 }, tags: ["practice"], icon: "pen" },

  // ── Career ───────────────────────────────────────────────
  { id: "car-deep-25", focus: "career", arch: ["strategist", "scholar", "creator"], diff: "easy", kind: "daily", title: "Craft Block", desc: "Protected professional time.", how: "Do 25 minutes of focused career work.", type: "duration", target: 25, unit: "min", mins: 25, stats: { focus: 1, intelligence: 1 }, tags: ["deep-work"], icon: "target" },
  { id: "car-learn", focus: "career", arch: ["scholar", "strategist"], diff: "easy", kind: "daily", title: "Skill Intake", desc: "A small professional lesson.", how: "Study a career skill for 15 minutes.", type: "duration", target: 15, unit: "min", mins: 15, stats: { intelligence: 1, willpower: 1 }, tags: ["learn"], icon: "graduation" },
  { id: "car-inbox", focus: "career", arch: ["strategist"], diff: "easy", kind: "daily", title: "Signal Sweep", desc: "Triage, don't drown.", how: "Clear or triage your professional inbox once.", type: "binary", mins: 12, stats: { focus: 1, willpower: 1 }, tags: ["admin"], icon: "inbox" },
  { id: "car-week", focus: "career", arch: ["strategist", "scholar"], diff: "easy", kind: "weekly", title: "Professional Cadence", desc: "Four deep-work days.", how: "Complete a focused career block on 4 days this week.", target: 4, stats: { willpower: 2, focus: 1 }, tags: ["streak"] },
  { id: "car-network", focus: "career", arch: ["strategist", "creator"], diff: "easy", kind: "side", title: "One Reach-Out", desc: "Optional professional contact.", how: "Message one person in your field.", type: "binary", mins: 10, stats: { social: 1, willpower: 1 }, tags: ["network"], icon: "spark" },
  { id: "car-deep-50", focus: "career", arch: ["strategist", "warrior"], diff: "normal", kind: "daily", title: "Deep Work Raid", desc: "One uninterrupted block.", how: "Complete a 50-minute deep-work session.", type: "duration", target: 50, unit: "min", mins: 50, stats: { focus: 2, willpower: 1 }, tags: ["deep-work"], icon: "target" },
  { id: "car-portfolio", focus: "career", arch: ["creator", "scholar"], diff: "normal", kind: "daily", title: "Portfolio Chip", desc: "Ship a visible piece.", how: "Advance a portfolio or work artifact for 30 minutes.", type: "duration", target: 30, unit: "min", mins: 30, stats: { creativity: 1, intelligence: 1, focus: 1 }, tags: ["portfolio"], icon: "code" },
  { id: "car-week-5", focus: "career", arch: ["strategist"], diff: "normal", kind: "weekly", title: "Five-Block Week", desc: "Five professional sessions.", how: "Complete 5 focused career sessions this week.", target: 5, stats: { focus: 2, willpower: 1 }, tags: ["streak"] },
  { id: "car-hard", focus: "career", arch: ["strategist", "warrior"], diff: "hard", kind: "daily", title: "Ship Window", desc: "A long, demanding block.", how: "Work 90 minutes on a high-leverage career task.", type: "duration", target: 90, unit: "min", mins: 90, stats: { focus: 2, intelligence: 1, willpower: 1 }, tags: ["deep-work"], icon: "target" },

  // ── Productivity ─────────────────────────────────────────
  { id: "prd-plan", focus: "productivity", arch: ["strategist", "warrior", "scholar"], diff: "easy", kind: "daily", title: "Dawn Briefing", desc: "Write tomorrow's (or today's) top three.", how: "Write the three most important tasks for the day.", type: "binary", mins: 8, stats: { focus: 1, willpower: 1 }, tags: ["plan"], icon: "list" },
  { id: "prd-one", focus: "productivity", arch: ["strategist", "warrior"], diff: "easy", kind: "daily", title: "First Strike", desc: "Finish one real task.", how: "Complete one meaningful task you planned.", type: "binary", mins: 20, stats: { willpower: 1, focus: 1 }, tags: ["done"], icon: "target" },
  { id: "prd-focus-25", focus: "productivity", arch: ["strategist", "scholar"], diff: "easy", kind: "daily", title: "Focus Gate", desc: "A single pomodoro.", how: "Do a 25-minute focus session.", type: "duration", target: 25, unit: "min", mins: 25, stats: { focus: 1, willpower: 1 }, tags: ["focus"], icon: "target" },
  { id: "prd-week", focus: "productivity", arch: ["strategist"], diff: "easy", kind: "weekly", title: "Clearance Week", desc: "Four days of planned work.", how: "Complete your planning-and-doing loop on 4 days.", target: 4, stats: { willpower: 2, focus: 1 }, tags: ["streak"] },
  { id: "prd-declutter", focus: "productivity", arch: ["strategist", "guardian"], diff: "easy", kind: "side", title: "Surface Reset", desc: "Optional environment work.", how: "Declutter your desk or workspace for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { focus: 1, willpower: 1 }, tags: ["space"], icon: "home" },
  { id: "prd-focus-50", focus: "productivity", arch: ["strategist", "warrior"], diff: "normal", kind: "daily", title: "Unbroken Hour", desc: "One long focus block.", how: "Complete a 50-minute uninterrupted session.", type: "duration", target: 50, unit: "min", mins: 50, stats: { focus: 2, willpower: 1 }, tags: ["focus"], icon: "target" },
  { id: "prd-three", focus: "productivity", arch: ["strategist"], diff: "normal", kind: "daily", title: "Triple Close", desc: "Three finished tasks.", how: "Complete three planned tasks.", type: "counter", target: 3, unit: "tasks", mins: 40, stats: { willpower: 2, focus: 1 }, tags: ["done"], icon: "list" },
  { id: "prd-week-5", focus: "productivity", arch: ["strategist"], diff: "normal", kind: "weekly", title: "Operations Week", desc: "Five productive days.", how: "Run your productivity loop on 5 days.", target: 5, stats: { willpower: 2, focus: 1 }, tags: ["streak"] },
  { id: "prd-hard", focus: "productivity", arch: ["strategist", "warrior"], diff: "hard", kind: "daily", title: "Deep Stack", desc: "Two protected blocks.", how: "Complete two 50-minute focus sessions.", type: "counter", target: 2, unit: "blocks", mins: 100, stats: { focus: 2, willpower: 2 }, tags: ["focus"], icon: "target" },
  { id: "prd-screens", focus: "productivity", arch: ["strategist", "seeker"], diff: "normal", kind: "side", title: "Noise Cut", desc: "A small digital boundary.", how: "Stay off social media during your focus block.", type: "negative", mins: 0, stats: { willpower: 2, focus: 1 }, tags: ["boundary"], icon: "shield" },

  // ── Finance ──────────────────────────────────────────────
  { id: "fin-log", focus: "finance", arch: ["strategist", "guardian"], diff: "easy", kind: "daily", title: "Ledger Check", desc: "Awareness first.", how: "Log today's expenses.", type: "binary", mins: 8, stats: { willpower: 1, focus: 1 }, tags: ["track"], icon: "list" },
  { id: "fin-pause", focus: "finance", arch: ["strategist", "guardian"], diff: "easy", kind: "daily", title: "Spend Gate", desc: "One pause before a purchase.", how: "Pause before any non-essential purchase today.", type: "binary", mins: 2, stats: { willpower: 1 }, tags: ["awareness"], icon: "shield" },
  { id: "fin-week", focus: "finance", arch: ["strategist"], diff: "easy", kind: "weekly", title: "Budget Review", desc: "Look at the week honestly.", how: "Review spending once this week.", target: 1, unit: "review", mins: 20, stats: { intelligence: 1, willpower: 1, focus: 1 }, tags: ["review"] },
  { id: "fin-save", focus: "finance", arch: ["strategist", "guardian"], diff: "easy", kind: "side", title: "Reserve Move", desc: "Optional transfer.", how: "Move a small amount to savings.", type: "binary", mins: 5, stats: { willpower: 1 }, tags: ["save"], icon: "spark" },
  { id: "fin-categorize", focus: "finance", arch: ["strategist"], diff: "normal", kind: "daily", title: "Clean Books", desc: "Categorize, don't just dump.", how: "Categorize today's transactions.", type: "binary", mins: 12, stats: { focus: 1, intelligence: 1 }, tags: ["track"], icon: "list" },
  { id: "fin-no-impulse", focus: "finance", arch: ["strategist", "warrior"], diff: "normal", kind: "daily", title: "Impulse Shield", desc: "A day without impulse buys.", how: "Make no unplanned purchases today.", type: "negative", mins: 0, stats: { willpower: 2 }, tags: ["boundary"], icon: "shield" },
  { id: "fin-week-plan", focus: "finance", arch: ["strategist"], diff: "normal", kind: "weekly", title: "Allocation Council", desc: "A proper weekly money review.", how: "Review budget and next week's plan.", target: 1, unit: "review", mins: 30, stats: { intelligence: 1, willpower: 1, focus: 1 }, tags: ["review"] },
  { id: "fin-hard", focus: "finance", arch: ["strategist"], diff: "hard", kind: "weekly", title: "Full Audit", desc: "A demanding look at the numbers.", how: "Reconcile accounts and update a budget this week.", target: 1, unit: "audit", mins: 45, stats: { intelligence: 2, willpower: 1, focus: 1 }, tags: ["review"] },

  // ── Creativity ───────────────────────────────────────────
  { id: "cre-15", focus: "creativity", arch: ["creator", "seeker"], diff: "easy", kind: "daily", title: "Make Something Small", desc: "Minutes on the craft.", how: "Create for 15 minutes.", type: "duration", target: 15, unit: "min", mins: 15, stats: { creativity: 1, focus: 1 }, tags: ["make"], icon: "pen" },
  { id: "cre-capture", focus: "creativity", arch: ["creator", "seeker"], diff: "easy", kind: "daily", title: "Field Notes", desc: "Catch one idea before it leaves.", how: "Write or sketch one idea.", type: "binary", mins: 8, stats: { creativity: 1 }, tags: ["capture"], icon: "pen" },
  { id: "cre-week", focus: "creativity", arch: ["creator"], diff: "easy", kind: "weekly", title: "Studio Week", desc: "Four making days.", how: "Create on 4 days this week.", target: 4, stats: { creativity: 2, willpower: 1 }, tags: ["streak"] },
  { id: "cre-tidy", focus: "creativity", arch: ["creator", "strategist"], diff: "easy", kind: "side", title: "Studio Reset", desc: "Optional space work.", how: "Set up or tidy your creative space for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { focus: 1, creativity: 1 }, tags: ["space"], icon: "home" },
  { id: "cre-30", focus: "creativity", arch: ["creator"], diff: "normal", kind: "daily", title: "Workshop Block", desc: "A real making session.", how: "Create for 30 minutes.", type: "duration", target: 30, unit: "min", mins: 30, stats: { creativity: 2, focus: 1 }, tags: ["make"], icon: "pen" },
  { id: "cre-ship", focus: "creativity", arch: ["creator", "warrior"], diff: "normal", kind: "daily", title: "Ship a Draft", desc: "Finish a small piece.", how: "Finish one small creative piece or draft.", type: "binary", mins: 35, stats: { creativity: 1, willpower: 1 }, tags: ["ship"], icon: "flag" },
  { id: "cre-week-5", focus: "creativity", arch: ["creator"], diff: "normal", kind: "weekly", title: "Five Sessions", desc: "A serious creative week.", how: "Create on 5 days this week.", target: 5, stats: { creativity: 2, willpower: 1 }, tags: ["streak"] },
  { id: "cre-hard", focus: "creativity", arch: ["creator"], diff: "hard", kind: "daily", title: "Long Studio", desc: "A demanding session.", how: "Create for 60 minutes on a single project.", type: "duration", target: 60, unit: "min", mins: 60, stats: { creativity: 2, focus: 1, willpower: 1 }, tags: ["make"], icon: "pen" },

  // ── Sleep ────────────────────────────────────────────────
  { id: "slp-bed", focus: "sleep", arch: ["guardian", "strategist"], diff: "easy", kind: "daily", title: "Lights-Out Gate", desc: "A consistent bedtime window.", how: "Get in bed at your planned time.", type: "binary", mins: 5, stats: { energy: 1, willpower: 1 }, tags: ["bedtime"], icon: "moon" },
  { id: "slp-wind", focus: "sleep", arch: ["guardian", "seeker"], diff: "easy", kind: "daily", title: "Wind-Down Protocol", desc: "A short evening landing.", how: "Follow a 15-minute wind-down routine.", type: "duration", target: 15, unit: "min", mins: 15, stats: { energy: 1, focus: 1 }, tags: ["wind-down"], icon: "moon" },
  { id: "slp-screens", focus: "sleep", arch: ["guardian", "strategist"], diff: "easy", kind: "daily", title: "Screen Dim", desc: "Reduce screens before bed.", how: "Stop recreational screens 30 minutes before bed.", type: "negative", mins: 0, stats: { willpower: 1, energy: 1 }, tags: ["screens"], icon: "shield" },
  { id: "slp-week", focus: "sleep", arch: ["guardian"], diff: "easy", kind: "weekly", title: "Rhythm Week", desc: "Four protected nights.", how: "Keep your sleep routine on 4 nights this week.", target: 4, stats: { energy: 2, willpower: 1 }, tags: ["streak"] },
  { id: "slp-wake", focus: "sleep", arch: ["guardian", "warrior"], diff: "easy", kind: "side", title: "Rise Check", desc: "Optional wake-time consistency.", how: "Wake at your planned time.", type: "binary", mins: 2, stats: { willpower: 1, energy: 1 }, tags: ["wake"], icon: "sunrise" },
  { id: "slp-same", focus: "sleep", arch: ["guardian", "strategist"], diff: "normal", kind: "daily", title: "Fixed Window", desc: "Same bed and wake window.", how: "Keep both bedtime and wake time today.", type: "binary", mins: 5, stats: { energy: 1, willpower: 2 }, tags: ["rhythm"], icon: "moon" },
  { id: "slp-week-5", focus: "sleep", arch: ["guardian"], diff: "normal", kind: "weekly", title: "Five-Night Guard", desc: "Five consistent nights.", how: "Keep the sleep routine on 5 nights.", target: 5, stats: { energy: 2, willpower: 1 }, tags: ["streak"] },
  { id: "slp-hard", focus: "sleep", arch: ["guardian", "warrior"], diff: "hard", kind: "daily", title: "Full Landing", desc: "A stricter evening protocol.", how: "Wind down 45 minutes, no late screens, planned bedtime.", type: "binary", mins: 45, stats: { energy: 2, willpower: 2 }, tags: ["wind-down"], icon: "moon" },

  // ── Mind ─────────────────────────────────────────────────
  { id: "mnd-breathe", focus: "mind", arch: ["seeker", "guardian"], diff: "easy", kind: "daily", title: "Still Point", desc: "A short sit.", how: "Sit quietly or meditate for 5 minutes.", type: "duration", target: 5, unit: "min", mins: 5, stats: { focus: 1, willpower: 1 }, tags: ["meditate"], icon: "spark" },
  { id: "mnd-journal", focus: "mind", arch: ["seeker", "scholar"], diff: "easy", kind: "daily", title: "Field Log", desc: "Capture the day in writing.", how: "Journal for a few minutes.", type: "binary", mins: 8, stats: { willpower: 1, intelligence: 1 }, tags: ["journal"], icon: "pen" },
  { id: "mnd-break", focus: "mind", arch: ["seeker", "strategist"], diff: "easy", kind: "daily", title: "Digital Recess", desc: "A planned break from the feed.", how: "Take a 10-minute break from screens.", type: "duration", target: 10, unit: "min", mins: 10, stats: { focus: 1, energy: 1 }, tags: ["break"], icon: "shield" },
  { id: "mnd-week", focus: "mind", arch: ["seeker", "guardian"], diff: "easy", kind: "weekly", title: "Inner Cadence", desc: "Four reflection days.", how: "Practice a mind routine on 4 days this week.", target: 4, stats: { willpower: 2, focus: 1 }, tags: ["streak"] },
  { id: "mnd-gratitude", focus: "mind", arch: ["seeker", "guardian"], diff: "easy", kind: "side", title: "Three True Things", desc: "Optional gratitude note.", how: "Name three things that went right.", type: "binary", mins: 4, stats: { willpower: 1, social: 1 }, tags: ["gratitude"], icon: "sun" },
  { id: "mnd-10", focus: "mind", arch: ["seeker"], diff: "normal", kind: "daily", title: "Longer Sit", desc: "Ten quiet minutes.", how: "Meditate or sit for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { focus: 2, willpower: 1 }, tags: ["meditate"], icon: "spark" },
  { id: "mnd-pages", focus: "mind", arch: ["seeker", "scholar"], diff: "normal", kind: "daily", title: "Morning Pages", desc: "A fuller journal.", how: "Write one full journal page.", type: "binary", mins: 15, stats: { intelligence: 1, willpower: 1, focus: 1 }, tags: ["journal"], icon: "pen" },
  { id: "mnd-week-5", focus: "mind", arch: ["seeker"], diff: "normal", kind: "weekly", title: "Five Sits", desc: "Five practice days.", how: "Complete a mind practice on 5 days.", target: 5, stats: { willpower: 2, focus: 1 }, tags: ["streak"] },
  { id: "mnd-hard", focus: "mind", arch: ["seeker", "warrior"], diff: "hard", kind: "daily", title: "Deep Quiet", desc: "A longer, protected sit.", how: "Meditate for 20 minutes.", type: "duration", target: 20, unit: "min", mins: 20, stats: { focus: 2, willpower: 2 }, tags: ["meditate"], icon: "spark" },

  // ── Relationships ────────────────────────────────────────
  { id: "rel-check", focus: "relationships", arch: ["guardian", "seeker"], diff: "easy", kind: "daily", title: "Check-In", desc: "One real contact.", how: "Check in with someone you care about.", type: "binary", mins: 8, stats: { social: 1, willpower: 1 }, tags: ["contact"], icon: "spark" },
  { id: "rel-thanks", focus: "relationships", arch: ["guardian", "creator"], diff: "easy", kind: "daily", title: "Thanks Note", desc: "Name the good.", how: "Send a short thank-you or kind message.", type: "binary", mins: 6, stats: { social: 1 }, tags: ["gratitude"], icon: "sun" },
  { id: "rel-week", focus: "relationships", arch: ["guardian"], diff: "easy", kind: "weekly", title: "Presence Week", desc: "Four social touchpoints.", how: "Have a real check-in on 4 days this week.", target: 4, stats: { social: 2, willpower: 1 }, tags: ["streak"] },
  { id: "rel-time", focus: "relationships", arch: ["guardian", "seeker"], diff: "easy", kind: "side", title: "Shared Hour", desc: "Optional quality time.", how: "Spend undistracted time with someone.", type: "duration", target: 20, unit: "min", mins: 20, stats: { social: 1, energy: 1 }, tags: ["time"], icon: "spark" },
  { id: "rel-listen", focus: "relationships", arch: ["guardian"], diff: "normal", kind: "daily", title: "Full Attention", desc: "A conversation without a phone.", how: "Have one phone-down conversation.", type: "binary", mins: 15, stats: { social: 1, focus: 1 }, tags: ["presence"], icon: "spark" },
  { id: "rel-week-plan", focus: "relationships", arch: ["guardian", "strategist"], diff: "normal", kind: "weekly", title: "One Real Plan", desc: "Schedule time, don't just intend it.", how: "Plan and keep one social commitment this week.", target: 1, unit: "plan", mins: 30, stats: { social: 2, willpower: 1 }, tags: ["plan"] },
  { id: "rel-hard", focus: "relationships", arch: ["guardian", "warrior"], diff: "hard", kind: "daily", title: "Show Up Fully", desc: "Quality time, protected.", how: "Spend 30 undistracted minutes with someone.", type: "duration", target: 30, unit: "min", mins: 30, stats: { social: 2, willpower: 1 }, tags: ["time"], icon: "spark" },

  // ── Growth ───────────────────────────────────────────────
  { id: "grw-read", focus: "growth", arch: ["seeker", "scholar"], diff: "easy", kind: "daily", title: "Page of Growth", desc: "A little intentional reading.", how: "Read something that develops you for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { intelligence: 1, willpower: 1 }, tags: ["read"], icon: "book" },
  { id: "grw-reflect", focus: "growth", arch: ["seeker"], diff: "easy", kind: "daily", title: "Evening Debrief", desc: "One honest look at the day.", how: "Write a short reflection on the day.", type: "binary", mins: 8, stats: { willpower: 1, intelligence: 1 }, tags: ["reflect"], icon: "pen" },
  { id: "grw-skill", focus: "growth", arch: ["scholar", "creator", "seeker"], diff: "easy", kind: "daily", title: "Skill Chip", desc: "A small practice block.", how: "Practice a personal skill for 15 minutes.", type: "duration", target: 15, unit: "min", mins: 15, stats: { intelligence: 1, focus: 1 }, tags: ["skill"], icon: "target" },
  { id: "grw-week", focus: "growth", arch: ["seeker", "scholar", "adaptive"], diff: "easy", kind: "weekly", title: "Growth Week", desc: "Four development days.", how: "Do a growth practice on 4 days this week.", target: 4, stats: { willpower: 2, intelligence: 1 }, tags: ["streak"] },
  { id: "grw-review", focus: "growth", arch: ["seeker", "strategist"], diff: "easy", kind: "side", title: "Course Correction", desc: "Optional weekly look-back.", how: "Review what you learned this week for 10 minutes.", type: "duration", target: 10, unit: "min", mins: 10, stats: { intelligence: 1, focus: 1 }, tags: ["review"], icon: "list" },
  { id: "grw-30", focus: "growth", arch: ["seeker", "scholar"], diff: "normal", kind: "daily", title: "Practice Block", desc: "A fuller development session.", how: "Practice or study for 30 minutes.", type: "duration", target: 30, unit: "min", mins: 30, stats: { intelligence: 1, focus: 1, willpower: 1 }, tags: ["skill"], icon: "target" },
  { id: "grw-week-5", focus: "growth", arch: ["seeker"], diff: "normal", kind: "weekly", title: "Five Practices", desc: "Five days of development.", how: "Complete a growth practice on 5 days.", target: 5, stats: { willpower: 2, intelligence: 1 }, tags: ["streak"] },
  { id: "grw-hard", focus: "growth", arch: ["seeker", "warrior"], diff: "hard", kind: "daily", title: "Deep Practice", desc: "A demanding self-directed block.", how: "Work on a personal skill for 50 minutes.", type: "duration", target: 50, unit: "min", mins: 50, stats: { intelligence: 2, focus: 1, willpower: 1 }, tags: ["skill"], icon: "target" },
];

export const QUEST_LIBRARY: QuestTemplate[] = RAW.map(inflate);

const BY_ID = new Map(QUEST_LIBRARY.map((t) => [t.id, t]));

export function templateById(id: string): QuestTemplate | undefined {
  return BY_ID.get(id);
}

export function templatesForFocus(focus: CategoryId): QuestTemplate[] {
  return QUEST_LIBRARY.filter((t) => t.focus === focus);
}

export function habitFromTemplate(template: QuestTemplate, overrides: Partial<Habit> = {}): Habit {
  const kind = template.kind;
  const priority: Habit["priority"] =
    kind === "side" ? "low" : template.difficulty === "hard" || template.difficulty === "elite" ? "high" : "medium";
  return makeHabit({
    name: template.title,
    description: template.instruction,
    icon: template.icon,
    type: template.type,
    kind,
    category: template.focus,
    difficulty: template.difficulty,
    frequency: template.frequency,
    target: template.target,
    unit: template.unit,
    xpReward: template.xp,
    statRewards: template.statRewards,
    priority,
    templateId: template.id,
    ...overrides,
  });
}

export function libraryAsFormTemplates() {
  return QUEST_LIBRARY.filter((t) => t.kind === "daily").map((t) => ({
    name: t.title,
    description: t.instruction,
    icon: t.icon,
    type: t.type,
    category: t.focus as CategoryId,
    difficulty: t.difficulty,
    target: t.target,
    unit: t.unit,
    statRewards: t.statRewards,
    group: t.focus,
    kind: t.kind,
    frequency: t.frequency,
  }));
}
