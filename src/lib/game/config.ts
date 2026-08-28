import type {
  Archetype,
  AvatarId,
  CanonicalPlayDifficulty,
  CategoryId,
  ChallengePreference,
  Difficulty,
  ExperienceLevel,
  PlayDifficulty,
  StatKey,
  TimeAvailability,
} from "../../types/hibi.ts";

export type FocusId =
  | "fitness"
  | "health"
  | "study"
  | "career"
  | "productivity"
  | "finance"
  | "creativity"
  | "sleep"
  | "mind"
  | "relationships"
  | "growth";

export type FocusConfig = {
  id: FocusId;
  name: string;
  blurb: string;
  primaryStats: StatKey[];
  secondaryStats: StatKey[];
  recommendedArchetypes: Archetype[];
  adjacentFocuses: FocusId[];
  defaultDifficulty: CanonicalPlayDifficulty;
};

export type ArchetypeConfig = {
  id: Archetype;
  name: string;
  blurb: string;
  traits: string[];
  bestFor: FocusId[];
  startingStats: Partial<Record<StatKey, number>>;
  avatar: AvatarId;
};

export type DifficultyConfig = {
  id: CanonicalPlayDifficulty;
  name: string;
  blurb: string;
  questDifficulties: Difficulty[];
  xpMultiplier: number;
};

export const FOCUS_IDS: FocusId[] = [
  "fitness",
  "health",
  "study",
  "career",
  "productivity",
  "finance",
  "creativity",
  "sleep",
  "mind",
  "relationships",
  "growth",
];

export const ARCHETYPE_IDS: Archetype[] = [
  "warrior",
  "scholar",
  "strategist",
  "creator",
  "guardian",
  "seeker",
  "adaptive",
];

export const PLAY_DIFFICULTY_IDS: CanonicalPlayDifficulty[] = [
  "initiate",
  "adventurer",
  "elite",
  "ascendant",
];

export const STAT_ABBR: Record<StatKey, string> = {
  strength: "STR",
  willpower: "WIL",
  energy: "ENE",
  intelligence: "INT",
  focus: "FOC",
  creativity: "CRE",
  social: "SOC",
  vitality: "VIT",
  discipline: "DIS",
  consistency: "CON",
};

export const STAT_META: Record<
  StatKey,
  { name: string; abbr: string; blurb: string; visible: boolean }
> = {
  strength: {
    name: "Strength",
    abbr: "STR",
    blurb: "Physical and action-oriented progression. A game statistic, not a medical metric.",
    visible: true,
  },
  willpower: {
    name: "Willpower",
    abbr: "WIL",
    blurb: "Discipline, streaks, and finishing what you start.",
    visible: true,
  },
  energy: {
    name: "Energy",
    abbr: "ENE",
    blurb: "Recovery, sleep, and sustainable daily rhythm. A game statistic, not a health measurement.",
    visible: true,
  },
  intelligence: {
    name: "Intelligence",
    abbr: "INT",
    blurb: "Learning, study, and knowledge-building.",
    visible: true,
  },
  focus: {
    name: "Focus",
    abbr: "FOC",
    blurb: "Deep work, attention, and protected time.",
    visible: true,
  },
  creativity: {
    name: "Creativity",
    abbr: "CRE",
    blurb: "Making things: writing, design, music, projects.",
    visible: true,
  },
  social: {
    name: "Social",
    abbr: "SOC",
    blurb: "Relationships, check-ins, and showing up for people.",
    visible: true,
  },
  vitality: {
    name: "Vitality",
    abbr: "VIT",
    blurb: "Legacy attribute. Folded into Energy.",
    visible: false,
  },
  discipline: {
    name: "Discipline",
    abbr: "DIS",
    blurb: "Legacy attribute. Folded into Willpower.",
    visible: false,
  },
  consistency: {
    name: "Consistency",
    abbr: "CON",
    blurb: "Legacy attribute. Folded into Willpower.",
    visible: false,
  },
};

export const FOCUS_CONFIG: Record<FocusId, FocusConfig> = {
  fitness: {
    id: "fitness",
    name: "Fitness",
    blurb: "Build physical consistency, strength, and endurance.",
    primaryStats: ["strength", "willpower"],
    secondaryStats: ["energy"],
    recommendedArchetypes: ["warrior", "guardian", "strategist"],
    adjacentFocuses: ["health", "sleep"],
    defaultDifficulty: "initiate",
  },
  health: {
    id: "health",
    name: "Health",
    blurb: "Build sustainable wellness routines and recovery habits.",
    primaryStats: ["energy", "willpower"],
    secondaryStats: ["strength"],
    recommendedArchetypes: ["guardian", "warrior", "seeker"],
    adjacentFocuses: ["fitness", "sleep"],
    defaultDifficulty: "initiate",
  },
  study: {
    id: "study",
    name: "Study",
    blurb: "Build focus, learning consistency, and knowledge.",
    primaryStats: ["intelligence", "focus"],
    secondaryStats: ["willpower"],
    recommendedArchetypes: ["scholar", "strategist", "seeker"],
    adjacentFocuses: ["career", "growth"],
    defaultDifficulty: "initiate",
  },
  career: {
    id: "career",
    name: "Career",
    blurb: "Develop professional skills and consistent progress.",
    primaryStats: ["intelligence", "focus"],
    secondaryStats: ["willpower"],
    recommendedArchetypes: ["strategist", "scholar", "creator"],
    adjacentFocuses: ["productivity", "study"],
    defaultDifficulty: "adventurer",
  },
  productivity: {
    id: "productivity",
    name: "Productivity",
    blurb: "Plan, finish, and protect your attention.",
    primaryStats: ["focus", "willpower"],
    secondaryStats: ["intelligence"],
    recommendedArchetypes: ["strategist", "warrior", "scholar"],
    adjacentFocuses: ["career", "mind"],
    defaultDifficulty: "adventurer",
  },
  finance: {
    id: "finance",
    name: "Finance",
    blurb: "Track, save, and stay aware of where energy (and money) goes.",
    primaryStats: ["willpower", "focus"],
    secondaryStats: ["intelligence"],
    recommendedArchetypes: ["strategist", "guardian", "scholar"],
    adjacentFocuses: ["productivity", "growth"],
    defaultDifficulty: "initiate",
  },
  creativity: {
    id: "creativity",
    name: "Creativity",
    blurb: "Make things on a rhythm: write, draw, design, build.",
    primaryStats: ["creativity", "focus"],
    secondaryStats: ["willpower"],
    recommendedArchetypes: ["creator", "seeker", "scholar"],
    adjacentFocuses: ["growth", "career"],
    defaultDifficulty: "initiate",
  },
  sleep: {
    id: "sleep",
    name: "Sleep",
    blurb: "Protect a consistent wind-down, bedtime, and wake time.",
    primaryStats: ["energy", "willpower"],
    secondaryStats: ["focus"],
    recommendedArchetypes: ["guardian", "strategist", "seeker"],
    adjacentFocuses: ["health", "mind"],
    defaultDifficulty: "initiate",
  },
  mind: {
    id: "mind",
    name: "Mind",
    blurb: "Practice reflection, presence, and a quieter inner load.",
    primaryStats: ["willpower", "focus"],
    secondaryStats: ["energy"],
    recommendedArchetypes: ["seeker", "guardian", "scholar"],
    adjacentFocuses: ["sleep", "growth"],
    defaultDifficulty: "initiate",
  },
  relationships: {
    id: "relationships",
    name: "Relationships",
    blurb: "Show up for people: check in, spend time, practice gratitude.",
    primaryStats: ["social", "willpower"],
    secondaryStats: ["energy"],
    recommendedArchetypes: ["guardian", "seeker", "creator"],
    adjacentFocuses: ["mind", "growth"],
    defaultDifficulty: "initiate",
  },
  growth: {
    id: "growth",
    name: "Growth",
    blurb: "Balanced personal development across learning, reflection, and discipline.",
    primaryStats: ["willpower", "intelligence"],
    secondaryStats: ["focus"],
    recommendedArchetypes: ["seeker", "scholar", "adaptive"],
    adjacentFocuses: ["study", "mind"],
    defaultDifficulty: "initiate",
  },
};

export const ARCHETYPE_CONFIG: Record<Archetype, ArchetypeConfig> = {
  warrior: {
    id: "warrior",
    name: "The Warrior",
    blurb: "Action-oriented. Challenge-driven. Strong on streaks and showing up.",
    traits: ["Action", "Challenge", "Streaks"],
    bestFor: ["fitness", "productivity", "health"],
    startingStats: { strength: 3, willpower: 2, energy: 1 },
    avatar: "warrior",
  },
  scholar: {
    id: "scholar",
    name: "The Scholar",
    blurb: "Knowledge first. Focus sessions, learning streaks, skill progression.",
    traits: ["Learning", "Focus", "Depth"],
    bestFor: ["study", "career", "growth"],
    startingStats: { intelligence: 3, focus: 2, willpower: 1 },
    avatar: "scholar",
  },
  strategist: {
    id: "strategist",
    name: "The Strategist",
    blurb: "Plan, optimize, and manage resources. Efficiency over spectacle.",
    traits: ["Planning", "Efficiency", "Systems"],
    bestFor: ["productivity", "finance", "career"],
    startingStats: { focus: 3, willpower: 2, intelligence: 1 },
    avatar: "rogue",
  },
  creator: {
    id: "creator",
    name: "The Creator",
    blurb: "Ship the work. Creative streaks and finished projects.",
    traits: ["Making", "Projects", "Expression"],
    bestFor: ["creativity", "career", "growth"],
    startingStats: { creativity: 3, focus: 2, intelligence: 1 },
    avatar: "mage",
  },
  guardian: {
    id: "guardian",
    name: "The Guardian",
    blurb: "Stability and maintenance. Sustainable progress you can keep.",
    traits: ["Stability", "Care", "Rhythm"],
    bestFor: ["health", "relationships", "sleep"],
    startingStats: { energy: 3, willpower: 2, social: 1 },
    avatar: "guardian",
  },
  seeker: {
    id: "seeker",
    name: "The Seeker",
    blurb: "Exploration, reflection, and personal development.",
    traits: ["Curiosity", "Reflection", "Range"],
    bestFor: ["mind", "growth", "study"],
    startingStats: { willpower: 2, focus: 2, intelligence: 1 },
    avatar: "explorer",
  },
  adaptive: {
    id: "adaptive",
    name: "The Adaptive",
    blurb: "Balanced progression across stats. A flexible starting path.",
    traits: ["Balance", "Flexibility", "Range"],
    bestFor: ["growth", "productivity", "mind"],
    startingStats: { willpower: 2, focus: 1, energy: 1 },
    avatar: "shadow",
  },
};

export const DIFFICULTY_CONFIG: Record<CanonicalPlayDifficulty, DifficultyConfig> = {
  initiate: {
    id: "initiate",
    name: "Initiate",
    blurb: "Very low barrier. Designed to establish consistency.",
    questDifficulties: ["easy"],
    xpMultiplier: 1.2,
  },
  adventurer: {
    id: "adventurer",
    name: "Adventurer",
    blurb: "Moderate challenge. For people who already have some rhythm.",
    questDifficulties: ["easy", "normal"],
    xpMultiplier: 1,
  },
  elite: {
    id: "elite",
    name: "Elite",
    blurb: "More demanding. For experienced users who want a real load.",
    questDifficulties: ["normal", "hard"],
    xpMultiplier: 0.9,
  },
  ascendant: {
    id: "ascendant",
    name: "Ascendant",
    blurb: "Advanced challenge. Use carefully — sustainability still wins.",
    questDifficulties: ["hard", "elite"],
    xpMultiplier: 0.85,
  },
};

export const EXPERIENCE_OPTIONS: { id: ExperienceLevel; name: string; blurb: string }[] = [
  { id: "beginner", name: "Just starting", blurb: "Little or no current routine." },
  { id: "some", name: "Some practice", blurb: "I do this sometimes, not every day." },
  { id: "consistent", name: "Already consistent", blurb: "I have a rhythm I want to deepen." },
  { id: "expert", name: "Experienced", blurb: "I train or practice this seriously." },
];

export const TIME_OPTIONS: { id: TimeAvailability; name: string; blurb: string; minutes: string }[] = [
  { id: "low", name: "15 minutes", blurb: "A small daily window.", minutes: "10–20 min" },
  { id: "medium", name: "30 minutes", blurb: "A focused block most days.", minutes: "20–40 min" },
  { id: "high", name: "45+ minutes", blurb: "Room for a fuller session.", minutes: "35–60 min" },
];

export const CHALLENGE_OPTIONS: { id: ChallengePreference; name: string; blurb: string }[] = [
  { id: "gentle", name: "Ease in", blurb: "Protect consistency. Keep the load light." },
  { id: "steady", name: "Steady climb", blurb: "A balanced mix of easy and real work." },
  { id: "push", name: "Push me", blurb: "I want a demanding starting protocol." },
];

export const AVATAR_META: Record<AvatarId, { name: string; blurb: string }> = {
  shadow: { name: "Shadow", blurb: "Unmarked potential. A blank slate for any path." },
  warrior: { name: "Warrior", blurb: "Physical presence and direct action." },
  scholar: { name: "Scholar", blurb: "Study, memory, and quiet mastery." },
  explorer: { name: "Explorer", blurb: "Range, curiosity, and new ground." },
  guardian: { name: "Guardian", blurb: "Care, recovery, and holding the line." },
  rogue: { name: "Rogue", blurb: "Precision, planning, and efficient moves." },
  mage: { name: "Mage", blurb: "Making, synthesis, and creative force." },
};

export function canonicalArchetype(value: unknown): Archetype {
  switch (value) {
    case "mage":
      return "scholar";
    case "assassin":
      return "strategist";
    case "ranger":
      return "seeker";
    case "warrior":
    case "scholar":
    case "strategist":
    case "creator":
    case "guardian":
    case "seeker":
    case "adaptive":
      return value;
    default:
      return "adaptive";
  }
}

export function isFocusId(value: string): value is FocusId {
  return (FOCUS_IDS as string[]).includes(value);
}

export function recommendedArchetypes(focus: CategoryId): Archetype[] {
  if (!isFocusId(focus)) return ["adaptive", "seeker", "strategist"];
  return FOCUS_CONFIG[focus].recommendedArchetypes;
}

export function statsForFocus(focus: CategoryId): { primary: StatKey[]; secondary: StatKey[] } {
  if (!isFocusId(focus)) return { primary: ["willpower", "focus"], secondary: ["intelligence"] };
  const cfg = FOCUS_CONFIG[focus];
  return { primary: cfg.primaryStats, secondary: cfg.secondaryStats };
}

export function canonicalPlayDifficulty(play: PlayDifficulty): CanonicalPlayDifficulty {
  switch (play) {
    case "casual":
    case "initiate":
      return "initiate";
    case "hard":
    case "elite":
      return "elite";
    case "ascendant":
      return "ascendant";
    default:
      return "adventurer";
  }
}

export function resolvePlayDifficulty(opts: {
  experience: ExperienceLevel;
  availableTime: TimeAvailability;
  challenge: ChallengePreference;
}): CanonicalPlayDifficulty {
  const exp = { beginner: 0, some: 1, consistent: 2, expert: 3 }[opts.experience];
  const time = { low: 0, medium: 1, high: 2 }[opts.availableTime];
  const challenge = { gentle: 0, steady: 1, push: 2 }[opts.challenge];
  const score = exp + time + challenge;
  if (score <= 2) return "initiate";
  if (score <= 4) return "adventurer";
  if (score <= 6) return "elite";
  return "ascendant";
}

export function questLoadFor(opts: {
  difficulty: CanonicalPlayDifficulty;
  availableTime: TimeAvailability;
}): { daily: number; weekly: number; side: number } {
  const timeDaily = { low: 2, medium: 3, high: 4 }[opts.availableTime];
  const cap = { initiate: 3, adventurer: 4, elite: 4, ascendant: 4 }[opts.difficulty];
  const daily = Math.min(timeDaily, cap);
  const side = opts.availableTime === "low" || opts.difficulty === "initiate" ? 0 : 1;
  return { daily, weekly: 1, side };
}
