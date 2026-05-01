"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import "./imgen.css";

const API_BASE = "https://image.pollinations.ai/prompt";

const RANDOM_PROMPTS = [
  "A mystical anime girl with flowing galaxy hair, wearing a celestial kimono, floating among stars and nebulae",
  "A cyberpunk samurai standing on a neon-lit rooftop in Tokyo at night, rain falling, holographic billboards",
  "A magical forest with bioluminescent mushrooms, fairy lights, a crystal-clear stream, ancient mossy trees",
  "A steampunk airship flying through golden clouds at sunset, brass gears and copper pipes",
  "An underwater palace made of coral and pearls, mermaids swimming around glowing jellyfish",
  "A dragon perched on a snow-capped mountain peak, aurora borealis dancing in the sky",
  "A cozy Japanese cafe in autumn, warm lantern light, maple leaves falling outside",
  "A futuristic space station orbiting a gas giant, sleek design, stars in the background",
  "An enchanted library with floating books, magical runes glowing on the walls, spiral staircase",
  "A cute fox spirit with nine glowing tails, cherry blossoms swirling around, moonlit shrine",
];

const SHAPES = [
  { id: "long", label: "Long", ratio: "9:16", w: 768, h: 1344, cls: "af-long" },
  { id: "portrait", label: "Portrait", ratio: "2:3", w: 768, h: 1152, cls: "af-portrait" },
  { id: "square", label: "Square", ratio: "1:1", w: 1024, h: 1024, cls: "af-square" },
  { id: "landscape", label: "Landscape", ratio: "3:2", w: 1152, h: 768, cls: "af-landscape" },
  { id: "wide", label: "Wide", ratio: "16:9", w: 1344, h: 768, cls: "af-wide" },
];

const PRESETS = [
  { label: "FHD 1080p", w: 1920, h: 1080 },
  { label: "QHD 1440p", w: 2560, h: 1440 },
  { label: "4K UHD", w: 3840, h: 2160 },
  { label: "Mobile", w: 1080, h: 1920 },
  { label: "2K Square", w: 2048, h: 2048 },
  { label: "Banner", w: 1500, h: 500 },
];

const LIGHTING = ["soft golden hour lighting","dramatic cinematic lighting","ethereal moonlight glow","vibrant neon illumination","atmospheric volumetric rays"];
const ATMO = ["dreamlike and surreal atmosphere","moody and mysterious ambiance","serene and peaceful vibes","epic and grandiose scale","vibrant and energetic aura"];
const COMP = ["rule of thirds composition","symmetrical centered framing","extreme close-up detail","sweeping wide-angle panorama","low-angle heroic perspective"];
const QUAL = ["ultra detailed 8K resolution","photorealistic render quality","masterpiece illustration quality","highly detailed digital art","hyperrealistic fine textures"];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

interface ImageEntry { url: string; prompt: string; fullPrompt: string; style: string; model: string; seed: number; w: number; h: number; loading: boolean; error: boolean; id: string; }
interface ModalData { url: string; prompt: string; style: string; model: string; seed: number; w: number; h: number; }
interface Toast { id: string; msg: string; type: "af-success" | "af-error"; }

export default function ImgenApp() {
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions, watermark, text, signature");
  const [negOpen, setNegOpen] = useState(false);
  const [style, setStyle] = useState("anime style, detailed anime art, vibrant colors");
  const [model, setModel] = useState("flux");
  const [shape, setShape] = useState("square");
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [seed, setSeed] = useState(-1);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [genCount, setGenCount] = useState(0);
  const styleRef = useRef<HTMLSelectElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);

  useEffect(() => { try { const c = localStorage.getItem("artforge_count"); if (c) setGenCount(parseInt(c)); } catch {} }, []);

  const toast = useCallback((msg: string, type: "af-success" | "af-error" = "af-success") => {
    const id = Date.now().toString();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const getDims = useCallback(() => {
    if (shape === "custom") return { w: Math.max(64, Math.min(4096, customW)), h: Math.max(64, Math.min(4096, customH)) };
    const s = SHAPES.find(s => s.id === shape);
    return s ? { w: s.w, h: s.h } : { w: 1024, h: 1024 };
  }, [shape, customW, customH]);

  const generate = useCallback(() => {
    if (!prompt.trim()) { toast("Please enter a description first!", "af-error"); return; }
    if (generating) return;
    setGenerating(true);
    const dims = getDims();
    const fullPrompt = style ? `${prompt}, ${style}` : prompt;
    const imgSeed = seed === -1 ? Math.floor(Math.random() * 999999) : seed;
    const modelText = modelRef.current?.options[modelRef.current.selectedIndex]?.text || model;
    const styleText = styleRef.current?.options[styleRef.current.selectedIndex]?.text || "";
    const params = new URLSearchParams({ width: String(dims.w), height: String(dims.h), seed: String(imgSeed), model, nologo: "true" });
    if (negative.trim()) params.set("negative_prompt", negative.trim());
    const url = `${API_BASE}/${encodeURIComponent(fullPrompt)}?${params}`;
    const id = Date.now().toString();
    const entry: ImageEntry = { url, prompt: prompt.trim(), fullPrompt, style: styleText, model: modelText, seed: imgSeed, w: dims.w, h: dims.h, loading: true, error: false, id };
    setImages(prev => [entry, ...prev]);

    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => { setImages(prev => prev.map(e => e.id === id ? { ...e, loading: false } : e)); setGenerating(false); };
    img.onerror = () => { setImages(prev => prev.map(e => e.id === id ? { ...e, loading: false, error: true } : e)); setGenerating(false); toast("Failed to generate image", "af-error"); };
    img.src = url;

    const nc = genCount + 1;
    setGenCount(nc);
    try { localStorage.setItem("artforge_count", String(nc)); } catch {}
  }, [prompt, negative, style, model, seed, generating, getDims, genCount, toast]);

  const enhance = useCallback(async () => {
    if (!prompt.trim()) { toast("Enter a prompt first", "af-error"); return; }
    setPrompt(p => `${p}, ${pick(LIGHTING)}, ${pick(ATMO)}, ${pick(COMP)}, ${pick(QUAL)}`);
    toast("Prompt enhanced!", "af-success");
  }, [prompt, toast]);

  const download = useCallback(async (url: string, seed: number) => {
    const fn = `artforge-${seed}.png`;
    try {
      const res = await fetch(url, { mode: "cors", referrerPolicy: "no-referrer" });
      const blob = new Blob([await res.blob()], { type: "image/png" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).showSaveFilePicker) {
        try { const h = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker({ suggestedName: fn, types: [{ description: "PNG", accept: { "image/png": [".png"] } }] }); const w = await h.createWritable(); await w.write(blob); await w.close(); toast("Image saved!"); return; } catch (e: unknown) { if ((e as {name:string}).name === "AbortError") return; }
      }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 5000);
      toast("Image downloaded!");
    } catch { window.open(url, "_blank"); toast("Right-click → Save Image As..."); }
  }, [toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); generate(); }
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generate]);

  const dims = getDims();
  const mp = ((dims.w * dims.h) / 1e6).toFixed(1);

  return (
    <div className="af-root min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">// Image Generator</div>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3"><span className="gradient-text-quantum">ArtForge AI</span></h1>
            <p className="text-foreground/50 max-w-xl leading-relaxed text-sm">Generate stunning AI images with 25+ art styles, multiple models, and advanced controls. Powered by Pollinations.ai — 100% free.</p>
          </div>
          <div className="af-stats">
            <div className="af-stat-badge"><span>🎨</span><span className="af-stat-value">{genCount}</span><span className="af-stat-label">Generated</span></div>
          </div>
        </div>

        {/* Main layout */}
        <div className="af-layout">
          {/* Controls */}
          <aside className="af-panel af-controls">
            <div className="af-panel-header"><h2 className="af-panel-title"><span>⚙️</span> Settings</h2></div>

            {/* Prompt */}
            <div className="af-section">
              <div className="af-label-row">
                <label className="af-label">Description</label>
                <div className="af-label-actions">
                  <button className="af-action-btn" onClick={() => { setPrompt(RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)]); toast("Random prompt loaded!"); }}>🎲 Randomize</button>
                  <button className="af-action-btn af-enhance" onClick={enhance}>✨ Enhance</button>
                </div>
              </div>
              <textarea className="af-textarea" rows={5} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={"Describe the image you want to generate...\n\nExample: A futuristic cyberpunk city at night, neon lights reflecting on wet streets"} />
            </div>

            {/* Negative */}
            <div className="af-section">
              <div className="af-label-row">
                <label className="af-label">Anti-Description</label>
                <button className="af-action-btn" onClick={() => setNegOpen(!negOpen)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={negOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} /></svg>
                </button>
              </div>
              <div className={`af-collapsible${negOpen ? "" : " af-collapsed"}`}>
                <textarea className="af-textarea af-small" rows={3} value={negative} onChange={e => setNegative(e.target.value)} placeholder="Things to avoid..." />
              </div>
            </div>

            {/* Art Style */}
            <div className="af-section">
              <label className="af-label">Art Style</label>
              <div className="af-select-wrap">
                <select ref={styleRef} className="af-select" value={style} onChange={e => setStyle(e.target.value)}>
                  <option value="">None (Raw Prompt)</option>
                  <optgroup label="🎨 Anime & Manga">
                    <option value="anime style, detailed anime art, vibrant colors">Anime</option>
                    <option value="chibi style, cute chibi character, kawaii">Chibi</option>
                    <option value="manga style, black and white manga, ink drawing">Manga</option>
                    <option value="90s anime style, retro anime, cel shading, VHS aesthetic">90s Retro Anime</option>
                    <option value="studio ghibli style, whimsical, soft colors, detailed background">Studio Ghibli</option>
                  </optgroup>
                  <optgroup label="🖼️ Artistic">
                    <option value="oil painting style, textured brushstrokes, rich colors">Oil Painting</option>
                    <option value="watercolor painting, soft washes, delicate, ethereal">Watercolor</option>
                    <option value="digital art, highly detailed, sharp, vibrant">Digital Art</option>
                    <option value="concept art, professional, cinematic, detailed">Concept Art</option>
                    <option value="pixel art, retro game style, 16-bit">Pixel Art</option>
                  </optgroup>
                  <optgroup label="📸 Realistic">
                    <option value="photorealistic, ultra detailed, 8k, professional photography">Photorealistic</option>
                    <option value="cinematic photography, dramatic lighting, film grain, bokeh">Cinematic</option>
                    <option value="portrait photography, professional studio lighting, sharp focus">Portrait Photo</option>
                  </optgroup>
                  <optgroup label="✨ Fantasy & Sci-Fi">
                    <option value="dark fantasy art, gothic, atmospheric, moody lighting">Dark Fantasy</option>
                    <option value="cyberpunk style, neon lights, futuristic, dark, rain">Cyberpunk</option>
                    <option value="steampunk style, brass, gears, Victorian, mechanical">Steampunk</option>
                    <option value="sci-fi concept art, futuristic, space, technology">Sci-Fi</option>
                  </optgroup>
                  <optgroup label="🎭 Special">
                    <option value="isometric 3D style, clean, geometric, miniature">Isometric 3D</option>
                    <option value="line art, clean lines, minimalist, black and white">Line Art</option>
                    <option value="comic book style, bold outlines, halftone, dynamic">Comic Book</option>
                  </optgroup>
                </select>
                <div className="af-select-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></div>
              </div>
            </div>

            {/* Model */}
            <div className="af-section">
              <label className="af-label">AI Model</label>
              <div className="af-select-wrap">
                <select ref={modelRef} className="af-select" value={model} onChange={e => setModel(e.target.value)}>
                  <option value="flux">Flux (Recommended)</option>
                  <option value="flux-realism">Flux Realism</option>
                  <option value="flux-anime">Flux Anime</option>
                  <option value="flux-3d">Flux 3D</option>
                  <option value="flux-pro">Flux Pro</option>
                  <option value="turbo">Turbo (Fast)</option>
                  <option value="any-dark">Any Dark</option>
                </select>
                <div className="af-select-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></div>
              </div>
            </div>

            {/* Shape */}
            <div className="af-section">
              <label className="af-label">Image Shape</label>
              <div className="af-shapes">
                {SHAPES.map(s => (
                  <button key={s.id} className={`af-shape-btn${shape === s.id ? " af-active" : ""}`} onClick={() => setShape(s.id)}>
                    <div className={`af-shape-preview ${s.cls}`} />
                    <span>{s.label}</span>
                    <span className="af-shape-ratio">{s.ratio}</span>
                  </button>
                ))}
                <button className={`af-shape-btn${shape === "custom" ? " af-active" : ""}`} onClick={() => setShape("custom")}>
                  <div className="af-shape-preview af-custom-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v14a2 2 0 002 2h14v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </div>
                  <span>Custom</span>
                  <span className="af-shape-ratio">Any</span>
                </button>
              </div>
              {/* Custom dims */}
              <div className={`af-custom-panel${shape === "custom" ? " af-visible" : ""}`}>
                <div className="af-dims-row">
                  <div className="af-dim-field">
                    <label className="af-dim-label">Width</label>
                    <div className="af-dim-wrap">
                      <input type="number" className="af-input af-dim-input" value={customW} min={64} max={4096} step={64} onChange={e => setCustomW(parseInt(e.target.value) || 1024)} />
                      <span className="af-dim-unit">px</span>
                    </div>
                  </div>
                  <button className="af-swap-btn" onClick={() => { setCustomW(customH); setCustomH(customW); }} title="Swap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                  </button>
                  <div className="af-dim-field">
                    <label className="af-dim-label">Height</label>
                    <div className="af-dim-wrap">
                      <input type="number" className="af-input af-dim-input" value={customH} min={64} max={4096} step={64} onChange={e => setCustomH(parseInt(e.target.value) || 1024)} />
                      <span className="af-dim-unit">px</span>
                    </div>
                  </div>
                </div>
                <div className="af-dim-preview">{customW} × {customH} — {mp} MP</div>
                <div className="af-presets">
                  {PRESETS.map(p => (
                    <button key={p.label} className={`af-preset${customW === p.w && customH === p.h ? " af-active" : ""}`} onClick={() => { setCustomW(p.w); setCustomH(p.h); }}>{p.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seed */}
            <div className="af-section">
              <div className="af-label-row">
                <label className="af-label">Seed</label>
                <button className="af-action-btn" onClick={() => setSeed(Math.floor(Math.random() * 999999))}>🎲 Random</button>
              </div>
              <input type="number" className="af-input" value={seed} onChange={e => setSeed(parseInt(e.target.value) || -1)} placeholder="Random (-1)" />
            </div>

            {/* Generate */}
            <button className="af-generate" disabled={generating} onClick={generate}>
              <div className="af-btn-inner">
                {generating ? (<><div className="af-spinner" /><span>Generating...</span></>) : (<><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg><span>Generate Image</span></>)}
              </div>
            </button>
            <div className="af-shortcut">Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to generate</div>
          </aside>

          {/* Gallery */}
          <section className="af-panel af-gallery">
            <div className="af-panel-header">
              <h2 className="af-panel-title"><span>🖼️</span> Generated Images</h2>
              {images.length > 0 && (
                <button className="af-action-btn" onClick={() => { setImages([]); toast("Gallery cleared"); }}>🗑️ Clear All</button>
              )}
            </div>

            {images.length === 0 ? (
              <div className="af-empty">
                <div className="af-empty-illus">
                  <div className="af-empty-circle" />
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="af-empty-icon"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                </div>
                <h3>No Images Yet</h3>
                <p>Enter a description and click Generate to create stunning AI art</p>
              </div>
            ) : (
              <div className="af-grid">
                {images.map((img, i) => (
                  <div key={img.id} className="af-card" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => !img.loading && !img.error && setModal({ url: img.url, prompt: img.prompt, style: img.style, model: img.model, seed: img.seed, w: img.w, h: img.h })}>
                    <div className="af-card-img-wrap" style={{ aspectRatio: `${img.w}/${img.h}` }}>
                      {!img.loading && !img.error && <img className="af-card-img" src={img.url} alt={img.prompt} referrerPolicy="no-referrer" />}
                      {img.loading && (
                        <div className="af-card-loading"><div className="af-loading-ring" /><span className="af-loading-text">Generating...</span></div>
                      )}
                      {img.error && (
                        <div className="af-card-loading"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg><span className="af-loading-text" style={{ color: "#ef4444" }}>Failed</span></div>
                      )}
                      {!img.loading && !img.error && (
                        <div className="af-card-overlay">
                          <div className="af-card-actions">
                            <button className="af-card-action" onClick={e => { e.stopPropagation(); setModal({ url: img.url, prompt: img.prompt, style: img.style, model: img.model, seed: img.seed, w: img.w, h: img.h }); }} title="View">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </button>
                            <button className="af-card-action" onClick={e => { e.stopPropagation(); download(img.url, img.seed); }} title="Download">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="af-card-info">
                      <p className="af-card-prompt">{img.loading ? "Generating image..." : img.prompt}</p>
                      <div className="af-card-meta">
                        <span className="af-card-badge">{img.model}</span>
                        <span className="af-card-time">Just now</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal */}
      <div className={`af-modal${modal ? " af-active" : ""}`} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        {modal && (
          <div className="af-modal-content">
            <button className="af-modal-close" onClick={() => setModal(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <img className="af-modal-img" src={modal.url} alt={modal.prompt} referrerPolicy="no-referrer" />
            <div className="af-modal-info">
              <p className="af-modal-prompt">{modal.prompt} | Style: {modal.style} | Model: {modal.model} | Seed: {modal.seed} | {modal.w}×{modal.h}</p>
              <div className="af-modal-actions">
                <button className="af-modal-action" onClick={() => download(modal.url, modal.seed)}>⬇️ Download</button>
                <button className="af-modal-action" onClick={() => { navigator.clipboard.writeText(modal.prompt); toast("Prompt copied!"); }}>📋 Copy Prompt</button>
                <button className="af-modal-action" onClick={() => { setPrompt(modal.prompt); setModal(null); toast("Settings loaded!"); }}>🔄 Reuse</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="af-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`af-toast ${t.type}`}>
            <span className="af-toast-icon">{t.type === "af-success" ? "✅" : "⚠️"}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
