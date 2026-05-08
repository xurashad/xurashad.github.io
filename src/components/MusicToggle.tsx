"use client";

import { useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  "/music/Ancient Sands & Emerald Isles.mp3",
  "/music/Levantine Mirage.mp3",
];

// These are the ONLY event types desktop browsers treat as "user gestures"
// that can unlock audio playback. `scroll` does NOT count.
const USER_GESTURE_EVENTS = [
  "click",
  "mousedown",
  "pointerdown",
  "keydown",
  "touchstart",
  "touchend",
] as const;

export function MusicToggle() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  // Use a ref for the "already triggered" flag so the event handler
  // closure always sees the latest value — no stale-state bugs.
  const triggeredRef = useRef(false);

  // Initialize audio element once
  useEffect(() => {
    setMounted(true);

    const audio = new Audio();
    audio.volume = 0.3;
    audio.preload = "auto";
    audioRef.current = audio;

    // Pick a random starting track
    trackIndexRef.current = Math.floor(Math.random() * TRACKS.length);
    audio.src = TRACKS[trackIndexRef.current];

    // When one track ends, advance to the next
    const handleEnded = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[trackIndexRef.current];
      audio.play().catch(() => {});
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Listen for the FIRST real user gesture to unlock & start playback
  useEffect(() => {
    if (!mounted) return;

    const tryPlay = () => {
      // Ref check — prevents double-firing and avoids stale closures
      if (triggeredRef.current) return;
      triggeredRef.current = true;

      // Tear down all listeners immediately
      USER_GESTURE_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, tryPlay, true)
      );

      const audio = audioRef.current;
      if (!audio) return;

      // The audio might still be loading; wait for it
      const attemptPlay = () => {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Browser still blocked — reset so the user can click the button
          triggeredRef.current = false;
        });
      };

      if (audio.readyState >= 2) {
        // HAVE_CURRENT_DATA or better — play now
        attemptPlay();
      } else {
        // Not loaded yet — wait, then play
        audio.addEventListener("canplaythrough", attemptPlay, { once: true });
        // Also try after a short delay as a fallback
        setTimeout(() => {
          if (audio.readyState >= 2) attemptPlay();
        }, 500);
      }
    };

    // Use capture: true so we fire before anything else can stopPropagation
    USER_GESTURE_EVENTS.forEach((evt) =>
      document.addEventListener(evt, tryPlay, true)
    );

    return () => {
      USER_GESTURE_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, tryPlay, true)
      );
    };
  }, [mounted]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        triggeredRef.current = true;
      }).catch(() => {});
    }
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center opacity-50" />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: -15 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleMusic}
      className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-300 overflow-hidden
        ${isPlaying
          ? "bg-quantum/15 border border-quantum/40 text-quantum hover:border-quantum/70"
          : "bg-cosmos-800 border border-foreground/15 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 dark:bg-cosmos-800 dark:border-quantum/20 dark:text-foreground/40 dark:hover:border-quantum/40"
        }
      `}
      aria-label={isPlaying ? "Mute music" : "Play music"}
    >
      {/* Animated sound wave ring when playing */}
      {isPlaying && (
        <motion.span
          className="absolute inset-0 rounded-full border border-quantum/30"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-[2px]"
          >
            {/* Animated equalizer bars */}
            <div className="flex items-end gap-[2px] h-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-[2.5px] rounded-full bg-current"
                  animate={{
                    height: ["4px", "14px", "6px", "12px", "4px"],
                  }}
                  transition={{
                    duration: 0.8 + i * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="muted"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <VolumeX size={16} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
