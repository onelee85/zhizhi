"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { preload } from "react-dom";

type WishRedeemCelebrationProps = {
  open: boolean;
  soundEnabled: boolean;
  onClose: () => void;
};

const CELEBRATION_DURATION_MS = 2200;
const CELEBRATION_ART_PATH = "/effects/wish-redeem-celebration.webp";

export function WishRedeemCelebration({
  open,
  soundEnabled,
  onClose
}: WishRedeemCelebrationProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  preload(CELEBRATION_ART_PATH, { as: "image", fetchPriority: "high" });

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeTimer = window.setTimeout(onClose, CELEBRATION_DURATION_MS);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(closeTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !soundEnabled) {
      return;
    }

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const startAt = audioContext.currentTime + 0.02;
      const notes = [
        { frequency: 659.25, offset: 0 },
        { frequency: 783.99, offset: 0.18 },
        { frequency: 1046.5, offset: 0.36 }
      ];

      notes.forEach(({ frequency, offset }) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const noteStart = startAt + offset;
        const noteEnd = noteStart + 0.32;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd);
      });
    } catch {
      audioContextRef.current = null;
    }

    return () => {
      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close().catch(() => undefined);
      }
    };
  }, [open, soundEnabled]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="wish-redeem-celebration"
      aria-hidden="true"
      onClick={onClose}
    >
      <div className="wish-redeem-celebration__sparkles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div
        className="wish-redeem-celebration__stage"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="wish-redeem-celebration__glow" aria-hidden="true" />
        <Image
          className="wish-redeem-celebration__art"
          src={CELEBRATION_ART_PATH}
          alt=""
          width={340}
          height={340}
          priority
        />
      </div>
    </div>
  );
}
