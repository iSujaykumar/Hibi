import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/input";
import { HibiMark } from "@/components/brand/logo";
import { SystemFrame } from "@/components/system/frame";
import { PlayerAvatar, AvatarGlyph } from "@/components/player/avatar";
import { StatsGrid } from "@/components/player/stats-grid";
import {
  ARCHETYPE_META,
  AVATAR_BLURBS,
  AVATAR_LABELS,
  QUEST_KIND_LABELS,
  STAT_ABBR_LABELS,
} from "@/lib/i18n/catalog";
import { createPlayer } from "@/lib/game/defaults";
import { generateProtocol, swapTemplate } from "@/lib/game/protocol";
import { habitFromTemplate, type QuestTemplate } from "@/lib/game/quest-library";
import {
  ARCHETYPE_CONFIG,
  ARCHETYPE_IDS,
  CHALLENGE_OPTIONS,
  DIFFICULTY_CONFIG,
  EXPERIENCE_OPTIONS,
  FOCUS_CONFIG,
  FOCUS_IDS,
  PLAY_DIFFICULTY_IDS,
  TIME_OPTIONS,
  recommendedArchetypes,
  resolvePlayDifficulty,
  statsForFocus,
  type FocusId,
} from "@/lib/game/config";
import { makeHabit } from "@/lib/habits";
import { useAppStore } from "@/store/app-store";
import type {
  Archetype,
  AvatarId,
  CanonicalPlayDifficulty,
  ChallengePreference,
  ExperienceLevel,
  Habit,
  TimeAvailability,
} from "@/types/hibi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const DRAFT_KEY = "hibi.onboarding.v2";
const STEPS = 6;
const AVATARS: AvatarId[] = ["shadow", "warrior", "scholar", "explorer", "guardian", "rogue", "mage"];

type Draft = {
  step: number;
  name: string;
  focus: FocusId;
  archetype: Archetype;
  avatar: AvatarId;
  experience: ExperienceLevel;
  availableTime: TimeAvailability;
  challenge: ChallengePreference;
  playDifficulty: CanonicalPlayDifficulty;
  difficultyOverridden: boolean;
  customizing: boolean;
  excluded: string[];
  customName: string;
};

const DEFAULT_DRAFT: Draft = {
  step: 0,
  name: "",
  focus: "growth",
  archetype: "seeker",
  avatar: "explorer",
  experience: "some",
  availableTime: "medium",
  challenge: "steady",
  playDifficulty: "adventurer",
  difficultyOverridden: false,
  customizing: false,
  excluded: [],
  customName: "",
};

function loadDraft(): Draft {
  if (typeof sessionStorage === "undefined") return { ...DEFAULT_DRAFT };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...DEFAULT_DRAFT };
    return { ...DEFAULT_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return { ...DEFAULT_DRAFT };
  }
}

function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function Onboarding() {
  const navigate = useNavigate();
  const finish = useAppStore((s) => s.finishOnboarding);
  const onboarded = useAppStore((s) => s.state?.player.onboarded);
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (onboarded) navigate({ to: "/home" });
  }, [onboarded, navigate]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    window.history.replaceState({ hibiOnboardingStep: draft.step }, "");
    const onPop = (e: PopStateEvent) => {
      const s = e.state?.hibiOnboardingStep;
      if (typeof s === "number") {
        setDraft((d) => ({ ...d, step: Math.max(0, Math.min(STEPS - 1, s)), customizing: s < 5 ? false : d.customizing }));
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function patch(p: Partial<Draft>) {
    setDraft((d) => {
      const next = { ...d, ...p };
      if (!next.difficultyOverridden && (p.experience || p.availableTime || p.challenge)) {
        next.playDifficulty = resolvePlayDifficulty({
          experience: next.experience,
          availableTime: next.availableTime,
          challenge: next.challenge,
        });
      }
      return next;
    });
    setError(null);
  }

  function goTo(step: number, push = true) {
    const next = Math.max(0, Math.min(STEPS - 1, step));
    setDraft((d) => ({ ...d, step: next, customizing: next === 5 ? d.customizing : false }));
    if (push) window.history.pushState({ hibiOnboardingStep: next }, "");
  }

  const derivedDifficulty = resolvePlayDifficulty({
    experience: draft.experience,
    availableTime: draft.availableTime,
    challenge: draft.challenge,
  });
  const difficulty = draft.difficultyOverridden ? draft.playDifficulty : derivedDifficulty;

  const protocol = useMemo(
    () =>
      generateProtocol({
        focus: draft.focus,
        archetype: draft.archetype,
        difficulty,
        experience: draft.experience,
        availableTime: draft.availableTime,
        challengePreference: draft.challenge,
        seed: draft.name || "player",
      }),
    [draft.focus, draft.archetype, difficulty, draft.experience, draft.availableTime, draft.challenge, draft.name],
  );

  const [swaps, setSwaps] = useState<QuestTemplate[]>(() => protocol.templates);
  useEffect(() => {
    setSwaps(protocol.templates);
    setDraft((d) => ({ ...d, excluded: [] }));
  }, [protocol]);

  const visibleTemplates = swaps.filter((t) => !draft.excluded.includes(t.id));

  const previewPlayer = useMemo(
    () =>
      createPlayer({
        name: draft.name.trim() || "Player",
        focuses: [draft.focus],
        archetype: draft.archetype,
        playDifficulty: difficulty,
        avatar: draft.avatar,
        experienceLevel: draft.experience,
        availableTime: draft.availableTime,
        challengePreference: draft.challenge,
      }),
    [draft, difficulty],
  );

  async function beginProtocol() {
    if (busy) return;
    const name = draft.name.trim() || "Player";
    const selected = visibleTemplates.map((t) => habitFromTemplate(t));
    const extras: Habit[] = [];
    if (draft.customName.trim()) {
      extras.push(
        makeHabit({
          name: draft.customName.trim(),
          description: "Custom quest added during protocol setup.",
          category: draft.focus,
          difficulty: "easy",
          type: "binary",
          kind: "daily",
          statRewards: { willpower: 1 },
        }),
      );
    }
    if (selected.length === 0 && extras.length === 0) {
      setError("Keep at least one quest, or add a custom one.");
      return;
    }
    setBusy(true);
    try {
      const player = createPlayer({
        name,
        focuses: [draft.focus],
        archetype: draft.archetype,
        playDifficulty: difficulty,
        avatar: draft.avatar,
        experienceLevel: draft.experience,
        availableTime: draft.availableTime,
        challengePreference: draft.challenge,
        onboarded: true,
      });
      await finish(player, [...selected, ...extras]);
      clearDraft();
      navigate({ to: "/home" });
    } catch {
      setError("Could not start the protocol. Try again.");
      setBusy(false);
    }
  }

  const step = draft.step;
  const canContinue =
    step === 0
      ? draft.name.trim().length > 0
      : step === 1
        ? Boolean(draft.focus)
        : step === 2
          ? Boolean(draft.archetype)
          : true;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-8 pb-8">
      <div className="mb-6 flex items-center gap-3">
        <HibiMark className="size-8" />
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">
            Protocol {step + 1} / {STEPS}
          </p>
          <p className="text-xs text-subtle">Tell Hibi who you want to become.</p>
        </div>
      </div>

      <div className="flex-1">
        {step === 0 ? (
          <Panel title="System activation" kicker="Welcome">
            <p className="mb-5 text-sm text-muted">
              Hibi builds a starting path from your focus. You will not have to invent your first quest.
            </p>
            <FieldLabel htmlFor="name">Player name</FieldLabel>
            <Input
              id="name"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="mt-2"
              autoComplete="nickname"
              placeholder="Your name"
            />
          </Panel>
        ) : null}

        {step === 1 ? (
          <Panel title="Choose your focus" kicker="Path">
            <p className="mb-4 text-sm text-muted">This becomes the primary context for archetypes, stats, and quests.</p>
            <div className="grid gap-2">
              {FOCUS_IDS.map((id) => {
                const cfg = FOCUS_CONFIG[id];
                const selected = draft.focus === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      const rec = recommendedArchetypes(id)[0] ?? "adaptive";
                      patch({
                        focus: id,
                        archetype: rec,
                        avatar: ARCHETYPE_CONFIG[rec].avatar,
                      });
                    }}
                    className={cn(
                      "min-h-14 rounded-lg px-4 py-3 text-left",
                      selected ? "bg-accent text-accent-fg" : "bg-card text-fg",
                    )}
                  >
                    <p className="font-display tracking-[0.08em] uppercase">{cfg.name}</p>
                    <p className={cn("mt-1 text-sm", selected ? "text-accent-fg/80" : "text-muted")}>{cfg.blurb}</p>
                    <p className={cn("mt-2 text-[11px] tracking-[0.12em] uppercase", selected ? "text-accent-fg/70" : "text-subtle")}>
                      {cfg.primaryStats.map((s) => STAT_ABBR_LABELS[s]).join(" · ")}
                      {" · "}
                      {cfg.recommendedArchetypes.map((a) => ARCHETYPE_CONFIG[a].name.replace(/^The /, "")).join(" / ")}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>
        ) : null}

        {step === 2 ? (
          <Panel title="Choose your approach" kicker="Archetype">
            <p className="mb-4 text-sm text-muted">
              Because your focus is {FOCUS_CONFIG[draft.focus].name}, {ARCHETYPE_CONFIG[recommendedArchetypes(draft.focus)[0] ?? "adaptive"].name} is recommended. You can change it.
            </p>
            <div className="grid gap-2">
              {orderedArchetypes(draft.focus).map((id) => {
                const cfg = ARCHETYPE_CONFIG[id];
                const recommended = recommendedArchetypes(draft.focus).includes(id);
                const selected = draft.archetype === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => patch({ archetype: id, avatar: cfg.avatar })}
                    className={cn(
                      "min-h-14 rounded-lg px-4 py-3 text-left",
                      selected ? "bg-accent text-accent-fg" : "bg-card",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display">{cfg.name}</p>
                      {recommended ? (
                        <span className={cn("text-[10px] tracking-[0.16em] uppercase", selected ? "text-accent-fg/80" : "text-accent")}>
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className={cn("mt-1 text-sm", selected ? "text-accent-fg/80" : "text-muted")}>{cfg.blurb}</p>
                    <p className={cn("mt-1 text-xs", selected ? "text-accent-fg/70" : "text-subtle")}>
                      {cfg.traits.join(" · ")}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>
        ) : null}

        {step === 3 ? (
          <Panel title="Choose your challenge" kicker="Intensity">
            <p className="mb-4 text-sm text-muted">
              Hibi uses this to set a sustainable starting difficulty. You can override it.
            </p>
            <FieldLabel>Experience</FieldLabel>
            <OptionList
              value={draft.experience}
              onChange={(experience) => patch({ experience })}
              options={EXPERIENCE_OPTIONS}
            />
            <FieldLabel className="mt-5 block">Time available</FieldLabel>
            <OptionList
              value={draft.availableTime}
              onChange={(availableTime) => patch({ availableTime })}
              options={TIME_OPTIONS.map((o) => ({ id: o.id, name: o.name, blurb: o.blurb }))}
            />
            <FieldLabel className="mt-5 block">Desired challenge</FieldLabel>
            <OptionList
              value={draft.challenge}
              onChange={(challenge) => patch({ challenge })}
              options={CHALLENGE_OPTIONS}
            />
            <div className="mt-5">
              <FieldLabel>Starting difficulty</FieldLabel>
              <p className="mt-1 mb-2 text-xs text-subtle">
                Suggested: {DIFFICULTY_CONFIG[derivedDifficulty].name}. Change it if you want.
              </p>
              <div className="grid gap-2">
                {PLAY_DIFFICULTY_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={difficulty === id}
                    onClick={() => patch({ playDifficulty: id, difficultyOverridden: true })}
                    className={cn(
                      "min-h-12 rounded-lg px-4 py-3 text-left",
                      difficulty === id ? "bg-accent text-accent-fg" : "bg-card",
                    )}
                  >
                    <p className="font-display tracking-[0.12em] uppercase">{DIFFICULTY_CONFIG[id].name}</p>
                    <p className={cn("text-sm", difficulty === id ? "text-accent-fg/80" : "text-muted")}>
                      {DIFFICULTY_CONFIG[id].blurb}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        ) : null}

        {step === 4 ? (
          <Panel title="Character preview" kicker="Avatar">
            <SystemFrame label="Your path" className="mb-4">
              <dl className="space-y-2 text-sm">
                <Row k="Player" v={draft.name.trim() || "Player"} />
                <Row k="Focus" v={FOCUS_CONFIG[draft.focus].name} />
                <Row k="Archetype" v={ARCHETYPE_META[draft.archetype].name} />
                <Row k="Difficulty" v={DIFFICULTY_CONFIG[difficulty].name} />
                <Row k="Rank" v="E · Level 1" />
                <Row
                  k="Primary stats"
                  v={statsForFocus(draft.focus).primary.map((s) => STAT_ABBR_LABELS[s]).join(" · ")}
                />
              </dl>
            </SystemFrame>
            <p className="mb-3 text-sm text-muted">
              Your avatar is a progression mark, not a profile picture. Each form has a name — Warrior, Scholar, Explorer — not a mystery letter.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVATARS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={draft.avatar === id}
                  aria-label={AVATAR_LABELS[id]}
                  onClick={() => patch({ avatar: id })}
                  className={cn(
                    "flex min-h-16 items-center gap-3 rounded-lg px-3 py-3 text-left",
                    draft.avatar === id ? "bg-accent text-accent-fg" : "bg-card",
                  )}
                >
                  <AvatarGlyph avatar={id} />
                  <span>
                    <span className="block font-display text-sm">{AVATAR_LABELS[id]}</span>
                    <span className={cn("block text-xs", draft.avatar === id ? "text-accent-fg/75" : "text-muted")}>
                      {AVATAR_BLURBS[id]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-5">
              <StatsGrid player={previewPlayer} compact />
            </div>
          </Panel>
        ) : null}

        {step === 5 ? (
          <Panel title={draft.customizing ? "Customize protocol" : "Your protocol is ready"} kicker="Start">
            {!draft.customizing ? (
              <>
                <SystemFrame label="Your path" className="mb-4">
                  <dl className="space-y-2 text-sm">
                    <Row k="Focus" v={FOCUS_CONFIG[draft.focus].name} />
                    <Row k="Archetype" v={ARCHETYPE_META[draft.archetype].name} />
                    <Row k="Difficulty" v={DIFFICULTY_CONFIG[difficulty].name} />
                    <Row k="Starting quests" v={String(visibleTemplates.length)} />
                    <Row k="Weekly objective" v={String(visibleTemplates.filter((t) => t.kind === "weekly").length)} />
                    <Row
                      k="Daily effort"
                      v={`${protocol.estimatedMin.min}–${protocol.estimatedMin.max} min`}
                    />
                    <Row k="Daily XP" v={`~${protocol.dailyXp} XP`} />
                  </dl>
                </SystemFrame>
              </>
            ) : (
              <p className="mb-4 text-sm text-muted">
                Remove, replace, or add a custom quest. You are not locked into the recommended plan.
              </p>
            )}

            <ul className="space-y-2" aria-label="Starting quests">
              {visibleTemplates.map((t) => (
                <li key={t.id} className="rounded-lg bg-card px-4 py-3">
                  <p className="font-display text-[10px] tracking-[0.18em] text-accent uppercase">
                    {QUEST_KIND_LABELS[t.kind]} · +{t.xp} XP
                  </p>
                  <p className="mt-1 font-display text-base">{t.title}</p>
                  <p className="text-sm text-muted">{t.instruction}</p>
                  {draft.customizing ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const next = swapTemplate(t, {
                            focus: draft.focus,
                            archetype: draft.archetype,
                            difficulty,
                            experience: draft.experience,
                            availableTime: draft.availableTime,
                            challengePreference: draft.challenge,
                            seed: draft.name,
                          }, [...draft.excluded, ...swaps.map((s) => s.id)]);
                          setSwaps((list) => list.map((x) => (x.id === t.id ? next : x)));
                        }}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => patch({ excluded: [...draft.excluded, t.id] })}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            {!draft.customizing ? (
              <div className="mt-4 flex justify-center">
                <PlayerAvatar avatar={draft.avatar} size="md" labeled />
              </div>
            ) : null}

            {draft.customizing ? (
              <div className="mt-4">
                <FieldLabel htmlFor="custom">Create custom quest</FieldLabel>
                <Input
                  id="custom"
                  className="mt-2"
                  value={draft.customName}
                  onChange={(e) => patch({ customName: e.target.value })}
                  placeholder="Optional — name a quest of your own"
                />
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          </Panel>
        ) : null}
      </div>

      <div
        className="sticky bottom-0 mt-6 flex gap-3 bg-bg pt-3"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {step > 0 ? (
          <Button
            variant="secondary"
            onClick={() => {
              if (draft.customizing) {
                patch({ customizing: false });
                return;
              }
              window.history.back();
            }}
          >
            Back
          </Button>
        ) : null}
        {step < 5 ? (
          <Button className="flex-1" disabled={!canContinue} onClick={() => goTo(step + 1)}>
            Continue
          </Button>
        ) : (
          <>
            {!draft.customizing ? (
              <Button variant="secondary" onClick={() => patch({ customizing: true })}>
                Customize
              </Button>
            ) : null}
            <Button className="flex-1" disabled={busy} onClick={() => void beginProtocol()}>
              {busy ? "Initializing…" : "Begin protocol"}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

function orderedArchetypes(focus: FocusId): Archetype[] {
  const rec = recommendedArchetypes(focus);
  const rest = ARCHETYPE_IDS.filter((id) => !rec.includes(id));
  return [...rec, ...rest];
}

function Panel({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <SystemFrame>
      {kicker ? <p className="mb-2 font-display text-[11px] tracking-[0.22em] text-accent uppercase">{kicker}</p> : null}
      <h1 className="mb-5 font-display text-2xl">{title}</h1>
      {children}
    </SystemFrame>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right tabular-nums">{v}</dd>
    </div>
  );
}

function OptionList<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; name: string; blurb: string }[];
}) {
  return (
    <div className="mt-2 grid gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-12 rounded-lg px-4 py-3 text-left",
            value === o.id ? "bg-accent text-accent-fg" : "bg-card",
          )}
        >
          <p className="font-display">{o.name}</p>
          <p className={cn("text-sm", value === o.id ? "text-accent-fg/80" : "text-muted")}>{o.blurb}</p>
        </button>
      ))}
    </div>
  );
}
