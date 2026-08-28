import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function GateBackdrop({ className, overlay = true }: { className?: string; overlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const reduced =
      document.documentElement.classList.contains("reduce-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOk(!reduced);
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    const node = videoRef.current;
    if (!node) return;
    node.muted = true;
    const play = node.play();
    if (play) play.catch(() => undefined);
  }, [motionOk]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-black", className)} aria-hidden>
      {motionOk ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src="/splash-gate.mp4"
          poster="/splash-gate.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : (
        <img src="/splash-gate.jpg" alt="" className="h-full w-full object-cover" />
      )}
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45" />
      ) : null}
    </div>
  );
}
