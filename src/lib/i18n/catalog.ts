import type {
  Archetype,
  AvatarId,
  CategoryId,
  Difficulty,
  PlayDifficulty,
  Priority,
  QuestKind,
  RankId,
  Rarity,
  StatKey,
} from "@/types/hibi";
import {
  ARCHETYPE_CONFIG,
  AVATAR_META,
  DIFFICULTY_CONFIG,
  FOCUS_CONFIG,
  FOCUS_IDS,
  STAT_META,
  canonicalPlayDifficulty,
} from "@/lib/game/config";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  fitness: "Fitness",
  health: "Health",
  study: "Study",
  career: "Career",
  productivity: "Productivity",
  finance: "Finance",
  creativity: "Creativity",
  sleep: "Sleep",
  mind: "Mind",
  relationships: "Relationships",
  growth: "Growth",
  home: "Home",
  social: "Social",
  custom: "Custom",
};

export const STAT_LABELS: Record<StatKey, string> = {
  strength: "Strength",
  willpower: "Willpower",
  energy: "Energy",
  intelligence: "Intelligence",
  focus: "Focus",
  creativity: "Creativity",
  social: "Social",
  vitality: "Vitality",
  discipline: "Discipline",
  consistency: "Consistency",
};

export const STAT_ABBR_LABELS: Record<StatKey, string> = {
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

export const STAT_BLURBS: Record<StatKey, string> = Object.fromEntries(
  (Object.keys(STAT_META) as StatKey[]).map((k) => [k, STAT_META[k].blurb]),
) as Record<StatKey, string>;

export const ARCHETYPE_META: Record<Archetype, { name: string; blurb: string }> = {
  warrior: { name: ARCHETYPE_CONFIG.warrior.name, blurb: ARCHETYPE_CONFIG.warrior.blurb },
  scholar: { name: ARCHETYPE_CONFIG.scholar.name, blurb: ARCHETYPE_CONFIG.scholar.blurb },
  strategist: { name: ARCHETYPE_CONFIG.strategist.name, blurb: ARCHETYPE_CONFIG.strategist.blurb },
  creator: { name: ARCHETYPE_CONFIG.creator.name, blurb: ARCHETYPE_CONFIG.creator.blurb },
  guardian: { name: ARCHETYPE_CONFIG.guardian.name, blurb: ARCHETYPE_CONFIG.guardian.blurb },
  seeker: { name: ARCHETYPE_CONFIG.seeker.name, blurb: ARCHETYPE_CONFIG.seeker.blurb },
  adaptive: { name: ARCHETYPE_CONFIG.adaptive.name, blurb: ARCHETYPE_CONFIG.adaptive.blurb },
};

export const PLAY_DIFFICULTY: Record<
  "initiate" | "adventurer" | "elite" | "ascendant",
  { name: string; blurb: string }
> = {
  initiate: DIFFICULTY_CONFIG.initiate,
  adventurer: DIFFICULTY_CONFIG.adventurer,
  elite: DIFFICULTY_CONFIG.elite,
  ascendant: DIFFICULTY_CONFIG.ascendant,
};

export function playDifficultyLabel(play: PlayDifficulty): { name: string; blurb: string } {
  return PLAY_DIFFICULTY[canonicalPlayDifficulty(play)];
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  elite: "Elite",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const QUEST_KIND_LABELS: Record<QuestKind, string> = {
  daily: "Daily Quest",
  weekly: "Weekly Quest",
  mission: "Mission",
  challenge: "Challenge",
  boss: "Boss Quest",
  side: "Side Quest",
};

export const RANK_LABELS: Record<RankId, string> = {
  E: "Rank E",
  D: "Rank D",
  C: "Rank C",
  B: "Rank B",
  A: "Rank A",
  S: "Rank S",
  SS: "Rank SS",
  SSS: "Rank SSS",
  EX: "Rank EX",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

export const AVATAR_LABELS: Record<AvatarId, string> = {
  shadow: AVATAR_META.shadow.name,
  warrior: AVATAR_META.warrior.name,
  scholar: AVATAR_META.scholar.name,
  explorer: AVATAR_META.explorer.name,
  guardian: AVATAR_META.guardian.name,
  rogue: AVATAR_META.rogue.name,
  mage: AVATAR_META.mage.name,
};

export const AVATAR_BLURBS: Record<AvatarId, string> = {
  shadow: AVATAR_META.shadow.blurb,
  warrior: AVATAR_META.warrior.blurb,
  scholar: AVATAR_META.scholar.blurb,
  explorer: AVATAR_META.explorer.blurb,
  guardian: AVATAR_META.guardian.blurb,
  rogue: AVATAR_META.rogue.blurb,
  mage: AVATAR_META.mage.blurb,
};

export const FOCUS_OPTIONS: CategoryId[] = [...FOCUS_IDS];

export const FOCUS_BLURBS: Record<string, string> = Object.fromEntries(
  FOCUS_IDS.map((id) => [id, FOCUS_CONFIG[id].blurb]),
);
