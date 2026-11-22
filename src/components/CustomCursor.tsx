"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

type CursorMode = "default" | "interactive" | "text" | "kitsune-pet" | "kitsune-grab";

interface SparkParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rot: number;
  vRot: number;
  tone: "quantum" | "nebula" | "rose" | "ice";
}

interface RippleState {
  active: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  mode: CursorMode;
}

const PARTICLE_POOL_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const subscribeFinePointer = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
};

const getFinePointerSnapshot = () =>
  typeof window !== "undefined" ? window.matchMedia("(pointer: fine)").matches : false;

const getServerSnapshot = () => false;

function classifyPointerTarget(target: EventTarget | null, lockedGrab: boolean): CursorMode {
  if (lockedGrab) return "kitsune-grab";
  if (!(target instanceof Element)) return "default";

  const customEl = target.closest("[data-cursor]");
  if (customEl) {
    const tag = customEl.getAttribute("data-cursor");
    if (tag === "kitsune") {
      return customEl.getAttribute("data-kitsune-dragging") === "true" ? "kitsune-grab" : "kitsune-pet";
    }
    if (tag === "interactive") return "interactive";
  }

  if (
    target.closest(
      "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']), textarea, [contenteditable='true']"
    )
  ) {
    return "text";
  }

  if (
    target.closest(
      "a[href], button:not(:disabled), [role='button'], [role='link'], summary, label[for], select, [tabindex]:not([tabindex='-1'])"
    )
  ) {
    return "interactive";
  }

  return "default";
}

export function CustomCursor() {
  const pathname = usePathname();
  const isFinePointer = useSyncExternalStore(subscribeFinePointer, getFinePointerSnapshot, getServerSnapshot);
  const isExcluded = Boolean(
    pathname?.includes("/website-builder/editor") ||
      pathname?.includes("/wetex/editor"),
  );
  const active = isFinePointer && !isExcluded;

  const rootRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const pawTiltRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleInnerRef = useRef<HTMLDivElement>(null);
  const rippleOuterRef = useRef<HTMLDivElement>(null);
  const sparkRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!active) return;

    const root = rootRef.current;
    const tip = tipRef.current;
    const ring = ringRef.current;
    if (!root || !tip || !ring) return;

    const htmlEl = document.documentElement;
    htmlEl.classList.add("custom-cursor-ready");

    const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reducedMotionMq.matches;
    const onReduceChange = () => {
      reduceMotion = reducedMotionMq.matches;
    };
    reducedMotionMq.addEventListener("change", onReduceChange);

    // Pre-allocated zero-GC particle pool
    const sparks: SparkParticle[] = PARTICLE_POOL_INDICES.map(() => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      life: 0.45,
      size: 1,
      rot: 0,
      vRot: 0,
      tone: "quantum",
    }));
    let sparkCursor = 0;

    const ripple: RippleState = {
      active: false,
      x: 0,
      y: 0,
      age: 0,
      life: 0.48,
      mode: "default",
    };

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let lastMoveX = 0;
    let lastMoveTime = 0;
    let lastPetTrailAt = 0;
    let tiltDeg = 0;
    let isVisible = false;
    let isGrabbingKitsune = false;
    let currentMode: CursorMode = "default";
    let lastHoveredTarget: EventTarget | null = null;
    let rafId = 0;
    let lastFrameAt = performance.now();

    const spawnSpark = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      life: number,
      size: number,
      rot: number,
      vRot: number,
      tone: SparkParticle["tone"]
    ) => {
      const slot = sparks[sparkCursor];
      sparkCursor = (sparkCursor + 1) % sparks.length;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.vx = vx;
      slot.vy = vy;
      slot.age = 0;
      slot.life = life;
      slot.size = size;
      slot.rot = rot;
      slot.vRot = vRot;
      slot.tone = tone;
    };

    const startRaf = () => {
      if (rafId !== 0) return;
      lastFrameAt = performance.now();
      rafId = requestAnimationFrame(stepFrame);
    };

    const setMode = (nextMode: CursorMode) => {
      if (nextMode !== currentMode) {
        currentMode = nextMode;
        root.dataset.mode = nextMode;
        if (nextMode !== "kitsune-pet" && pawTiltRef.current) {
          tiltDeg = 0;
          pawTiltRef.current.style.transform = "rotate(0deg)";
        }
      }
    };

    const stepFrame = (now: number) => {
      const dt = Math.min((now - lastFrameAt) / 1000, 0.05);
      lastFrameAt = now;

      let keepRunning = false;

      // 1. Damped trailing aura ring (auto-sleeps when converged)
      if (reduceMotion) {
        ringX = targetX;
        ringY = targetY;
      } else {
        const spring = 1 - Math.exp(-dt * 18);
        ringX += (targetX - ringX) * spring;
        ringY += (targetY - ringY) * spring;
      }
      ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;

      if (Math.abs(targetX - ringX) > 0.15 || Math.abs(targetY - ringY) > 0.15) {
        keepRunning = true;
      } else {
        ringX = targetX;
        ringY = targetY;
        ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;
      }

      // 2. Smooth paw petting tilt decay
      if (pawTiltRef.current && Math.abs(tiltDeg) > 0.25) {
        tiltDeg *= Math.exp(-dt * 10);
        pawTiltRef.current.style.transform = `rotate(${tiltDeg.toFixed(1)}deg)`;
        keepRunning = true;
      }

      // 3. Mode-aware click shockwave / portal / spirit ripple
      const rInner = rippleInnerRef.current;
      const rOuter = rippleOuterRef.current;
      if (ripple.active && rInner && rOuter) {
        ripple.age += dt;
        const p = Math.min(1, ripple.age / ripple.life);
        if (p >= 1) {
          ripple.active = false;
          rInner.style.opacity = "0";
          rOuter.style.opacity = "0";
        } else {
          keepRunning = true;
          const easeOut = 1 - (1 - p) * (1 - p);
          const fade = Math.max(0, 1 - p);
          const maxScale =
            ripple.mode === "kitsune-pet"
              ? 1.55
              : ripple.mode === "interactive"
                ? 1.4
                : ripple.mode === "text"
                  ? 0.65
                  : 1.15;
          const innerScale = 0.25 + easeOut * maxScale;
          rInner.dataset.mode = ripple.mode;
          rInner.style.opacity = (fade * 0.85).toFixed(3);
          rInner.style.transform = `translate3d(${ripple.x.toFixed(1)}px, ${ripple.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${innerScale.toFixed(3)})`;

          if (ripple.mode === "interactive" || ripple.mode === "kitsune-pet") {
            const pOuter = Math.max(0, Math.min(1, (ripple.age - 0.04) / (ripple.life - 0.04)));
            const outerEase = 1 - (1 - pOuter) * (1 - pOuter);
            const outerFade = Math.max(0, 1 - pOuter) * 0.65;
            const outerScale = 0.3 + outerEase * (maxScale + 0.35);
            rOuter.dataset.mode = ripple.mode;
            rOuter.style.opacity = outerFade.toFixed(3);
            rOuter.style.transform = `translate3d(${ripple.x.toFixed(1)}px, ${ripple.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${outerScale.toFixed(3)})`;
          } else {
            rOuter.style.opacity = "0";
          }
        }
      }

      // 4. Pooled celestial sparks & petting spirit wisps
      for (let i = 0; i < sparks.length; i++) {
        const sp = sparks[i];
        const el = sparkRefs.current[i];
        if (!el) continue;
        if (!sp.active) continue;

        sp.age += dt;
        if (sp.age >= sp.life) {
          sp.active = false;
          el.style.opacity = "0";
          continue;
        }

        keepRunning = true;
        const p = sp.age / sp.life;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vx *= Math.exp(-dt * 4.2);
        sp.vy *= Math.exp(-dt * 3.4);
        sp.rot += sp.vRot * dt;

        const alpha = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8);
        const sScale = sp.size * (1 - p * 0.45);
        if (el.dataset.tone !== sp.tone) {
          el.dataset.tone = sp.tone;
        }
        el.style.opacity = alpha.toFixed(3);
        el.style.transform = `translate3d(${sp.x.toFixed(1)}px, ${sp.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${sp.rot.toFixed(1)}deg) scale(${sScale.toFixed(3)})`;
      }

      if (keepRunning) {
        rafId = requestAnimationFrame(stepFrame);
      } else {
        rafId = 0;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        if (isVisible) {
          isVisible = false;
          root.dataset.visible = "false";
        }
        return;
      }

      const x = e.clientX;
      const y = e.clientY;
      targetX = x;
      targetY = y;

      // Zero-latency primary tip placement
      tip.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (!isVisible) {
        isVisible = true;
        ringX = x;
        ringY = y;
        ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        root.dataset.visible = "true";
      }

      if (e.target !== lastHoveredTarget || currentMode === "kitsune-pet" || currentMode === "kitsune-grab" || isGrabbingKitsune) {
        lastHoveredTarget = e.target;
        const nextMode = classifyPointerTarget(e.target, isGrabbingKitsune);
        setMode(nextMode);
      }

      const now = performance.now();
      const dtMove = Math.max(0.008, (now - lastMoveTime) / 1000);
      const dx = x - lastMoveX;
      lastMoveX = x;
      lastMoveTime = now;

      if (currentMode === "kitsune-pet" && !reduceMotion) {
        const vx = dx / dtMove;
        tiltDeg = Math.max(-14, Math.min(14, vx * 0.025));
        if (pawTiltRef.current) {
          pawTiltRef.current.style.transform = `rotate(${tiltDeg.toFixed(1)}deg)`;
        }
        if (Math.abs(vx) > 45 && now - lastPetTrailAt > 58) {
          lastPetTrailAt = now;
          const jitterX = (((sparkCursor * 17) % 16) - 8) * 1.1;
          const tone: SparkParticle["tone"] = sparkCursor % 2 === 0 ? "rose" : "ice";
          spawnSpark(
            x + jitterX,
            y - 4,
            vx * 0.04,
            -38 - (sparkCursor % 3) * 10,
            0.55,
            0.85,
            (sparkCursor * 40) % 90,
            75,
            tone
          );
        }
      }

      startRaf();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      targetX = e.clientX;
      targetY = e.clientY;
      tip.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      const nextMode = classifyPointerTarget(e.target, false);
      setMode(nextMode);
      if (nextMode === "kitsune-pet" || nextMode === "kitsune-grab") {
        isGrabbingKitsune = true;
      }

      root.dataset.pressed = "true";

      if (reduceMotion) return;

      ripple.active = true;
      ripple.x = e.clientX;
      ripple.y = e.clientY;
      ripple.age = 0;
      ripple.mode = nextMode;
      ripple.life = nextMode === "kitsune-pet" ? 0.56 : nextMode === "interactive" ? 0.48 : 0.4;

      if (nextMode === "kitsune-pet" || nextMode === "kitsune-grab") {
        // 8-point rose & ice spirit starburst when clicking/petting Azurite
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + 0.25;
          const speed = 58 + (i % 2) * 26;
          spawnSpark(
            e.clientX,
            e.clientY,
            Math.cos(ang) * speed,
            Math.sin(ang) * speed - 18,
            0.56,
            i % 2 === 0 ? 1.05 : 0.8,
            i * 45,
            130,
            i % 2 === 0 ? "rose" : "ice"
          );
        }
      } else if (nextMode === "interactive") {
        // 6-spark Nebula-Quantum portal burst on links & buttons
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const speed = 64 + (i % 2) * 18;
          spawnSpark(
            e.clientX,
            e.clientY,
            Math.cos(ang) * speed,
            Math.sin(ang) * speed,
            0.44,
            0.92,
            i * 60,
            110,
            i % 2 === 0 ? "quantum" : "nebula"
          );
        }
      } else if (nextMode === "default") {
        // 4-point crisp Quantum star sparks on page clicks
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          spawnSpark(
            e.clientX,
            e.clientY,
            Math.cos(ang) * 52,
            Math.sin(ang) * 52,
            0.38,
            0.78,
            i * 90,
            95,
            i % 2 === 0 ? "quantum" : "nebula"
          );
        }
      }

      startRaf();
    };

    const onPointerUp = (e: PointerEvent) => {
      root.dataset.pressed = "false";
      if (isGrabbingKitsune) {
        isGrabbingKitsune = false;
        setMode(classifyPointerTarget(e.target, false));
      }
    };

    const onPointerLeaveDoc = () => {
      isVisible = false;
      isGrabbingKitsune = false;
      lastHoveredTarget = null;
      root.dataset.visible = "false";
      root.dataset.pressed = "false";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.addEventListener("mouseleave", onPointerLeaveDoc, { passive: true });
    window.addEventListener("blur", onPointerLeaveDoc, { passive: true });

    return () => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      htmlEl.classList.remove("custom-cursor-ready");
      reducedMotionMq.removeEventListener("change", onReduceChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("mouseleave", onPointerLeaveDoc);
      window.removeEventListener("blur", onPointerLeaveDoc);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-mode="default"
      data-pressed="false"
      data-visible="false"
      className="custom-cursor-root pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Click Ripples (Primary Shockwave & Secondary Portal/Spirit Ring) */}
      <div ref={rippleInnerRef} className="cc-ripple cc-ripple-inner" data-mode="default" />
      <div ref={rippleOuterRef} className="cc-ripple cc-ripple-outer" data-mode="default" />

      {/* Pre-allocated 10-Node Celestial Starlight & Spirit Particle Pool */}
      {PARTICLE_POOL_INDICES.map((idx) => (
        <span
          key={idx}
          ref={(el) => {
            sparkRefs.current[idx] = el;
          }}
          data-tone="quantum"
          className="cc-spark"
        >
          <svg viewBox="0 0 12 12" className="w-3 h-3 overflow-visible">
            <path d="M6 0 L7.3 4.7 L12 6 L7.3 7.3 L6 12 L4.7 7.3 L0 6 L4.7 4.7 Z" fill="currentColor" />
          </svg>
        </span>
      ))}

      {/* Damped Trailing Celestial / Spirit Halo Ring */}
      <div ref={ringRef} className="cc-ring-anchor">
        <div className="cc-ring-frame">
          <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="cc-grad-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--cursor-accent)" />
                <stop offset="55%" stopColor="var(--cursor-secondary)" />
                <stop offset="100%" stopColor="var(--cursor-accent)" />
              </linearGradient>
              <linearGradient id="cc-grad-spirit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            {/* Standard Celestial Orbit Track */}
            <g className="cc-ring-orbit">
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke="url(#cc-grad-ring)"
                strokeWidth="1.25"
                strokeDasharray="6 4 1.5 4"
                strokeLinecap="round"
                opacity="0.82"
              />
              <circle cx="24" cy="3" r="1.4" fill="var(--cursor-accent)" />
              <circle cx="24" cy="45" r="1.15" fill="var(--cursor-secondary)" />
              <circle cx="3" cy="24" r="1.15" fill="var(--cursor-accent)" opacity="0.7" />
              <circle cx="45" cy="24" r="1.15" fill="var(--cursor-secondary)" opacity="0.7" />
            </g>

            {/* Interactive Portal Secondary Counter-Ring */}
            <circle
              className="cc-ring-portal"
              cx="24"
              cy="24"
              r="14"
              fill="none"
              stroke="var(--cursor-secondary)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              strokeLinecap="round"
            />

            {/* Kitsune Spirit Affection Ring */}
            <g className="cc-ring-spirit">
              <circle
                cx="24"
                cy="24"
                r="19.5"
                fill="none"
                stroke="url(#cc-grad-spirit)"
                strokeWidth="1.6"
                strokeDasharray="10 4 2 4"
                strokeLinecap="round"
              />
              <circle
                cx="24"
                cy="24"
                r="15"
                fill="none"
                stroke="#f9a8d4"
                strokeWidth="0.9"
                opacity="0.55"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Zero-Latency Context-Morphing Pointer Tip */}
      <div ref={tipRef} className="cc-tip-anchor">
        {/* Layer A: Faceted Quantum-Celestial Crystal Spearhead (Default hotspot at (0,0)) */}
        <div className="cc-tip-layer cc-tip-arrow">
          <svg viewBox="0 0 26 26" className="w-[26px] h-[26px] overflow-visible">
            <defs>
              <linearGradient id="cc-grad-arrow" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="var(--cursor-core)" />
                <stop offset="52%" stopColor="var(--cursor-accent)" />
                <stop offset="100%" stopColor="var(--cursor-secondary)" />
              </linearGradient>
              <linearGradient id="cc-grad-arrow-facet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--cursor-core)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="var(--cursor-accent)" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* Outer crisp facet */}
            <path
              d="M2 2 L21 10.2 L12.8 13.2 L9.8 21.4 Z"
              fill="url(#cc-grad-arrow)"
              stroke="var(--cursor-stroke)"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            {/* Inner light facet bevel */}
            <path d="M2 2 L12.8 13.2 L9.8 21.4 Z" fill="url(#cc-grad-arrow-facet)" />
            {/* Center crest ridge */}
            <path d="M2 2 L12.8 13.2" stroke="var(--cursor-core)" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
            {/* Hotspot quantum star spark */}
            <circle cx="2.2" cy="2.2" r="1.45" fill="var(--cursor-accent)" />
          </svg>
        </div>

        {/* Layer A2: Precision Quantum Diamond Reticle (Hovering Links & Buttons) */}
        <div className="cc-tip-layer cc-tip-reticle">
          <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] overflow-visible">
            <path
              d="M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z"
              fill="var(--cursor-ring)"
              stroke="var(--cursor-accent)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M12 7 L17 12 L12 17 L7 12 Z"
              fill="var(--cursor-core)"
              stroke="var(--cursor-secondary)"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="1.6" fill="var(--cursor-accent)" />
          </svg>
        </div>

        {/* Layer B: Sculpted Magical Kitsune Paw-Heart Emblem (Petting / Dragging Azurite) */}
        <div className="cc-tip-layer cc-tip-paw">
          <div ref={pawTiltRef} className="cc-paw-tilt">
            <svg viewBox="0 0 30 30" className="w-[28px] h-[28px] overflow-visible">
              <defs>
                <linearGradient id="cc-grad-paw-pad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fdf4ff" />
                  <stop offset="45%" stopColor="#fbcfe8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="cc-grad-paw-bean" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {/* Soft spirit glow backing */}
              <circle cx="15" cy="16" r="11" fill="rgba(244, 114, 182, 0.16)" />
              {/* Toe beans (4 sculpted cat-fox digits) */}
              <ellipse
                cx="7.4"
                cy="12.2"
                rx="2.3"
                ry="3.1"
                transform="rotate(-22 7.4 12.2)"
                fill="url(#cc-grad-paw-bean)"
                stroke="#fdf4ff"
                strokeWidth="1"
              />
              <ellipse
                cx="12.4"
                cy="7.8"
                rx="2.35"
                ry="3.3"
                transform="rotate(-7 12.4 7.8)"
                fill="url(#cc-grad-paw-bean)"
                stroke="#fdf4ff"
                strokeWidth="1"
              />
              <ellipse
                cx="17.8"
                cy="7.8"
                rx="2.35"
                ry="3.3"
                transform="rotate(7 17.8 7.8)"
                fill="url(#cc-grad-paw-bean)"
                stroke="#fdf4ff"
                strokeWidth="1"
              />
              <ellipse
                cx="22.8"
                cy="12.2"
                rx="2.3"
                ry="3.1"
                transform="rotate(22 22.8 12.2)"
                fill="url(#cc-grad-paw-bean)"
                stroke="#fdf4ff"
                strokeWidth="1"
              />
              {/* Main sculpted heart-lobed metacarpal pad */}
              <path
                d="M9.2 19.6 C9.2 15.8 12.2 13.6 15 13.6 C17.8 13.6 20.8 15.8 20.8 19.6 C20.8 22.8 18.2 24.4 15 23.1 C11.8 24.4 9.2 22.8 9.2 19.6 Z"
                fill="url(#cc-grad-paw-pad)"
                stroke="#7dd3fc"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              {/* Inner luminous star crystal */}
              <path
                d="M15 16.4 L15.9 18.4 L18 19.2 L15.9 20 L15 22 L14.1 20 L12 19.2 L14.1 18.4 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Layer C: Precision Quantum Text I-Beam Caret */}
        <div className="cc-tip-layer cc-tip-text">
          <svg viewBox="0 0 16 24" className="w-[16px] h-[24px] overflow-visible">
            <line
              x1="8"
              y1="4"
              x2="8"
              y2="20"
              stroke="var(--cursor-accent)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <line x1="8" y1="5" x2="8" y2="19" stroke="var(--cursor-core)" strokeWidth="0.8" />
            <path d="M4.5 3.5 L11.5 3.5" stroke="var(--cursor-secondary)" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4.5 20.5 L11.5 20.5" stroke="var(--cursor-secondary)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="8" cy="12" r="1.4" fill="var(--cursor-core)" stroke="var(--cursor-accent)" strokeWidth="0.8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
