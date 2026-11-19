"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  { src: "/music/1 Levantine Mirage.mp3", title: "Levantine Mirage" },
  { src: "/music/2 Ancient Sands & Emerald Isles.mp3", title: "Ancient Sands & Emerald Isles" },
  { src: "/music/3 Levantine Mystic Fantasy.mp3", title: "Levantine Mystic Fantasy" },
  { src: "/music/4 Ancient Sands & Harps.mp3", title: "Ancient Sands & Harps" },
];

const MUTE_STORAGE_KEY = "quantum-music-muted";
const emptySubscribe = () => () => {};

/* ─── Module-level singleton ──────────────────────────────────────────────
   The Audio object lives OUTSIDE React so it survives component
   unmount / remount cycles that happen during Next.js page navigation.   */

let _audio: HTMLAudioElement | null = null;
let _trackIndex = -1;
let _started = false;
let _userMuted = false;

function readStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // ignore storage errors
  }
}

export function pauseAmbientMusic() {
  if (_audio && !_audio.paused) {
    _audio.pause();
  }
}

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.volume = 0.3;
    _audio.preload = "none";

    _trackIndex = Math.floor(Math.random() * TRACKS.length);
    _audio.src = TRACKS[_trackIndex].src;

    // Cycle to next track when one ends
    _audio.addEventListener("ended", () => {
      _trackIndex = (_trackIndex + 1) % TRACKS.length;
      if (_audio) {
        _audio.src = TRACKS[_trackIndex].src;
        _audio.play().catch(() => {});
      }
    });
  }
  return _audio;
}

export function MusicToggle() {
  const pathname = usePathname();
  const isBuilderEditor = Boolean(pathname?.includes("/website-builder/editor"));
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string>("");

  /* Sync UI state with the singleton audio state on mount */
  useEffect(() => {
    if (isBuilderEditor) {
      pauseAmbientMusic();
      return;
    }

    _userMuted = readStoredMuted();

    const audio = getAudio();

    if (_started && !_userMuted && !audio.paused) {
      return;
    }

    if (_userMuted) {
      return;
    }

    const startMusic = () => {
      if (_started || _userMuted || window.location.pathname.includes("/website-builder/editor")) return;
      audio.play().then(() => {
        _started = true;
        setIsPlaying(true);
        if (_trackIndex >= 0 && TRACKS[_trackIndex]) {
          setTrackTitle(TRACKS[_trackIndex].title);
        }
        cleanup();
      }).catch(() => {
        // Browser blocked autoplay before user gesture
      });
    };

    const cleanup = () => {
      document.removeEventListener("click", startMusic, true);
      document.removeEventListener("keydown", startMusic, true);
    };

    document.addEventListener("click", startMusic, { capture: true, once: true, passive: true });
    document.addEventListener("keydown", startMusic, { capture: true, once: true, passive: true });

    return () => {
      cleanup();
    };
  }, [isBuilderEditor]);

  // ─── Manual toggle via button ───
  const toggleMusic = useCallback(() => {
    const audio = getAudio();

    if (isPlaying) {
      audio.pause();
      _userMuted = true;
      writeStoredMuted(true);
      setIsPlaying(false);
    } else {
      _userMuted = false;
      writeStoredMuted(false);
      audio.play().then(() => {
        _started = true;
        setIsPlaying(true);
        if (_trackIndex >= 0 && TRACKS[_trackIndex]) {
          setTrackTitle(TRACKS[_trackIndex].title);
        }
      }).catch(() => {});
    }
  }, [isPlaying]);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center opacity-50" />
    );
  }

  const tooltip = isPlaying
    ? `Playing: ${trackTitle || "Ambient Music"} — Click to mute`
    : trackTitle
      ? `Play ambient music (${trackTitle})`
      : "Play ambient music";

  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: -15 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleMusic}
      title={tooltip}
      className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-300 overflow-hidden cursor-pointer
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
