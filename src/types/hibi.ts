export type HabitType = "binary" | "numeric" | "duration" | "counter" | "negative";
export type Difficulty = "easy" | "normal" | "hard" | "elite";
export type Frequency = "daily" | "weekly" | "monthly";
export type QuestKind = "daily" | "weekly" | "mission" | "challenge" | "boss" | "side";
export type Priority = "low" | "medium" | "high" | "critical";
export type RankId = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS" | "EX";

// old saves used mage/assassin/ranger — migrate.ts maps them
export type Archetype =
  | "warrior"
  | "scholar"
  | "strategist"
  | "creator"
  | "guardian"
  | "seeker"
  | "adaptive";

export type LegacyArchetype = "mage" | "assassin" | "ranger";

// same deal: casual/normal/hard still show up in old blobs
export type PlayDifficulty =
  | "initiate"
  | "adventurer"
  | "elite"
  | "ascendant"
  | "casual"
  | "normal"
  | "hard";

export type CanonicalPlayDifficulty = "initiate" | "adventurer" | "elite" | "ascendant";

export type ExperienceLevel = "beginner" | "some" | "consistent" | "expert";
export type TimeAvailability = "low" | "medium" | "high";
export type ChallengePreference = "gentle" | "steady" | "push";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type ThemeId = "system" | "void" | "midnight" | "aurora" | "obsidian" | "light";
export type AvatarId =
  | "shadow"
  | "warrior"
  | "scholar"
  | "explorer"
  | "guardian"
  | "rogue"
  | "mage";

export type CategoryId =
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
  | "growth"
  | "home"
  | "social"
  | "custom";

export type StatKey =
  | "strength"
  | "willpower"
  | "energy"
  | "intelligence"
  | "focus"
  | "creativity"
  | "social"
  | "vitality"
  | "discipline"
  | "consistency";

export type PlayerStats = Record<StatKey, number>;

// vitality/discipline/consistency are legacy aliases, still stored
export const STAT_KEYS: StatKey[] = [
  "strength",
  "willpower",
  "energy",
  "intelligence",
  "focus",
  "creativity",
  "social",
];

export const LEGACY_STAT_KEYS: StatKey[] = ["vitality", "discipline", "consistency"];

export const ALL_STAT_KEYS: StatKey[] = [...STAT_KEYS, ...LEGACY_STAT_KEYS];

export const EMPTY_STATS: PlayerStats = {
  strength: 1,
  willpower: 1,
  energy: 1,
  intelligence: 1,
  focus: 1,
  creativity: 1,
  social: 1,
  vitality: 1,
  discipline: 1,
  consistency: 1,
};

export type Player = {
  id: string;
  name: string;
  level: number;
  xp: number;
  totalXp: number;
  rank: RankId;
  archetype: Archetype;
  playDifficulty: PlayDifficulty;
  focuses: CategoryId[];
  stats: PlayerStats;
  unspentStatPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  streakShields: number;
  pendingMissDate: string | null;
  equippedTitle: string | null;
  unlockedTitles: string[];
  avatar: AvatarId;
  avatarFrame: string;
  createdAt: string;
  updatedAt: string;
  lastActiveDate: string;
  onboarded: boolean;
  dayCount: number;
  lastDailyBonusDate: string | null;
  lastDailyReviewDate: string | null;
  lastWeeklyReviewDate: string | null;
  comboCount: number;
  comboDate: string | null;
  experienceLevel: ExperienceLevel;
  availableTime: TimeAvailability;
  challengePreference: ChallengePreference;
};

export type Habit = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: HabitType;
  kind: QuestKind;
  category: CategoryId;
  difficulty: Difficulty;
  frequency: Frequency;
  target: number;
  unit: string;
  xpReward: number;
  statRewards: Partial<PlayerStats>;
  priority: Priority;
  color: string;
  reminder: string | null;
  startDate: string;
  active: boolean;
  archived: boolean;
  negative: boolean;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
};

export type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  xpEarned: number;
  createdAt: string;
};

export type XpTransaction = {
  id: string;
  date: string;
  amount: number;
  source: string;
  habitId?: string;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  at: string;
  kind: "quest" | "level" | "rank" | "achievement" | "boss" | "bonus" | "system";
  title: string;
  detail: string;
};

export type UnlockedAchievement = {
  id: string;
  unlockedAt: string;
};

export type Boss = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  target: number;
  progress: number;
  category?: CategoryId;
  habitId?: string;
  xpReward: number;
  defeated: boolean;
  defeatedAt?: string;
  templateId?: string;
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  habitIds: string[];
  bonusXp: number;
};

export type AppSettings = {
  theme: ThemeId;
  reducedMotion: boolean;
  xpAnimations: boolean;
  questSounds: boolean;
  levelUpEffects: boolean;
  comboEffects: boolean;
  motivationalMessages: boolean;
  bossBattles: boolean;
  streakProtection: boolean;
  revealSecretAchievements: boolean;
  morningReminder: boolean;
  habitReminders: boolean;
  eveningReminder: boolean;
  streakReminders: boolean;
  weeklyReviewNotifs: boolean;
  morningHour: number;
  eveningHour: number;
  installDismissed: boolean;
};

export type DailyReview = {
  date: string;
  completed: number;
  total: number;
  xp: number;
  bestStat: StatKey | null;
  streak: number;
  rating: "S" | "A" | "B" | "C" | "D";
};

export const SCHEMA_VERSION = 2 as const;

export type GameState = {
  schemaVersion: number;
  player: Player;
  habits: Habit[];
  completions: HabitCompletion[];
  ledger: XpTransaction[];
  activity: ActivityEvent[];
  achievements: UnlockedAchievement[];
  bosses: Boss[];
  routines: Routine[];
  settings: AppSettings;
  lastReview: DailyReview | null;
};

export type EngineEvent =
  | { type: "already_complete"; habitId: string }
  | { type: "progress"; habitId: string; value: number; target: number }
  | {
      type: "quest_complete";
      habitId: string;
      name: string;
      xp: number;
      stats: Partial<PlayerStats>;
      combo: number;
    }
  | { type: "level_up"; from: number; to: number; statGains: Partial<PlayerStats> }
  | { type: "rank_up"; from: RankId; to: RankId }
  | { type: "achievement"; id: string; name: string; rarity: Rarity; xp: number }
  | { type: "daily_bonus"; xp: number }
  | { type: "routine_bonus"; name: string; xp: number }
  | { type: "boss_defeated"; name: string; xp: number }
  | { type: "title_unlocked"; id: string; name: string };

export const BACKUP_VERSION = 2 as const;

export type HibiBackup = {
  version: typeof BACKUP_VERSION | 1;
  exportedAt: string;
  state: GameState;
};
