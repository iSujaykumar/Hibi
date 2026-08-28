import { useState } from "react";
import type { Player } from "@/types/hibi";
import { titleName } from "@/lib/game/achievements";
import { gateForRank, seasonForDate } from "@/lib/game/gates";
import { Button } from "@/components/ui/button";
import { localDateId } from "@/lib/game/dates";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderHunterCard(player: Player): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, width, height);
  const bg = await loadImage("/splash-gate.jpg");
  if (bg) {
    const scale = Math.max(width / bg.width, height / bg.height);
    const w = bg.width * scale;
    const h = bg.height * scale;
    ctx.drawImage(bg, (width - w) / 2, (height - h) / 2, w, h);
  }
  const fade = ctx.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, "rgba(7,8,12,0.35)");
  fade.addColorStop(0.45, "rgba(7,8,12,0.55)");
  fade.addColorStop(1, "rgba(7,8,12,0.92)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);

  const gate = gateForRank(player.rank);
  const season = seasonForDate(localDateId());

  ctx.fillStyle = "#7ec8d4";
  ctx.font = "600 28px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HIBI", width / 2, 120);

  ctx.fillStyle = "#e8eaef";
  ctx.font = "600 72px 'Space Grotesk', sans-serif";
  ctx.fillText(player.name.slice(0, 18), width / 2, 560);

  ctx.fillStyle = "#7ec8d4";
  ctx.font = "600 36px 'Space Grotesk', sans-serif";
  ctx.fillText(`RANK ${player.rank}  ·  LV ${player.level}`, width / 2, 640);

  ctx.fillStyle = "#8b919d";
  ctx.font = "500 28px Manrope, sans-serif";
  ctx.fillText(titleName(player.equippedTitle), width / 2, 710);
  ctx.fillText(`${gate.name}  ·  ${season.name}`, width / 2, 760);
  ctx.fillText(`${player.currentStreak} day streak`, width / 2, 820);

  ctx.fillStyle = "rgba(126,200,212,0.7)";
  ctx.font = "500 22px Manrope, sans-serif";
  ctx.fillText("Every day. Every quest. Stronger you.", width / 2, 1240);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export hunter card"));
    }, "image/png");
  });
}

export function ShareHunterCardButton({ player }: { player: Player }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    setBusy(true);
    setNote(null);
    try {
      const blob = await renderHunterCard(player);
      const file = new File([blob], `hibi-${player.name.replace(/\s+/g, "-")}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${player.name} · HIBI` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setNote("Card saved.");
      }
    } catch {
      setNote("Share cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button className="w-full" variant="secondary" onClick={() => void share()} disabled={busy}>
        {busy ? "Rendering card…" : "Share hunter card"}
      </Button>
      {note ? <p className="mt-2 text-center text-xs text-subtle">{note}</p> : null}
    </div>
  );
}
