"use client";

import { useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  "/music/Ancient Sands & Emerald Isles.mp3",
  "/music/Levantine Mirage.mp3",
];

// Events that count as real "user gestures" for unlocking audio
const USER_GESTURE_EVENTS = [
  "click",
  "mousedown",
  "pointerdown",
  "keydown",
  "touchstart",
  "touchmove",
  "touchend",
  "scroll",
] as const;

export function MusicToggle() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const triggeredRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Core play function — tries everything possible to start audio
  const tryStartPlayback = () => {
    if (triggeredRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Ensure audio source is set
    if (!audio.src || audio.src === window.location.href) {
      audio.src = TRACKS[trackIndexRef.current];
    }

    const doPlay = () => {
      audio.muted = false;
      audio.volume = 0.3;
      audio.play().then(() => {
        triggeredRef.current = true;
        setIsPlaying(true);
        // Stop the retry loop
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        // Remove all gesture listeners
        USER_GESTURE_EVENTS.forEach((evt) =>
          document.removeEventListener(evt, tryStartPlayback, true)
        );
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", tryStartPlayback);
      }).catch(() => {
        // Autoplay blocked — will retry on next opportunity
      });
    };

    if (audio.readyState >= 2) {
      doPlay();
    } else {
      audio.addEventListener("canplaythrough", doPlay, { once: true });
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      tryStartPlayback();
    }
  };

  // Initialize audio and attempt immediate playback
  useEffect(() => {
    setMounted(true);

    const audio = new Audio();
    audio.volume = 0.3;
    audio.preload = "auto";
    audio.loop = false;
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

    // === STRATEGY 1: Try playing immediately ===
    // Some browsers allow autoplay if the user has previously
    // interacted with the site or has it whitelisted
    setTimeout(() => tryStartPlayback(), 100);

    // === STRATEGY 2: Retry periodically ===
    // Some browsers unlock audio after the page is "settled"
    retryTimerRef.current = setInterval(() => {
      if (triggeredRef.current) {
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        return;
      }
      tryStartPlayback();
    }, 1500);

    // === STRATEGY 3: Listen for user gestures ===
    USER_GESTURE_EVENTS.forEach((evt) =>
      document.addEventListener(evt, tryStartPlayback, true)
    );

    // === STRATEGY 4: Tab focus / visibility changes ===
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", tryStartPlayback);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      USER_GESTURE_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, tryStartPlayback, true)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", tryStartPlayback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
