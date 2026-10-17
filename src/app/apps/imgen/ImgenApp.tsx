"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import "./imgen.css";

const API_BASE = "https://image.pollinations.ai/prompt";

const RANDOM_PROMPTS = [
  "A mystical anime girl with flowing galaxy hair, wearing a celestial kimono, floating among stars and nebulae",
  "A cyberpunk samurai standing on a neon-lit rooftop in Neo Tokyo at night, rain pouring, holographic billboards reflecting on puddle water",
  "A magical ancient forest with bioluminescent mushrooms, fairy lights, crystal-clear stream, towering mossy willow trees",
  "A steampunk airship navigating through golden thunderclouds at sunset, polished brass gears and glowing steam copper pipes",
  "An ethereal underwater palace carved from iridescent coral and pearls, bioluminescent manta rays and jellyfish swimming around",
  "A majestic dragon perched on a snow-capped alpine mountain peak, vibrant aurora borealis dancing across the midnight sky",
  "A cozy traditional Japanese ramen shop in autumn, warm paper lanterns, steam rising from bowls, falling crimson maple leaves",
  "A futuristic deep space research station orbiting a banded violet gas giant, sleek glass domes, distant galaxy clusters",
  "An enchanted grand library with floating leatherbound books, glowing arcane runes on stone arches, spiral crystal staircase",
  "A nine-tailed kitsune fox spirit with glowing cyan tails, cherry blossom petals drifting around a moonlit Shinto shrine",
  "Cinematic portrait of a courageous desert nomad warrior, golden hour rim light, intricate embroidered silk garments, windblown sands",
  "Retro 90s anime aesthetic of a teenager riding a motorcycle along a coastal highway at twilight, lo-fi nostalgic vibes",
  "Isometric 3D miniature diorama of a lush floating bonsai island, miniature waterfall cascading into clouds, glowing miniature cottage",
  "Hyperdetailed studio portrait of an owl with feathers made of polished obsidian and gold leaf, piercing amber eyes, dark velvet background",
  "Vibrant watercolor painting of Venice canals during sunrise, soft pastel reflections in gentle rippling water, gondolas moored",
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
  { label: "Mobile (9:16)", w: 1080, h: 1920 },
  { label: "2K Square", w: 2048, h: 2048 },
  { label: "Banner (3:1)", w: 1500, h: 500 },
];

const NEGATIVE_CHIPS = [
  "blurry",
  "low quality",
  "distorted",
  "bad anatomy",
  "watermark",
  "text",
  "deformed",
  "extra limbs",
];

const LIGHTING = [
  "soft golden hour rim lighting",
  "dramatic cinematic chiaroscuro lighting",
  "ethereal moonlight radiance",
  "vibrant cyberpunk neon illumination",
  "atmospheric volumetric god rays",
  "soft diffused studio box lighting",
];

const ATMO = [
  "dreamlike and surreal atmosphere",
  "moody and mysterious cinematic ambiance",
  "serene and peaceful tranquil vibes",
  "epic, legendary and grandiose scale",
  "vibrant, energetic and electric aura",
];

const COMP = [
  "rule of thirds composition",
  "symmetrical centered heroic framing",
  "extreme macro close-up detail",
  "sweeping cinematic wide-angle panorama",
  "dramatic low-angle perspective",
];

const QUAL = [
  "ultra detailed 8K resolution masterpiece",
  "photorealistic render quality, Unreal Engine 5 render",
  "masterpiece digital illustration, sharp focus",
  "highly detailed concept art, trending on ArtStation",
  "hyperrealistic fine textures and crisp contours",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

interface ImageEntry {
  id: string;
  url: string;
  prompt: string;
  fullPrompt: string;
  style: string;
  model: string;
  seed: number;
  w: number;
  h: number;
  loading: boolean;
  error: boolean;
  timestamp: number;
}

interface ModalData {
  id: string;
  url: string;
  prompt: string;
  fullPrompt: string;
  style: string;
  model: string;
  seed: number;
  w: number;
  h: number;
}

interface Toast {
  id: string;
  msg: string;
  type: "af-success" | "af-error" | "af-info";
}

const STORAGE_KEY_COUNT = "artforge_count";
const STORAGE_KEY_HISTORY = "artforge_history_v2";

export default function ImgenApp() {
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState(
    "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions, watermark, text, signature"
  );
  const [negOpen, setNegOpen] = useState(false);
  const [style, setStyle] = useState("anime style, detailed anime art, vibrant colors");
  const [model, setModel] = useState("flux");
  const [shape, setShape] = useState("square");
  const [customW, setCustomW] = useState(1024);
  const [customH, setCustomH] = useState(1024);
  const [seed, setSeed] = useState(-1);
  const [batchCount, setBatchCount] = useState<1 | 2 | 4>(1);
  const [generating, setGenerating] = useState(false);

  // Lazy initialize state from localStorage
  const [genCount, setGenCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COUNT);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [images, setImages] = useState<ImageEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item: ImageEntry) => ({
            ...item,
            loading: false, // Ensure restored items aren't stuck loading
          }));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [modal, setModal] = useState<ModalData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const styleRef = useRef<HTMLSelectElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const galleryRef = useRef<HTMLElement>(null);

  // Save history to localStorage
  const saveImagesHistory = useCallback((items: ImageEntry[]) => {
    try {
      const toSave = items
        .filter((item) => !item.error)
        .slice(0, 24)
        .map((item) => ({ ...item, loading: false }));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(toSave));
    } catch {
      // Storage quota or disabled
    }
  }, []);

  const toast = useCallback(
    (msg: string, type: "af-success" | "af-error" | "af-info" = "af-success") => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((t) => [...t, { id, msg, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    },
    []
  );

  const getDims = useCallback(() => {
    if (shape === "custom") {
      return {
        w: Math.max(64, Math.min(4096, customW)),
        h: Math.max(64, Math.min(4096, customH)),
      };
    }
    const s = SHAPES.find((s) => s.id === shape);
    return s ? { w: s.w, h: s.h } : { w: 1024, h: 1024 };
  }, [shape, customW, customH]);

  const scrollToGallery = useCallback(() => {
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const generate = useCallback(() => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast("Please enter a description for your image first!", "af-error");
      return;
    }
    if (generating) return;

    setGenerating(true);
    const dims = getDims();
    const fullPrompt = style ? `${trimmedPrompt}, ${style}` : trimmedPrompt;
    const modelText =
      modelRef.current?.options[modelRef.current.selectedIndex]?.text || model;
    const styleText =
      styleRef.current?.options[styleRef.current.selectedIndex]?.text || "None";

    // Smooth scroll down to gallery on mobile so user sees progress
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setTimeout(scrollToGallery, 150);
    }

    const count = batchCount;
    const newEntries: ImageEntry[] = [];
    const baseSeed = seed === -1 ? Math.floor(Math.random() * 999999) : seed;

    for (let i = 0; i < count; i++) {
      const imgSeed = count === 1 ? baseSeed : baseSeed + i * 173;
      const params = new URLSearchParams({
        width: String(dims.w),
        height: String(dims.h),
        seed: String(imgSeed),
        model,
        nologo: "true",
        nofeed: "true",
      });
      if (negative.trim()) {
        params.set("negative_prompt", negative.trim());
      }
      const url = `${API_BASE}/${encodeURIComponent(fullPrompt)}?${params.toString()}`;
      const id = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

      newEntries.push({
        id,
        url,
        prompt: trimmedPrompt,
        fullPrompt,
        style: styleText,
        model: modelText,
        seed: imgSeed,
        w: dims.w,
        h: dims.h,
        loading: true,
        error: false,
        timestamp: Date.now(),
      });
    }

    setImages((prev) => {
      const updated = [...newEntries, ...prev];
      return updated;
    });

    let completed = 0;
    newEntries.forEach((entry) => {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        completed++;
        setImages((prev) => {
          const updated = prev.map((e) =>
            e.id === entry.id ? { ...e, loading: false } : e
          );
          saveImagesHistory(updated);
          return updated;
        });
        if (completed >= newEntries.length) {
          setGenerating(false);
          toast(
            count > 1
              ? `Generated ${count} images successfully!`
              : "Image generated successfully!",
            "af-success"
          );
        }
      };
      img.onerror = () => {
        completed++;
        setImages((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, loading: false, error: true } : e
          )
        );
        if (completed >= newEntries.length) {
          setGenerating(false);
          toast("Failed to generate one or more images.", "af-error");
        }
      };
      img.src = entry.url;
    });

    // Update generation counter
    setGenCount((prevCount) => {
      const nc = prevCount + count;
      try {
        localStorage.setItem(STORAGE_KEY_COUNT, String(nc));
      } catch {
        // ignore
      }
      return nc;
    });
  }, [
    prompt,
    generating,
    getDims,
    style,
    model,
    batchCount,
    seed,
    negative,
    scrollToGallery,
    toast,
    saveImagesHistory,
  ]);

  const enhance = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast("Enter a prompt first to enhance it", "af-error");
      return;
    }
    const additions = [pick(LIGHTING), pick(ATMO), pick(COMP), pick(QUAL)];
    const filteredAdditions = additions.filter(
      (token) => !trimmed.toLowerCase().includes(token.toLowerCase())
    );
    if (filteredAdditions.length === 0) {
      toast("Prompt is already richly detailed!", "af-info");
      return;
    }
    setPrompt(`${trimmed}, ${filteredAdditions.join(", ")}`);
    toast("Prompt enhanced with artistic details!", "af-success");
  }, [prompt, toast]);

  const download = useCallback(
    async (url: string, imgSeed: number) => {
      const fn = `artforge-${imgSeed}.png`;
      try {
        const res = await fetch(url, {
          mode: "cors",
          referrerPolicy: "no-referrer",
        });
        if (!res.ok) throw new Error("Fetch failed");
        const blob = await res.blob();

        // Native file picker if supported (desktop Chrome/Edge)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).showSaveFilePicker) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: fn,
              types: [
                {
                  description: "Image file",
                  accept: { [blob.type || "image/png"]: [".png", ".jpg"] },
                },
              ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            toast("Image saved to your computer!", "af-success");
            return;
          } catch (e: unknown) {
            if ((e as { name?: string }).name === "AbortError") return;
          }
        }

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        }, 3000);
        toast("Download started!", "af-success");
      } catch {
        // Fallback: open image in new tab with instructions
        window.open(url, "_blank", "noopener,noreferrer");
        toast("Opening image — long-press or right-click to save", "af-info");
      }
    },
    [toast]
  );

  const deleteImage = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== id);
        saveImagesHistory(updated);
        return updated;
      });
      if (modal?.id === id) {
        setModal(null);
      }
      toast("Image removed from gallery", "af-info");
    },
    [modal, saveImagesHistory, toast]
  );

  const clearAllImages = useCallback(() => {
    if (images.length === 0) return;
    if (confirm("Are you sure you want to clear all generated images?")) {
      setImages([]);
      try {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
      } catch {
        // ignore
      }
      toast("Gallery cleared", "af-info");
    }
  }, [images.length, toast]);

  const copyPromptText = useCallback(
    (text: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      toast("Prompt copied to clipboard!", "af-success");
    },
    [toast]
  );

  const reuseImageSettings = useCallback(
    (item: ModalData) => {
      setPrompt(item.prompt);
      if (item.seed !== undefined) setSeed(item.seed);
      setModal(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast("Settings restored into generator!", "af-success");
    },
    [toast]
  );

  const addNegativeChip = useCallback(
    (chip: string) => {
      if (negative.toLowerCase().includes(chip.toLowerCase())) return;
      setNegative((prev) => (prev ? `${prev}, ${chip}` : chip));
      toast(`Added "${chip}" to filter`, "af-info");
    },
    [negative, toast]
  );

  // Keyboard shortcut Ctrl+Enter to generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      }
      if (e.key === "Escape") {
        setModal(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generate]);

  const dims = getDims();
  const megapixels = ((dims.w * dims.h) / 1e6).toFixed(1);

  return (
    <div className="af-root min-h-screen keffiyeh-bg">
      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[120px]" />
      </div>

      <div className="section-container pt-8 pb-32">
        {/* Back Link */}
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-quantum/70 hover:text-quantum mb-4 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Back to Apps</span>
        </Link>

        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-quantum/60 tracking-widest uppercase mb-2">
              {"// Creative Studio · AI Generation"}
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-2 sm:mb-3 tracking-tight">
              <span className="gradient-text-quantum">ArtForge</span>{" "}
              <span className="text-foreground/70">AI</span>
            </h1>
            <p className="text-foreground/55 max-w-xl leading-relaxed text-xs sm:text-sm">
              Generate breathtaking images with 25+ art styles, customizable aspect ratios, prompt enhancement, and advanced controls. Powered by Pollinations.ai — 100% free, no sign-up.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {[
                "Flux & Turbo AI",
                "25+ Styles",
                "Prompt Enhancer",
                "Negative Filtering",
                "Custom Aspect Ratios",
                "Batch Generation",
              ].map((pill) => (
                <span
                  key={pill}
                  className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-quantum/20 bg-quantum/5 text-quantum/70 shadow-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Stats & Jump button */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {images.length > 0 && (
              <button
                type="button"
                onClick={scrollToGallery}
                className="af-gallery-jump-btn sm:hidden"
                aria-label="Scroll to gallery"
              >
                🖼️ Gallery ({images.length})
              </button>
            )}
            <div className="af-stat-badge">
              <span>🎨</span>
              <span className="af-stat-value">{genCount}</span>
              <span className="af-stat-label">Generated</span>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="af-layout">
          {/* Controls Panel */}
          <aside className="af-panel af-controls">
            <div className="af-panel-header">
              <h2 className="af-panel-title">
                <span>⚙️</span> Studio Controls
              </h2>
            </div>

            {/* Prompt */}
            <div className="af-section">
              <div className="af-label-row">
                <label htmlFor="promptInput" className="af-label">
                  Description / Prompt
                </label>
                <div className="af-label-actions">
                  <button
                    type="button"
                    className="af-action-btn"
                    onClick={() => {
                      const next =
                        RANDOM_PROMPTS[
                          Math.floor(Math.random() * RANDOM_PROMPTS.length)
                        ];
                      setPrompt(next);
                      toast("Random prompt loaded!", "af-info");
                    }}
                  >
                    🎲 Random
                  </button>
                  <button
                    type="button"
                    className="af-action-btn af-enhance"
                    onClick={enhance}
                    title="Add artistic and cinematic tokens to your prompt"
                  >
                    ✨ Enhance
                  </button>
                </div>
              </div>
              <textarea
                id="promptInput"
                className="af-textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision in detail...&#10;&#10;e.g., A cyberpunk samurai standing on a neon-lit rooftop in Tokyo at night, rain pouring, holographic billboards"
              />
            </div>

            {/* Negative Prompt / Filter */}
            <div className="af-section">
              <div className="af-label-row">
                <label htmlFor="negativeInput" className="af-label">
                  Avoid / Filter Out
                </label>
                <button
                  type="button"
                  className="af-action-btn af-toggle-btn"
                  onClick={() => setNegOpen((v) => !v)}
                  aria-expanded={negOpen}
                >
                  <span>{negOpen ? "Hide" : "Customize"}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`af-chevron ${negOpen ? "af-open" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Quick filter chips */}
              <div className="flex flex-wrap gap-1 mt-1">
                {NEGATIVE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`af-chip ${
                      negative.toLowerCase().includes(chip) ? "af-chip-active" : ""
                    }`}
                    onClick={() => addNegativeChip(chip)}
                  >
                    +{chip}
                  </button>
                ))}
              </div>

              <div className={`af-collapsible ${negOpen ? "" : "af-collapsed"}`}>
                <textarea
                  id="negativeInput"
                  className="af-textarea af-small"
                  rows={2}
                  value={negative}
                  onChange={(e) => setNegative(e.target.value)}
                  placeholder="Things to avoid (e.g. blurry, low quality, deformed, text)..."
                />
              </div>
            </div>

            {/* Art Style */}
            <div className="af-section">
              <label htmlFor="artStyleSelect" className="af-label">
                Art Style
              </label>
              <div className="af-select-wrap">
                <select
                  id="artStyleSelect"
                  ref={styleRef}
                  className="af-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="">None (Raw Prompt Only)</option>
                  <optgroup label="🎨 Anime & Manga">
                    <option value="anime style, detailed anime art, vibrant colors, makoto shinkai aesthetic">
                      Anime (Makoto Shinkai)
                    </option>
                    <option value="chibi style, cute chibi character, kawaii, vibrant pastel colors">
                      Chibi (Kawaii)
                    </option>
                    <option value="manga style, black and white manga, ink drawing, cross-hatching, screentone">
                      Manga (Monochrome Ink)
                    </option>
                    <option value="90s anime style, retro anime, cel shading, VHS aesthetic, vintage anime screencap">
                      90s Retro Anime (Cel Shaded)
                    </option>
                    <option value="studio ghibli style, whimsical, soft hand-painted colors, detailed lush background, hayao miyazaki">
                      Studio Ghibli (Hand-Painted)
                    </option>
                  </optgroup>
                  <optgroup label="🖼️ Artistic & Fine Art">
                    <option value="oil painting style, rich impasto textured brushstrokes, classical oil on canvas">
                      Oil Painting (Classical)
                    </option>
                    <option value="watercolor painting, soft washes, delicate bleeding colors, ethereal paper texture">
                      Watercolor (Ethereal)
                    </option>
                    <option value="digital art, highly detailed, sharp rendering, vibrant lighting, masterpiece illustration">
                      Digital Art (Modern)
                    </option>
                    <option value="concept art, professional production art, cinematic, atmospheric, trending on ArtStation">
                      Concept Art (Production)
                    </option>
                    <option value="pixel art, retro 16-bit arcade game style, clean pixel grid, nostalgic palette">
                      Pixel Art (16-Bit)
                    </option>
                  </optgroup>
                  <optgroup label="📸 Photography & Realism">
                    <option value="photorealistic, 8k professional photography, high-end DSLR, 85mm lens, f/1.4 aperture, natural lighting">
                      Photorealistic (DSLR 8K)
                    </option>
                    <option value="cinematic photography, 35mm film stock, anamorphic lens, dramatic chiaroscuro, film grain">
                      Cinematic Film (35mm)
                    </option>
                    <option value="portrait photography, studio lighting, soft rim light, sharp focus, 85mm portraiture">
                      Studio Portrait Photo
                    </option>
                  </optgroup>
                  <optgroup label="✨ Fantasy & Sci-Fi">
                    <option value="dark fantasy art, gothic, moody volumetric fog, eldritch ambiance, dark souls aesthetic">
                      Dark Fantasy (Gothic)
                    </option>
                    <option value="cyberpunk style, neon glow, wet asphalt reflections, futuristic city, blade runner aesthetic">
                      Cyberpunk (Neon)
                    </option>
                    <option value="steampunk aesthetic, polished brass gears, copper steam pipes, Victorian industrial design">
                      Steampunk (Victorian)
                    </option>
                    <option value="space opera sci-fi art, cosmic nebula, futuristic starships, vast celestial scale">
                      Sci-Fi (Space Opera)
                    </option>
                  </optgroup>
                  <optgroup label="🎭 3D & Graphic">
                    <option value="isometric 3D style, clean geometry, miniature diorama, octane render, soft ambient shadows">
                      Isometric 3D Diorama
                    </option>
                    <option value="clean minimalist line art, vector illustration, precise outlines, monochrome simplicity">
                      Line Art (Minimalist)
                    </option>
                    <option value="comic book style, bold inked outlines, halftone dot pattern, dynamic superhero action">
                      Comic Book (Graphic Ink)
                    </option>
                  </optgroup>
                </select>
                <div className="af-select-icon">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Model & Batch Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="af-section">
                <label htmlFor="aiModelSelect" className="af-label">
                  AI Model
                </label>
                <div className="af-select-wrap">
                  <select
                    id="aiModelSelect"
                    ref={modelRef}
                    className="af-select"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="flux">Flux (Best Quality)</option>
                    <option value="flux-realism">Flux Realism</option>
                    <option value="flux-anime">Flux Anime</option>
                    <option value="flux-3d">Flux 3D</option>
                    <option value="turbo">Turbo (Ultra Fast)</option>
                  </select>
                  <div className="af-select-icon">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="af-section">
                <label className="af-label">Batch Size</label>
                <div className="af-batch-selector">
                  {([1, 2, 4] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      className={`af-batch-btn ${
                        batchCount === cnt ? "af-active" : ""
                      }`}
                      onClick={() => setBatchCount(cnt)}
                    >
                      {cnt}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shape / Aspect Ratio */}
            <div className="af-section">
              <div className="af-label-row">
                <label className="af-label">Aspect Ratio</label>
                <span className="text-[11px] font-mono text-quantum/70">
                  {dims.w}×{dims.h} ({megapixels} MP)
                </span>
              </div>
              <div className="af-shapes">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`af-shape-btn ${shape === s.id ? "af-active" : ""}`}
                    onClick={() => setShape(s.id)}
                  >
                    <div className={`af-shape-preview ${s.cls}`} />
                    <span>{s.label}</span>
                    <span className="af-shape-ratio">{s.ratio}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`af-shape-btn ${shape === "custom" ? "af-active" : ""}`}
                  onClick={() => setShape("custom")}
                >
                  <div className="af-shape-preview af-custom-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4v14a2 2 0 002 2h14v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <span>Custom</span>
                  <span className="af-shape-ratio">Any</span>
                </button>
              </div>

              {/* Custom dims panel */}
              <div
                className={`af-custom-panel ${
                  shape === "custom" ? "af-visible" : ""
                }`}
              >
                <div className="af-dims-row">
                  <div className="af-dim-field">
                    <label htmlFor="customWidthInput" className="af-dim-label">
                      Width
                    </label>
                    <div className="af-dim-wrap">
                      <input
                        id="customWidthInput"
                        type="number"
                        className="af-input af-dim-input"
                        value={customW}
                        min={64}
                        max={4096}
                        step={64}
                        onChange={(e) =>
                          setCustomW(parseInt(e.target.value, 10) || 1024)
                        }
                      />
                      <span className="af-dim-unit">px</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="af-swap-btn"
                    onClick={() => {
                      setCustomW(customH);
                      setCustomH(customW);
                    }}
                    title="Swap width & height"
                    aria-label="Swap dimensions"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>

                  <div className="af-dim-field">
                    <label htmlFor="customHeightInput" className="af-dim-label">
                      Height
                    </label>
                    <div className="af-dim-wrap">
                      <input
                        id="customHeightInput"
                        type="number"
                        className="af-input af-dim-input"
                        value={customH}
                        min={64}
                        max={4096}
                        step={64}
                        onChange={(e) =>
                          setCustomH(parseInt(e.target.value, 10) || 1024)
                        }
                      />
                      <span className="af-dim-unit">px</span>
                    </div>
                  </div>
                </div>

                <div className="af-presets">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`af-preset ${
                        customW === p.w && customH === p.h ? "af-active" : ""
                      }`}
                      onClick={() => {
                        setCustomW(p.w);
                        setCustomH(p.h);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seed */}
            <div className="af-section">
              <div className="af-label-row">
                <label htmlFor="seedInput" className="af-label">
                  Seed (Reproducibility)
                </label>
                <button
                  type="button"
                  className="af-action-btn"
                  onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                >
                  🎲 Random Seed
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  id="seedInput"
                  type="number"
                  className="af-input"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value, 10) || -1)}
                  placeholder="Random (-1)"
                />
                {seed !== -1 && (
                  <button
                    type="button"
                    className="af-action-btn px-3"
                    onClick={() => setSeed(-1)}
                    title="Reset to random"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              className="af-generate"
              disabled={generating}
              onClick={generate}
            >
              <div className="af-btn-inner">
                {generating ? (
                  <>
                    <div className="af-spinner" />
                    <span>Synthesizing Image{batchCount > 1 ? "s" : ""}...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span>
                      Generate {batchCount > 1 ? `${batchCount} Images` : "Image"}
                    </span>
                  </>
                )}
              </div>
            </button>

            <div className="af-shortcut hidden sm:block">
              Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to generate
            </div>
          </aside>

          {/* Gallery Section */}
          <section ref={galleryRef} id="gallerySection" className="af-panel af-gallery">
            <div className="af-panel-header">
              <div className="flex items-center gap-2">
                <h2 className="af-panel-title">
                  <span>🖼️</span> Generated Artwork
                </h2>
                {images.length > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-quantum/10 text-quantum border border-quantum/20">
                    {images.length}
                  </span>
                )}
              </div>
              {images.length > 0 && (
                <button
                  type="button"
                  className="af-action-btn hover:text-red-400 hover:border-red-500/30"
                  onClick={clearAllImages}
                >
                  🗑️ Clear Gallery
                </button>
              )}
            </div>

            {images.length === 0 ? (
              <div className="af-empty">
                <div className="af-empty-illus">
                  <div className="af-empty-circle" />
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="af-empty-icon"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <h3>Your Studio Canvas is Empty</h3>
                <p>
                  Enter a creative prompt above, select your favorite style, and click Generate to bring your imagination to life.
                </p>
                <button
                  type="button"
                  className="af-action-btn mt-2 px-4 py-2 text-xs"
                  onClick={() => {
                    setPrompt(
                      RANDOM_PROMPTS[
                        Math.floor(Math.random() * RANDOM_PROMPTS.length)
                      ]
                    );
                    toast("Inspirational prompt loaded!", "af-info");
                  }}
                >
                  🎲 Try a Sample Prompt
                </button>
              </div>
            ) : (
              <div className="af-grid">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="af-card"
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
                  >
                    <div
                      className="af-card-img-wrap"
                      style={{ aspectRatio: `${img.w}/${img.h}` }}
                      onClick={() =>
                        !img.loading &&
                        !img.error &&
                        setModal({
                          id: img.id,
                          url: img.url,
                          prompt: img.prompt,
                          fullPrompt: img.fullPrompt,
                          style: img.style,
                          model: img.model,
                          seed: img.seed,
                          w: img.w,
                          h: img.h,
                        })
                      }
                    >
                      {!img.loading && !img.error && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          className="af-card-img"
                          src={img.url}
                          alt={img.prompt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {img.loading && (
                        <div className="af-card-loading">
                          <div className="af-loading-ring" />
                          <span className="af-loading-text">
                            Painting pixels...
                          </span>
                        </div>
                      )}

                      {img.error && (
                        <div className="af-card-loading">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 9l-6 6M9 9l6 6" />
                          </svg>
                          <span
                            className="af-loading-text"
                            style={{ color: "#ef4444" }}
                          >
                            Synthesis Failed
                          </span>
                        </div>
                      )}

                      {!img.loading && !img.error && (
                        <div className="af-card-overlay hidden sm:flex">
                          <div className="af-card-actions">
                            <button
                              type="button"
                              className="af-card-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({
                                  id: img.id,
                                  url: img.url,
                                  prompt: img.prompt,
                                  fullPrompt: img.fullPrompt,
                                  style: img.style,
                                  model: img.model,
                                  seed: img.seed,
                                  w: img.w,
                                  h: img.h,
                                });
                              }}
                              title="Full Screen Preview"
                              aria-label="Preview image"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="af-card-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                download(img.url, img.seed);
                              }}
                              title="Download High-Res"
                              aria-label="Download image"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="af-card-action hover:bg-red-500/80"
                              onClick={(e) => deleteImage(img.id, e)}
                              title="Delete from Gallery"
                              aria-label="Delete image"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="af-card-info">
                      <p className="af-card-prompt">
                        {img.loading ? "Generating artwork..." : img.prompt}
                      </p>

                      <div className="af-card-meta">
                        <span className="af-card-badge">{img.model}</span>
                        <span className="af-card-dims">
                          {img.w}×{img.h}
                        </span>
                        <span className="af-card-seed">#{img.seed}</span>
                      </div>

                      {/* Mobile touch action bar */}
                      {!img.loading && !img.error && (
                        <div className="af-card-mobile-actions sm:hidden">
                          <button
                            type="button"
                            className="af-mobile-btn"
                            onClick={() =>
                              setModal({
                                id: img.id,
                                url: img.url,
                                prompt: img.prompt,
                                fullPrompt: img.fullPrompt,
                                style: img.style,
                                model: img.model,
                                seed: img.seed,
                                w: img.w,
                                h: img.h,
                              })
                            }
                          >
                            🔍 Zoom
                          </button>
                          <button
                            type="button"
                            className="af-mobile-btn"
                            onClick={() => download(img.url, img.seed)}
                          >
                            ⬇️ Save
                          </button>
                          <button
                            type="button"
                            className="af-mobile-btn"
                            onClick={() => copyPromptText(img.prompt)}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            className="af-mobile-btn text-red-400"
                            onClick={(e) => deleteImage(img.id, e)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Full-Screen Modal Preview */}
      <div
        className={`af-modal ${modal ? "af-active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
        role="dialog"
        aria-modal="true"
      >
        {modal && (
          <div className="af-modal-content">
            <button
              type="button"
              className="af-modal-close"
              onClick={() => setModal(null)}
              aria-label="Close modal"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="af-modal-img-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="af-modal-img"
                src={modal.url}
                alt={modal.prompt}
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="af-modal-info">
              <div className="af-modal-prompt-wrap">
                <p className="af-modal-prompt font-medium text-foreground/90">
                  {modal.prompt}
                </p>
                {modal.fullPrompt !== modal.prompt && (
                  <p className="text-xs text-foreground/50 mt-1 line-clamp-2">
                    <span className="text-quantum/70 font-mono">Full: </span>
                    {modal.fullPrompt}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 my-3 text-xs font-mono">
                <span className="af-card-badge">{modal.model}</span>
                {modal.style && modal.style !== "None" && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70">
                    {modal.style}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70">
                  {modal.w} × {modal.h}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70">
                  Seed: {modal.seed}
                </span>
              </div>

              {/* Actions */}
              <div className="af-modal-actions">
                <button
                  type="button"
                  className="af-modal-action af-modal-primary"
                  onClick={() => download(modal.url, modal.seed)}
                >
                  ⬇️ Download Image
                </button>
                <button
                  type="button"
                  className="af-modal-action"
                  onClick={() => copyPromptText(modal.prompt)}
                >
                  📋 Copy Prompt
                </button>
                <button
                  type="button"
                  className="af-modal-action"
                  onClick={() => reuseImageSettings(modal)}
                >
                  🔄 Reuse in Studio
                </button>
                <button
                  type="button"
                  className="af-modal-action hover:text-red-400"
                  onClick={() => deleteImage(modal.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toasts */}
      <div className="af-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`af-toast ${t.type}`}>
            <span className="af-toast-icon">
              {t.type === "af-success"
                ? "✅"
                : t.type === "af-error"
                ? "⚠️"
                : "ℹ️"}
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
