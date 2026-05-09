"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, ArrowUpDown, Tag, Cpu,
  Play, Pause, Volume2, VolumeX, Music, Calendar,
  Sparkles, SkipBack, SkipForward, ChevronDown, ChevronUp,
  Copy, Check,
} from "lucide-react";
import { MUSIC_TRACKS, type MusicTrack } from "./data";

const ALL_TAGS = [...new Set(MUSIC_TRACKS.flatMap((t) => t.tags))].sort();
const ALL_MODELS = [...new Set(MUSIC_TRACKS.map((t) => t.model))].sort();
type SortOrder = "newest" | "oldest";

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function TrackCard({ track, index, isPlaying, isActive, onPlay, onExpand, expanded }: {
  track: MusicTrack; index: number; isPlaying: boolean; isActive: boolean;
  onPlay: () => void; onExpand: () => void; expanded: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copyPrompt = useCallback(() => {
    if (track.prompt) { navigator.clipboard.writeText(track.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }, [track.prompt]);

  const metaFields: { label: string; value: string }[] = [];
  if (track.seed) metaFields.push({ label: "Seed", value: track.seed });
  if (track.temperature != null) metaFields.push({ label: "Temperature", value: String(track.temperature) });
  if (track.style) metaFields.push({ label: "Style", value: track.style });
  if (track.duration) metaFields.push({ label: "Duration", value: track.duration });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`glass-card border transition-all duration-300 overflow-hidden ${isActive ? "border-crimson/40 shadow-[0_0_30px_rgba(220,20,60,0.12)]" : "border-white/8 hover:border-crimson/25"}`}>
      <div className="flex items-start gap-4 p-5">
        <button onClick={onPlay} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 group">
          <Image src={track.thumbnail} alt={track.title} fill className="object-cover" sizes="80px" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying && isActive ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
          </div>
          {isPlaying && isActive && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px]">
              {[1,2,3,4].map((i) => <div key={i} className="w-[3px] bg-crimson rounded-full" style={{ height: `${6+Math.random()*10}px`, animation: `wave ${0.4+i*0.1}s ease-in-out infinite alternate` }} />)}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm leading-snug">{track.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-foreground/40">
                <span className="flex items-center gap-1 font-mono"><Cpu size={10} />{track.model}</span>
                <span className="flex items-center gap-1 font-mono"><Calendar size={10} />{new Date(track.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
                {track.duration && <span className="font-mono">{track.duration}</span>}
              </div>
            </div>
            <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/30 hover:text-foreground/60 transition-all flex-shrink-0">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          {track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {track.tags.map((tag) => <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-crimson/10 text-crimson border border-crimson/20">{tag}</span>)}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {track.description && (<div><div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-1">Description</div><p className="text-sm text-foreground/55 leading-relaxed">{track.description}</p></div>)}
              {track.prompt && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10} />Prompt</div>
                    <button onClick={copyPrompt} className="flex items-center gap-1 text-[10px] font-mono text-foreground/30 hover:text-crimson transition-colors">
                      {copied ? <Check size={10} /> : <Copy size={10} />}{copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5"><p className="text-xs font-mono text-foreground/45 leading-relaxed whitespace-pre-wrap">{track.prompt}</p></div>
                </div>
              )}
              {metaFields.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2">Generation Parameters</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {metaFields.map(({label,value}) => <div key={label} className="p-2 rounded-lg bg-black/15 border border-white/5"><div className="text-[9px] font-mono text-foreground/25 uppercase">{label}</div><div className="text-xs font-mono text-foreground/55 mt-0.5">{value}</div></div>)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AiMusicClient() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTrack = MUSIC_TRACKS.find((t) => t.id === activeTrackId) || null;

  const playTrack = useCallback((track: MusicTrack) => {
    if (activeTrackId === track.id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
      else { audioRef.current?.play(); setIsPlaying(true); }
    } else { setActiveTrackId(track.id); setIsPlaying(true); setCurrentTime(0); }
  }, [activeTrackId, isPlaying]);

  useEffect(() => {
    if (!activeTrack) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = activeTrack.audioSrc;
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => setIsPlaying(false));
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoad = () => setDuration(audio.duration);
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("loadedmetadata", onLoad); audio.removeEventListener("ended", onEnd); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrackId]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = muted ? 0 : volume; }, [volume, muted]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value); setCurrentTime(t); if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const skipPrev = useCallback(() => { const idx = MUSIC_TRACKS.findIndex((t) => t.id === activeTrackId); if (idx > 0) { setActiveTrackId(MUSIC_TRACKS[idx-1].id); setIsPlaying(true); } }, [activeTrackId]);
  const skipNext = useCallback(() => { const idx = MUSIC_TRACKS.findIndex((t) => t.id === activeTrackId); if (idx < MUSIC_TRACKS.length-1) { setActiveTrackId(MUSIC_TRACKS[idx+1].id); setIsPlaying(true); } }, [activeTrackId]);

  const toggleTag = useCallback((tag: string) => { setSelectedTags((prev) => { const next = new Set(prev); if (next.has(tag)) next.delete(tag); else next.add(tag); return next; }); }, []);
  const clearFilters = useCallback(() => { setSearch(""); setSelectedTags(new Set()); setSelectedModel(null); }, []);

  const filtered = useMemo(() => {
    let tracks = [...MUSIC_TRACKS];
    if (search) { const q = search.toLowerCase(); tracks = tracks.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)) || t.prompt?.toLowerCase().includes(q) || t.model.toLowerCase().includes(q)); }
    if (selectedTags.size > 0) tracks = tracks.filter((t) => [...selectedTags].every((tag) => t.tags.includes(tag)));
    if (selectedModel) tracks = tracks.filter((t) => t.model === selectedModel);
    tracks.sort((a, b) => { const da = new Date(a.date).getTime(), db = new Date(b.date).getTime(); return sort === "newest" ? db - da : da - db; });
    return tracks;
  }, [search, selectedTags, selectedModel, sort]);

  const hasFilters = search || selectedTags.size > 0 || selectedModel;

  return (
    <div className="min-h-screen keffiyeh-bg">
      <audio ref={audioRef} preload="metadata" />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-crimson/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-quantum/4 blur-[100px]" />
      </div>
      <div className="section-container py-16 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10">
          <div className="text-xs font-mono text-crimson/55 tracking-widest uppercase mb-3">// Art / AI Music Generations</div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4"><span className="gradient-text-quantum">AI Music</span></h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">Listen to AI-composed music tracks. Expand any track for full generation details — prompt, model, and parameters.</p>
          <div className="flex items-center gap-4 mt-5 text-sm text-foreground/40">
            <div className="flex items-center gap-2"><Music size={13} className="text-crimson/50" /><span className="text-foreground/70 font-semibold">{MUSIC_TRACKS.length}</span> tracks</div>
            <div className="flex items-center gap-2"><Cpu size={13} className="text-olive/50" /><span className="text-foreground/70 font-semibold">{ALL_MODELS.length}</span> models</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
              <input type="text" placeholder="Search tracks, tags, prompts…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-crimson/40 transition-all" />
            </div>
            <button onClick={() => setSort((s) => s === "newest" ? "oldest" : "newest")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/8 text-sm text-foreground/60 hover:text-foreground hover:border-crimson/30 transition-all">
              <ArrowUpDown size={14} />{sort === "newest" ? "Newest First" : "Oldest First"}
            </button>
            <button onClick={() => setShowFilters((v) => !v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl glass border text-sm transition-all ${showFilters || hasFilters ? "border-crimson/30 text-crimson bg-crimson/5" : "border-white/8 text-foreground/60 hover:text-foreground"}`}>
              <SlidersHorizontal size={14} />Filters{hasFilters && <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />}
            </button>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="glass-card border border-white/8 p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1"><Tag size={10} />Tags</div>
                    <div className="flex flex-wrap gap-1.5">{ALL_TAGS.map((tag) => <button key={tag} onClick={() => toggleTag(tag)} className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${selectedTags.has(tag) ? "bg-crimson/15 text-crimson border-crimson/30" : "border-white/8 text-foreground/35 hover:border-white/20"}`}>{tag}</button>)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1"><Cpu size={10} />Model</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setSelectedModel(null)} className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${!selectedModel ? "bg-crimson/15 text-crimson border-crimson/30" : "border-white/8 text-foreground/35 hover:border-white/20"}`}>All</button>
                      {ALL_MODELS.map((model) => <button key={model} onClick={() => setSelectedModel(selectedModel === model ? null : model)} className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${selectedModel === model ? "bg-crimson/15 text-crimson border-crimson/30" : "border-white/8 text-foreground/35 hover:border-white/20"}`}>{model}</button>)}
                    </div>
                  </div>
                  {hasFilters && <button onClick={clearFilters} className="text-xs font-mono text-foreground/30 hover:text-crimson transition-colors">Clear all filters ×</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="text-xs font-mono text-foreground/30">Showing {filtered.length} of {MUSIC_TRACKS.length} tracks</div>
        </motion.div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 text-foreground/25 font-mono">
              <Music size={40} className="mx-auto mb-4 opacity-30" /><p>No tracks match your filters.</p>
              <button onClick={clearFilters} className="text-xs text-crimson/60 hover:text-crimson mt-2 underline">Clear filters</button>
            </motion.div>
          ) : (
            <motion.div key={`list-${sort}-${selectedModel}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {filtered.map((track, i) => <TrackCard key={track.id} track={track} index={i} isPlaying={isPlaying} isActive={activeTrackId === track.id} onPlay={() => playTrack(track)} onExpand={() => setExpandedId(expandedId === track.id ? null : track.id)} expanded={expandedId === track.id} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky player bar */}
      <AnimatePresence>
        {activeTrack && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/10">
            <div className="section-container py-3">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"><Image src={activeTrack.thumbnail} alt={activeTrack.title} fill className="object-cover" sizes="48px" /></div>
                <div className="hidden sm:block min-w-0 flex-shrink-0 w-40"><div className="text-sm font-semibold truncate">{activeTrack.title}</div><div className="text-[10px] font-mono text-foreground/40 truncate">{activeTrack.model}</div></div>
                <div className="flex items-center gap-2">
                  <button onClick={skipPrev} className="p-2 rounded-lg text-foreground/40 hover:text-foreground transition-colors"><SkipBack size={16} /></button>
                  <button onClick={() => playTrack(activeTrack)} className="w-10 h-10 rounded-full bg-crimson/20 text-crimson flex items-center justify-center hover:bg-crimson/30 transition-all">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={skipNext} className="p-2 rounded-lg text-foreground/40 hover:text-foreground transition-colors"><SkipForward size={16} /></button>
                </div>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-foreground/30 flex-shrink-0 w-8 text-right">{formatTime(currentTime)}</span>
                  <input type="range" min={0} max={duration || 0} value={currentTime} onChange={seek} className="flex-1 h-1 accent-crimson cursor-pointer"
                    style={{ background: `linear-gradient(to right, #dc143c ${duration ? (currentTime/duration)*100 : 0}%, rgba(255,255,255,0.1) ${duration ? (currentTime/duration)*100 : 0}%)` }} />
                  <span className="text-[10px] font-mono text-foreground/30 flex-shrink-0 w-8">{formatTime(duration)}</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => setMuted((m) => !m)} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground transition-colors">{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }} className="w-20 h-1 accent-crimson cursor-pointer" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
