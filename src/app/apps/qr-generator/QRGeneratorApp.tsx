"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  QrCode, Download, Share2, Sparkles, Loader2, Check,
  Wand2, Link, AlignLeft, Wifi, Mail, User, Upload, X,
  Image as ImageIcon, Sliders, Palette, Grid, RefreshCw,
} from "lucide-react";
import { QRCodeRenderer } from "./QRCodeRenderer";
import { LOGO_SVGS } from "./lib/logoPresets";
import {
  DEFAULT_CONFIG, parseIntent,
  type QRConfig, type QRType,
} from "./lib/types";

// ── Small shared UI helpers ──────────────────────────────────────────────────
const inputCls = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all";
const labelCls = "block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-1.5";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-quantum/40 peer-checked:border-quantum/60 border border-white/10 transition-all" />
      <div className="absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
    </label>
  );
}

function ColorSwatch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className={labelCls}>{label}</span>}
      <div className="h-9 w-full rounded-xl border border-white/10 overflow-hidden relative cursor-pointer">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-mono text-white/70 mix-blend-difference">
          {value}
        </div>
      </div>
    </label>
  );
}

function Pills<T extends string>({ options, value, onChange, className = "" }: {
  options: T[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={`flex bg-black/20 p-1 rounded-xl border border-white/8 ${className}`}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`flex-1 py-1.5 text-xs rounded-lg capitalize transition-all ${value === o ? "bg-quantum/25 text-quantum font-semibold" : "text-foreground/40 hover:text-foreground/70"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-xs font-mono text-foreground/40 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

// ── Content tabs ──────────────────────────────────────────────────────────────
const CONTENT_TABS: { id: QRType; icon: React.FC<{ size?: number }>; label: string }[] = [
  { id: "URL",   icon: Link,     label: "URL"   },
  { id: "TEXT",  icon: AlignLeft, label: "Text" },
  { id: "WIFI",  icon: Wifi,     label: "WiFi"  },
  { id: "EMAIL", icon: Mail,     label: "Email" },
  { id: "VCARD", icon: User,     label: "vCard" },
];

function ContentPanel({ config, update }: { config: QRConfig; update: (p: Partial<QRConfig>) => void }) {
  const type = config.type;
  const w = config.wifi;
  const e = config.email;
  const v = config.vCard;

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 glass rounded-2xl border border-white/8">
        {CONTENT_TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => update({ type: id })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
              type === id ? "bg-quantum/20 text-quantum border border-quantum/30 shadow-[0_0_12px_rgba(0,195,245,0.1)]"
                         : "text-foreground/40 hover:text-foreground/70"}`}>
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Fields */}
      {type === "URL" && (
        <div>
          <label className={labelCls}>Website URL</label>
          <input type="url" value={config.url} onChange={(e) => update({ url: e.target.value })}
            placeholder="https://example.com" className={inputCls} />
        </div>
      )}
      {type === "TEXT" && (
        <div>
          <label className={labelCls}>Content</label>
          <textarea rows={4} value={config.text} onChange={(e) => update({ text: e.target.value })}
            placeholder="Enter your text here..." className={`${inputCls} resize-none`} />
        </div>
      )}
      {type === "WIFI" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Network Name (SSID)</label>
            <input type="text" value={w.ssid} onChange={(e) => update({ wifi: { ...w, ssid: e.target.value } })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="text" value={w.password} onChange={(e) => update({ wifi: { ...w, password: e.target.value } })} className={inputCls} />
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className={labelCls}>Encryption</label>
              <select value={w.encryption} onChange={(e) => update({ wifi: { ...w, encryption: e.target.value as "WPA" | "WEP" | "nopass" } })} className={inputCls}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2.5 cursor-pointer text-sm text-foreground/50">
              <Toggle checked={w.hidden} onChange={(v) => update({ wifi: { ...w, hidden: v } })} />
              Hidden
            </label>
          </div>
        </div>
      )}
      {type === "EMAIL" && (
        <div className="space-y-4">
          <div><label className={labelCls}>Email Address</label><input type="email" value={e.address} onChange={(ev) => update({ email: { ...e, address: ev.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>Subject</label><input type="text" value={e.subject} onChange={(ev) => update({ email: { ...e, subject: ev.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>Body</label><textarea rows={3} value={e.body} onChange={(ev) => update({ email: { ...e, body: ev.target.value } })} className={`${inputCls} resize-none`} /></div>
        </div>
      )}
      {type === "VCARD" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>First Name</label><input type="text" value={v.firstName} onChange={(ev) => update({ vCard: { ...v, firstName: ev.target.value } })} className={inputCls} /></div>
            <div><label className={labelCls}>Last Name</label><input type="text" value={v.lastName} onChange={(ev) => update({ vCard: { ...v, lastName: ev.target.value } })} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Phone</label><input type="tel" value={v.phone} onChange={(ev) => update({ vCard: { ...v, phone: ev.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>Email</label><input type="email" value={v.email} onChange={(ev) => update({ vCard: { ...v, email: ev.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>Organisation</label><input type="text" value={v.organization} onChange={(ev) => update({ vCard: { ...v, organization: ev.target.value } })} className={inputCls} /></div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export function QRGeneratorApp() {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);
  const [magicInput, setMagicInput] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {};
    return () => handler();
  }, []);

  const update = useCallback((patch: Partial<QRConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleMagic = async () => {
    if (!magicInput.trim()) return;
    setMagicLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const { summary: _, ...patch } = parseIntent(magicInput);
    update(patch);
    setMagicInput("");
    setMagicLoading(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => update({ logo: reader.result as string, ecLevel: "H" });
    reader.readAsDataURL(file);
  };

  const handlePresetLogo = (svgString: string) => {
    const b64 = btoa(unescape(encodeURIComponent(svgString)));
    update({ logo: `data:image/svg+xml;base64,${b64}`, ecLevel: "H" });
  };

  const downloadQR = (format: "svg" | "png" | "jpeg") => {
    const svg = document.querySelector<SVGElement>("#omniqr-svg");
    if (!svg) return;
    const ser = new XMLSerializer();
    const svgStr = ser.serializeToString(svg);

    if (format === "svg") {
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `qrcode-${config.type.toLowerCase()}.svg`; a.click();
      URL.revokeObjectURL(a.href);
      setDownloaded(true); setTimeout(() => setDownloaded(false), 2000);
      return;
    }

    const img = new Image();
    const b64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
    img.onload = () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (format === "jpeg" && config.transparentBg) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qrcode-${config.type.toLowerCase()}.${format === "jpeg" ? "jpg" : format}`;
      a.href = canvas.toDataURL(`image/${format}`);
      a.click();
      setDownloaded(true); setTimeout(() => setDownloaded(false), 2000);
    };
    img.src = b64;
  };

  const shareQR = async () => {
    const svg = document.querySelector<SVGElement>("#omniqr-svg");
    if (!svg) return;
    setShared(false);
    const ser = new XMLSerializer();
    const b64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(ser.serializeToString(svg))));
    const img = new Image(); img.src = b64;
    await new Promise((r, j) => { img.onload = r; img.onerror = j; });
    const canvas = document.createElement("canvas");
    const scale = 4;
    canvas.width = img.width * scale; canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "qrcode.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "QR Code", files: [file] }).catch(() => {});
      } else {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]).catch(() => {});
      }
      setShared(true); setTimeout(() => setShared(false), 2500);
    }, "image/png");
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">

      {/* ── LEFT COLUMN ── */}
      <div className="lg:col-span-7 space-y-6">

        {/* Magic input */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 size={15} className="text-quantum animate-pulse" />
            <span className="text-sm font-semibold text-foreground/70">Smart detect</span>
            <span className="text-xs text-foreground/30 ml-auto">Paste a URL, email, WiFi info…</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={magicInput}
              onChange={(e) => setMagicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMagic()}
              placeholder='e.g. "WiFi: Starship password cosmos" or https://…'
              className={`${inputCls} flex-1`}
            />
            <button
              onClick={handleMagic}
              disabled={magicLoading || !magicInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold hover:bg-quantum/25 transition-all disabled:opacity-30"
            >
              {magicLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Auto
            </button>
          </div>
        </div>

        {/* Content */}
        <Section title="Content">
          <ContentPanel config={config} update={update} />
        </Section>

        {/* Colours + style in 2-col grid */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Colours */}
          <Section title={`Colours & gradient`}>
            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">Gradient</span>
              <Toggle checked={config.useGradient} onChange={(v) => update({ useGradient: v })} />
            </label>

            {config.useGradient ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ColorSwatch value={config.gradientStart} onChange={(v) => update({ gradientStart: v })} label="Start" />
                  <ColorSwatch value={config.gradientEnd}   onChange={(v) => update({ gradientEnd: v })}   label="End"   />
                </div>
                <div>
                  <label className={labelCls}>Direction</label>
                  <Pills options={["diagonal","vertical","horizontal"]} value={config.gradientDirection} onChange={(v) => update({ gradientDirection: v })} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <ColorSwatch value={config.fgColor} onChange={(v) => update({ fgColor: v })} label="Foreground" />
                <ColorSwatch value={config.bgColor} onChange={(v) => update({ bgColor: v })} label="Background" />
              </div>
            )}

            <ColorSwatch value={config.bgColor} onChange={(v) => update({ bgColor: v })} label="Background" />

            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">Transparent Bg</span>
              <Toggle checked={config.transparentBg} onChange={(v) => update({ transparentBg: v })} />
            </label>
          </Section>

          {/* Dots & Eyes */}
          <Section title="Dots & eyes">
            <div>
              <label className={labelCls}>Dot style</label>
              <div className="grid grid-cols-4 gap-1">
                {(["square","dot","rounded","diamond","star","classy","heart"] as const).map((s) => (
                  <button key={s} onClick={() => update({ pixelStyle: s })}
                    className={`py-1.5 text-[10px] rounded-lg capitalize border transition-all ${config.pixelStyle === s
                      ? "bg-quantum/20 border-quantum/40 text-quantum"
                      : "border-white/8 text-foreground/35 hover:border-white/15"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Eye frame</label>
                <div className="space-y-1">
                  {(["square","circle","rounded","extra-rounded"] as const).map((s) => (
                    <button key={s} onClick={() => update({ markerStyle: s })}
                      className={`w-full text-left px-2 py-1 text-[10px] rounded-md capitalize flex items-center justify-between transition-all ${config.markerStyle === s ? "bg-quantum/15 text-quantum" : "text-foreground/35 hover:bg-white/5"}`}>
                      {s} {config.markerStyle === s && <div className="w-1.5 h-1.5 rounded-full bg-quantum" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Eye centre</label>
                <div className="space-y-1">
                  {(["square","circle","rounded","diamond","star","heart"] as const).map((s) => (
                    <button key={s} onClick={() => update({ markerInnerShape: s })}
                      className={`w-full text-left px-2 py-1 text-[10px] rounded-md capitalize flex items-center justify-between transition-all ${config.markerInnerShape === s ? "bg-quantum/15 text-quantum" : "text-foreground/35 hover:bg-white/5"}`}>
                      {s} {config.markerInnerShape === s && <div className="w-1.5 h-1.5 rounded-full bg-quantum" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Eye colours</label>
              <div className="grid grid-cols-3 gap-2">
                <ColorSwatch value={config.markerBorderColor || config.fgColor} onChange={(v) => update({ markerBorderColor: v })} label="Frame" />
                <ColorSwatch value={config.markerCenterColor || config.fgColor} onChange={(v) => update({ markerCenterColor: v })} label="Centre" />
                <button onClick={() => update({ markerBorderColor: undefined, markerCenterColor: undefined })}
                  className="mt-5 h-9 px-2 text-[10px] border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-foreground/40 transition-colors flex items-center justify-center gap-1">
                  <RefreshCw size={10} /> Reset
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Frame + Fine tuning */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Section title="Frame">
            <div className="grid grid-cols-3 gap-1.5">
              {(["none","simple","rounded","bracket","banner-bottom","banner-top","polaroid"] as const).map((f) => (
                <button key={f} onClick={() => update({ frameStyle: f })}
                  className={`py-2 text-[10px] rounded-lg border capitalize transition-all ${config.frameStyle === f ? "bg-quantum/15 border-quantum/30 text-quantum" : "border-white/8 text-foreground/30 hover:border-white/15"}`}>
                  {f === "none" ? "None" : f === "banner-bottom" ? "Btm banner" : f === "banner-top" ? "Top banner" : f}
                </button>
              ))}
            </div>
            {config.frameStyle !== "none" && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                {["banner-bottom","banner-top","polaroid"].includes(config.frameStyle) && (
                  <div>
                    <label className={labelCls}>Label text</label>
                    <input type="text" value={config.frameText} onChange={(e) => update({ frameText: e.target.value })} className={inputCls} placeholder="SCAN ME" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <ColorSwatch value={config.frameColor} onChange={(v) => update({ frameColor: v })} label="Frame colour" />
                  {["banner-bottom","banner-top","polaroid"].includes(config.frameStyle) && (
                    <ColorSwatch value={config.frameTextColor} onChange={(v) => update({ frameTextColor: v })} label="Text colour" />
                  )}
                </div>
              </div>
            )}
          </Section>

          <Section title="Fine tuning">
            <div>
              <div className="flex justify-between mb-1">
                <label className={labelCls}>Margin</label>
                <span className="text-[10px] font-mono text-foreground/30">{config.margin} modules</span>
              </div>
              <input type="range" min={0} max={10} value={config.margin}
                onChange={(e) => update({ margin: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer" />
            </div>

            <div>
              <label className={labelCls}>Error correction</label>
              <div className="grid grid-cols-4 gap-1">
                {(["L","M","Q","H"] as const).map((lvl) => (
                  <button key={lvl} onClick={() => update({ ecLevel: lvl })}
                    className={`py-2 text-xs rounded-lg font-mono font-bold border transition-all ${config.ecLevel === lvl ? "bg-olive/20 border-olive/40 text-olive-300" : "border-white/8 text-foreground/30 hover:border-white/15"}`}>
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-foreground/25 mt-1">Higher = more data density but larger QR.</p>
            </div>
          </Section>
        </div>

        {/* Logo */}
        <Section title="Logo overlay">
          {!config.logo ? (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-24 border border-white/10 border-dashed rounded-2xl cursor-pointer hover:bg-white/5 hover:border-quantum/30 transition-all">
                <Upload size={20} className="text-foreground/30 mb-1.5" />
                <p className="text-xs text-foreground/30">Upload custom logo</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
              <div>
                <label className={labelCls}>Quick presets</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {Object.entries(LOGO_SVGS).map(([name, svg]) => (
                    <button key={name} onClick={() => handlePresetLogo(svg)} title={name}
                      className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 transition-all flex items-center justify-center">
                      <div className="w-5 h-5 opacity-70 hover:opacity-100"
                        dangerouslySetInnerHTML={{ __html: svg }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.logo} alt="logo" className="h-10 w-10 object-contain" />
                  <span className="text-xs text-foreground/40">Custom logo active (EC: H)</span>
                </div>
                <button onClick={() => update({ logo: undefined })}
                  className="flex items-center gap-1 text-xs text-crimson/70 hover:text-crimson bg-crimson/10 px-2 py-1 rounded-lg transition-colors">
                  <X size={11} /> Remove
                </button>
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className={labelCls}>Logo size</label><span className="text-[10px] font-mono text-foreground/30">{Math.round((config.logoSize)*100)}%</span></div>
                <input type="range" min="0.1" max="0.4" step="0.01" value={config.logoSize}
                  onChange={(e) => update({ logoSize: parseFloat(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><label className={labelCls}>Logo padding</label><span className="text-[10px] font-mono text-foreground/30">{config.logoPadding} mod</span></div>
                <input type="range" min="0" max="4" step="1" value={config.logoPadding}
                  onChange={(e) => update({ logoPadding: parseInt(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
              </div>
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground/50">White background box</span>
                <Toggle checked={!!config.logoBackgroundColor}
                  onChange={(v) => update({ logoBackgroundColor: v ? "#ffffff" : undefined })} />
              </label>
            </div>
          )}
        </Section>
      </div>

      {/* ── RIGHT COLUMN: Preview ── */}
      <div className="lg:col-span-5">
        <div className="sticky top-20 space-y-4">
          <div ref={previewRef} className="glass-card p-6 flex flex-col items-center gap-4">
            <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest self-start">Preview</h3>
            <div className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]">
              <QRCodeRenderer config={config} size={300} />
            </div>
            <p className="text-[10px] font-mono text-foreground/25">
              {config.type} · EC:{config.ecLevel} · margin:{config.margin}
            </p>
          </div>

          {/* Download buttons */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Export</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["svg","png","jpeg"] as const).map((fmt) => (
                <button key={fmt} onClick={() => downloadQR(fmt)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8 bg-white/4 hover:border-quantum/30 hover:bg-quantum/8 transition-all group">
                  <Download size={14} className="text-foreground/30 group-hover:text-quantum transition-colors" />
                  <span className="text-[10px] font-mono text-foreground/40 group-hover:text-quantum uppercase">{fmt}</span>
                </button>
              ))}
            </div>
            <button onClick={shareQR}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                shared
                  ? "border-olive/30 bg-olive/10 text-olive-300"
                  : "border-white/10 bg-white/5 text-foreground/50 hover:border-quantum/30 hover:bg-quantum/10 hover:text-quantum"}`}>
              {shared ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share / Copy image</>}
            </button>
          </div>

          <p className="text-center text-[10px] font-mono text-foreground/15">
            All processing is local — nothing is uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}
