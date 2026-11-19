"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Pin, PinOff, X } from "lucide-react";
import { complexToScreen, screenToComplex } from "./lib/camera";
import { FRACTAL_FORMULAS } from "./lib/formulas";
import type { FractalSettings } from "./lib/types";
import { WebGLFractalRenderer } from "./lib/webglRenderer";

interface JuliaPipProps {
  mode: "julia-pip";
  settings: FractalSettings;
  previewCx: number;
  previewCy: number;
  pinned: boolean;
  onTogglePin: () => void;
  onPromote: () => void;
  onClose: () => void;
}

interface MinimapProps {
  mode: "minimap";
  settings: FractalSettings;
  mainSize: { w: number; h: number };
  onJumpTo: (re: number, im: number) => void;
  onClose: () => void;
}

type Props = JuliaPipProps | MinimapProps;

const MINI_W = 200;
const MINI_H = 132;

export function JuliaMiniCanvas(props: Props) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLFractalRenderer | null>(null);

  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;
    const renderer = new WebGLFractalRenderer(canvas);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  const previewCx = props.mode === "julia-pip" ? props.previewCx : props.settings.juliaCx;
  const previewCy = props.mode === "julia-pip" ? props.previewCy : props.settings.juliaCy;

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !renderer.isAvailable()) return;
    const meta = FRACTAL_FORMULAS[props.settings.family];

    const overrideSettings: FractalSettings =
      props.mode === "julia-pip"
        ? {
            ...props.settings,
            isJulia: true,
            juliaCx: previewCx,
            juliaCy: previewCy,
            camera: { centerX: 0, centerY: 0, zoom: 0.9, rotation: 0 },
            maxIter: Math.min(180, props.settings.maxIter),
            autoIter: false,
            aa: 1,
          }
        : {
            ...props.settings,
            camera: meta.defaultCamera,
            maxIter: Math.min(140, props.settings.maxIter),
            autoIter: false,
            aa: 1,
          };

    renderer.render(overrideSettings, MINI_W, MINI_H, "f32", 1);
  }, [props.mode, props.settings, previewCx, previewCy]);

  // Draw minimap viewport rectangle
  useEffect(() => {
    if (props.mode !== "minimap") return;
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, MINI_W, MINI_H);

    const meta = FRACTAL_FORMULAS[props.settings.family];
    const miniCam = meta.defaultCamera;
    const mw = Math.max(100, props.mainSize.w);
    const mh = Math.max(100, props.mainSize.h);

    const corners = [
      screenToComplex(0, 0, mw, mh, props.settings.camera),
      screenToComplex(mw, 0, mw, mh, props.settings.camera),
      screenToComplex(mw, mh, mw, mh, props.settings.camera),
      screenToComplex(0, mh, mw, mh, props.settings.camera),
    ].map(c => complexToScreen(c.re, c.im, MINI_W, MINI_H, miniCam));

    const centerPt = complexToScreen(
      props.settings.camera.centerX,
      props.settings.camera.centerY,
      MINI_W,
      MINI_H,
      miniCam,
    );

    ctx.save();
    const boxSpan = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
    if (boxSpan > 6) {
      ctx.strokeStyle = "#00c3f5";
      ctx.fillStyle = "rgba(0, 195, 245, 0.14)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      corners.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#00c3f5";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, 6, 0, Math.PI * 2);
      ctx.moveTo(centerPt.x - 10, centerPt.y);
      ctx.lineTo(centerPt.x + 10, centerPt.y);
      ctx.moveTo(centerPt.x, centerPt.y - 10);
      ctx.lineTo(centerPt.x, centerPt.y + 10);
      ctx.stroke();
    }
    ctx.restore();
  }, [props]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (props.mode !== "minimap") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * MINI_W;
    const py = ((e.clientY - rect.top) / rect.height) * MINI_H;
    const meta = FRACTAL_FORMULAS[props.settings.family];
    const target = screenToComplex(px, py, MINI_W, MINI_H, meta.defaultCamera);
    props.onJumpTo(target.re, target.im);
  };

  return (
    <div className="fe-glass rounded-xl overflow-hidden shadow-2xl w-[202px]">
      <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 border-b border-slate-400/15 bg-black/40">
        <span className="text-[10px] font-mono text-cyan-300 truncate">
          {props.mode === "julia-pip"
            ? `Julia c=${previewCx.toFixed(3)}${previewCy >= 0 ? "+" : "−"}${Math.abs(previewCy).toFixed(3)}i`
            : "Viewport Minimap"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {props.mode === "julia-pip" && (
            <>
              <button
                onClick={props.onTogglePin}
                title={props.pinned ? "Unpin preview c" : "Pin preview c"}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${
                  props.pinned ? "text-amber-300" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {props.pinned ? <Pin size={11} /> : <PinOff size={11} />}
              </button>
              <button
                onClick={props.onPromote}
                title="Open this Julia set in main view"
                className="p-1 rounded text-cyan-300 hover:bg-cyan-400/15 transition-colors"
              >
                <ArrowUpRight size={11} />
              </button>
            </>
          )}
          <button
            onClick={props.onClose}
            title="Close"
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      <div
        className={`relative w-[200px] h-[132px] bg-[#050510] ${
          props.mode === "minimap" ? "cursor-crosshair" : ""
        }`}
        onClick={handleMinimapClick}
      >
        <canvas ref={glCanvasRef} width={MINI_W} height={MINI_H} className="w-full h-full block" />
        {props.mode === "minimap" && (
          <canvas
            ref={overlayRef}
            width={MINI_W}
            height={MINI_H}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
