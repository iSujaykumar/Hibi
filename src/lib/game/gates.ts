import type { RankId } from "../../types/hibi.ts";
import { RANK_ORDER } from "./progression.ts";

export type GateDef = {
  rank: RankId;
  name: string;
  titleId: string;
  title: string;
  blurb: string;
};

export const GATES: GateDef[] = [
  { rank: "E", name: "Threshold", titleId: "gate_e", title: "The Threshold", blurb: "The first door is open." },
  { rank: "D", name: "Outer Gate", titleId: "gate_d", title: "Gate Walker", blurb: "You can hold a protocol." },
  { rank: "C", name: "Inner Gate", titleId: "gate_c", title: "System Adept", blurb: "The board answers you." },
  { rank: "B", name: "High Gate", titleId: "gate_b", title: "Ranked Hunter", blurb: "Pressure is the path." },
  { rank: "A", name: "Red Gate", titleId: "gate_a", title: "High Hunter", blurb: "Few stay this far." },
  { rank: "S", name: "Sovereign Gate", titleId: "gate_s", title: "Sovereign", blurb: "The system recognizes you." },
  { rank: "SS", name: "Eternal Gate", titleId: "gate_ss", title: "Eternal", blurb: "A second life of discipline." },
  { rank: "SSS", name: "Origin Gate", titleId: "gate_sss", title: "Origin", blurb: "You write the protocol." },
  { rank: "EX", name: "Afterlight", titleId: "gate_ex", title: "Afterlight", blurb: "No ceiling. Only seasons." },
];

const SEASONS = ["Shadow", "Iron", "Aurora", "Void", "Ember", "Tide"] as const;

export function gateForRank(rank: RankId): GateDef {
  return GATES.find((g) => g.rank === rank) ?? GATES[0]!;
}

export function nextGate(rank: RankId): GateDef | null {
  const idx = RANK_ORDER.indexOf(rank);
  if (idx < 0 || idx >= GATES.length - 1) return null;
  return GATES[idx + 1] ?? null;
}

export function titlesUpToRank(rank: RankId): string[] {
  const idx = RANK_ORDER.indexOf(rank);
  return GATES.filter((_, i) => i <= Math.max(0, idx)).map((g) => g.titleId);
}

export function seasonForDate(date: string): { name: string; code: string } {
  const t = Date.parse(`${date}T12:00:00`);
  const week = Number.isFinite(t) ? Math.floor(t / (7 * 86_400_000)) : 0;
  const i = ((week % SEASONS.length) + SEASONS.length) % SEASONS.length;
  const name = SEASONS[i] ?? "Shadow";
  return { name: `${name} Season`, code: name.toLowerCase() };
}
