import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayerHero } from "@/components/player/player-hero";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Select } from "@/components/ui/input";
import { Kicker, SystemFrame } from "@/components/system/frame";
import { titleName, TITLES } from "@/lib/game/achievements";
import { ARCHETYPE_META, AVATAR_BLURBS, AVATAR_LABELS, STAT_LABELS, playDifficultyLabel } from "@/lib/i18n/catalog";
import { FOCUS_CONFIG, isFocusId } from "@/lib/game/config";
import { PlayerAvatar } from "@/components/player/avatar";
import { ShareHunterCardButton } from "@/components/player/hunter-card";
import { useAppStore } from "@/store/app-store";
import type { AvatarId, StatKey } from "@/types/hibi";
import { STAT_KEYS } from "@/types/hibi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/profile")({ component: ProfilePage });

const AVATARS = Object.keys(AVATAR_LABELS) as AvatarId[];

function ProfilePage() {
  const state = useAppStore((s) => s.state);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const setTitle = useAppStore((s) => s.setTitle);
  const allocate = useAppStore((s) => s.allocate);
  if (!state) return null;
  const { player } = state;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <Kicker>Dossier</Kicker>
          <h1 className="font-display text-3xl">Profile</h1>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/settings">Settings</Link>
        </Button>
      </header>

      <PlayerHero player={player} />

      <SystemFrame label="Identity">
        <FieldLabel htmlFor="pname">Name</FieldLabel>
        <Input
          id="pname"
          className="mt-2"
          defaultValue={player.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== player.name) void updatePlayer({ name: v });
          }}
        />
        <p className="mt-3 text-xs text-muted">
          Joined {player.createdAt.slice(0, 10)} · {ARCHETYPE_META[player.archetype]?.name ?? player.archetype}
          {" · "}
          {isFocusId(player.focuses[0] ?? "") ? FOCUS_CONFIG[player.focuses[0] as keyof typeof FOCUS_CONFIG].name : player.focuses[0]}
          {" · "}
          {playDifficultyLabel(player.playDifficulty).name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {titleName(player.equippedTitle)} · {player.currentStreak} day streak · {state.achievements.length}{" "}
          achievements
        </p>
        <div className="mt-4">
          <ShareHunterCardButton player={player} />
        </div>
      </SystemFrame>

      <SystemFrame label="Avatar">
        <p className="mb-3 text-xs text-muted">
          Each form has a name and a role. This is a progression mark, not a mysterious letter.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AVATARS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => void setAvatar(id)}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-md px-3 py-2 text-left",
                player.avatar === id ? "bg-accent text-accent-fg" : "bg-surface text-fg",
              )}
              aria-label={AVATAR_LABELS[id]}
              aria-pressed={player.avatar === id}
            >
              <PlayerAvatar avatar={id} size="sm" />
              <span>
                <span className="block font-display text-sm">{AVATAR_LABELS[id]}</span>
                <span className={cn("block text-xs", player.avatar === id ? "text-accent-fg/75" : "text-muted")}>
                  {AVATAR_BLURBS[id]}
                </span>
              </span>
            </button>
          ))}
        </div>
      </SystemFrame>

      <SystemFrame label="Title">
        <Select value={player.equippedTitle ?? "beginner"} onChange={(e) => void setTitle(e.target.value)}>
          {TITLES.filter((t) => player.unlockedTitles.includes(t.id)).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </SystemFrame>

      {player.unspentStatPoints > 0 ? (
        <SystemFrame label={`Stat points available: ${player.unspentStatPoints}`}>
          <div className="grid grid-cols-2 gap-2">
            {STAT_KEYS.map((key: StatKey) => (
              <Button key={key} variant="secondary" onClick={() => void allocate(key)}>
                {STAT_LABELS[key]} · {player.stats[key]}
              </Button>
            ))}
          </div>
        </SystemFrame>
      ) : null}

      <SystemFrame label="System log">
        {state.activity.length === 0 ? (
          <p className="text-sm text-muted">No events yet.</p>
        ) : (
          <ul className="space-y-3">
            {state.activity.slice(0, 12).map((ev) => (
              <li key={ev.id} className="text-sm">
                <p className="text-fg">{ev.title}</p>
                <p className="text-xs text-muted">
                  {ev.detail} · {ev.at.slice(11, 16)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SystemFrame>
    </div>
  );
}
