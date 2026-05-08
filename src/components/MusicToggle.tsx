"use client";

import { useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  "/music/Ancient Sands & Emerald Isles.mp3",
  "/music/Levantine Mirage.mp3",
];

export function MusicToggle() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const startedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    // Create and EAGERLY preload the audio so it's ready
    // before any user gesture happens
    const audio = new Audio();
    audio.volume = 0.3;
    audio.preload = "auto";
    audioRef.current = audio;

    trackIndexRef.current = Math.floor(Math.random() * TRACKS.length);
    audio.src = TRACKS[trackIndexRef.current];
    // Force the browser to start downloading
    audio.load();

    // Cycle to next track when one ends
    const onEnded = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[trackIndexRef.current];
      audio.play().catch(() => {});
    };
    audio.addEventListener("ended", onEnded);

    // ─── The ONE handler that starts music ───
    // audio.play() MUST be called synchronously inside the gesture
    // handler — any deferral (setTimeout, await, canplaythrough)
    // causes the browser to revoke user activation.
    const startMusic = () => {
      if (startedRef.current) return;
      // Call play() immediately — the browser decides right now
      // whether the user activation is still valid.
      audio.play().then(() => {
        startedRef.current = true;
        setIsPlaying(true);
        cleanup();
      }).catch(() => {
        // Not allowed yet — leave listeners active to try again
      });
    };

    // ─── Strategy 1: Try immediately on page load ───
    // Works when the browser has previously whitelisted the site
    startMusic();

    // ─── Strategy 2: Every kind of user interaction ───
    // Desktop: click, mousedown, keydown, wheel (scroll)
    // Mobile:  touchstart, touchend, pointerdown
    const events = [
      "click",
      "mousedown",
      "pointerdown",
      "keydown",
      "touchstart",
      "touchend",
      "wheel",       // desktop scroll wheel — IS a user gesture
    ];

    events.forEach((e) => document.addEventListener(e, startMusic, { capture: true, passive: true }));

    // Also listen for scroll — mobile Safari sometimes allows play()
    // inside scroll handlers if a touchstart recently happened
    window.addEventListener("scroll", startMusic, { capture: true, passive: true });

    // ─── Strategy 3: Periodic retry ───
    const retryId = setInterval(() => {
      if (startedRef.current) { clearInterval(retryId); return; }
      startMusic();
    }, 2000);

    function cleanup() {
      events.forEach((e) => document.removeEventListener(e, startMusic, true));
      window.removeEventListener("scroll", startMusic, true);
      clearInterval(retryId);
    }

    return () => {
      cleanup();
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // ─── Manual toggle via button ───
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        startedRef.current = true;
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
