"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useKitsuneEnabled } from "@/lib/kitsuneState";

const emptySubscribe = () => () => {};

function KitsuneSpiritIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Fanned nine-tail aura plumes */}
      <path d="M5.2 18.5C3 16.5 2.4 13.5 3.6 10.8" opacity={active ? 0.85 : 0.45} />
      <path d="M18.8 18.5C21 16.5 21.6 13.5 20.4 10.8" opacity={active ? 0.85 : 0.45} />
      <path d="M7.5 20.2C5.2 19.6 3.9 18 3.6 15.8" opacity={active ? 0.7 : 0.35} />
      <path d="M16.5 20.2C18.8 19.6 20.1 18 20.4 15.8" opacity={active ? 0.7 : 0.35} />

      {/* Left & Right Fox Ears */}
      <path d="M6.4 10.6L5.5 4.2L10.2 7.5" />
      <path d="M17.6 10.6L18.5 4.2L13.8 7.5" />

      {/* Head & Cheek Fluff Contour */}
      <path d="M10.2 7.5C11.3 7.1 12.7 7.1 13.8 7.5" />
      <path d="M6.4 10.6C5.6 12.1 5.8 14 7.1 15.2L12 18.4L16.9 15.2C18.2 14 18.4 12.1 17.6 10.6" />

      {/* Forehead Azurite Crystal Gem */}
      <polygon
        points="12,8.4 13.1,9.9 12,11.4 10.9,9.9"
        fill={active ? "currentColor" : "none"}
        strokeWidth="1.2"
      />

      {/* Cute Fox Eyes & Nose */}
      <circle cx="9.4" cy="12.6" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="12.6" r="0.85" fill="currentColor" stroke="none" />
      <polygon points="12,15.6 11.2,14.6 12.8,14.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KitsuneToggle() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [enabled, toggle] = useKitsuneEnabled();

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center opacity-50" />
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1, rotate: enabled ? 8 : -8 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      title={enabled ? "Azurite Kitsune: Active (Click to hide)" : "Summon Azurite Kitsune"}
      aria-label={enabled ? "Hide 3D Azurite Kitsune companion" : "Show 3D Azurite Kitsune companion"}
      aria-pressed={enabled}
      className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-300 overflow-hidden cursor-pointer
        ${enabled
          ? "bg-gradient-to-br from-quantum/20 to-nebula/20 border border-quantum/50 text-quantum shadow-[0_0_16px_rgba(0,195,245,0.22)] hover:border-quantum/80"
          : "bg-foreground/5 dark:bg-cosmos-800 border border-foreground/15 dark:border-quantum/20 text-foreground/45 hover:border-foreground/30 hover:text-foreground/75"
        }
      `}
    >
      {enabled && (
        <motion.span
          className="absolute inset-0 rounded-full border border-nebula/35 pointer-events-none"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <KitsuneSpiritIcon active={enabled} />
    </motion.button>
  );
}
