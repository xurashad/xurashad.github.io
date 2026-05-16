"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  "/music/1 Levantine Mirage.mp3",
  "/music/2 Ancient Sands & Emerald Isles.mp3",
  "/music/3 Levantine Mystic Fantasy.mp3",
  "/music/4 Ancient Sands & Harps.mp3",
];

/* ─── Module-level singleton ──────────────────────────────────────────────
   The Audio object lives OUTSIDE React so it survives component
   unmount / remount cycles that happen during Next.js page navigation.   */

let _audio: HTMLAudioElement | null = null;
let _trackIndex = -1;
let _started = false;
let _userMuted = false; // true when the user explicitly clicked mute

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.volume = 0.3;
    _audio.preload = "auto";

    _trackIndex = Math.floor(Math.random() * TRACKS.length);
    _audio.src = TRACKS[_trackIndex];
    _audio.load();

    // Cycle to next track when one ends
    _audio.addEventListener("ended", () => {
      _trackIndex = (_trackIndex + 1) % TRACKS.length;
      _audio!.src = TRACKS[_trackIndex];
      _audio!.play().catch(() => {});
    });
  }
  return _audio;
}

export function MusicToggle() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const listenersAttached = useRef(false);

  /* Sync UI state with the actual singleton audio state on mount */
  useEffect(() => {
    setMounted(true);
    const audio = getAudio();

    // If audio was already playing (component remounted), just sync the UI
    if (_started && !_userMuted && !audio.paused) {
      setIsPlaying(true);
      return;
    }

    // If user had previously muted, keep it muted
    if (_userMuted) {
      setIsPlaying(false);
      return;
    }

    // ─── Auto-start logic (only wire up once globally) ───
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    const startMusic = () => {
      if (_started || _userMuted) return;
      audio.play().then(() => {
        _started = true;
        setIsPlaying(true);
        cleanup();
      }).catch(() => {
        // Not allowed yet — leave listeners active to try again
      });
    };

    // Strategy 1: Try immediately
    startMusic();

    // Strategy 2: Every kind of user interaction
    const events = [
      "click", "mousedown", "pointerdown", "keydown",
      "touchstart", "touchend", "wheel",
    ];
    events.forEach((e) => document.addEventListener(e, startMusic, { capture: true, passive: true }));
    window.addEventListener("scroll", startMusic, { capture: true, passive: true });

    // Strategy 3: Periodic retry
    const retryId = setInterval(() => {
      if (_started) { clearInterval(retryId); return; }
      startMusic();
    }, 2000);

    function cleanup() {
      events.forEach((e) => document.removeEventListener(e, startMusic, true));
      window.removeEventListener("scroll", startMusic, true);
      clearInterval(retryId);
    }

    // NOTE: No cleanup return that pauses/destroys audio!
    // The audio singleton intentionally outlives the component.
    return () => {
      cleanup();
    };
  }, []);

  // ─── Manual toggle via button ───
  const toggleMusic = useCallback(() => {
    const audio = getAudio();

    if (isPlaying) {
      audio.pause();
      _userMuted = true;
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        _started = true;
        _userMuted = false;
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isPlaying]);

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
            <div className="flex items-end gap-[2px] h-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-[2.5px] rounded-full bg-current"
                  animate={{ height: ["4px", "14px", "6px", "12px", "4px"] }}
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
