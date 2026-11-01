"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  Search,
  Download,
  Layers,
  ChevronDown,
  Flame,
  Globe2,
  Wind,
  Droplets,
  Scissors,
  Share2,
  AlignRight,
  BarChart3,
  Palette,
  Edit3,
} from "lucide-react";
import {
  calculateJummal,
  stripTashkeel,
  generateCanonicalLettersForNumber,
  PRESET_PHRASES,
  ARABIC_LETTERS_MAP,
  DEFAULT_JUMMAL_OPTIONS,
  JummalOptions,
  LetterElement,
  AbjadTier,
  tafqeet,
} from "./lib/jummalEngine";

/* ─── Element Styling Configuration ───────────────────────────────────────── */
const ELEMENT_CONFIG: Record<
  LetterElement,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    sublabel: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  ناري: {
    icon: Flame,
    label: "نارية",
    sublabel: "أ، هـ، ط، م، ف، ش، ذ",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  ترابي: {
    icon: Globe2,
    label: "ترابية",
    sublabel: "ب، و، ي، ن، ص، ت، ض",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  هوائي: {
    icon: Wind,
    label: "هوائية",
    sublabel: "ج، ز، ك، س، ق، ث، ظ",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
  },
  مائي: {
    icon: Droplets,
    label: "مائية",
    sublabel: "د، ح، ل، ع، ر، خ، غ",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
};

const TIER_CONFIG: Record<AbjadTier, { label: string; range: string; color: string }> = {
  آحاد: { label: "الآحاد", range: "1 – 9", color: "text-quantum" },
  عشرات: { label: "العشرات", range: "10 – 90", color: "text-olive-400" },
  مئات: { label: "المئات", range: "100 – 900", color: "text-amber-400" },
  ألوف: { label: "الألوف", range: "1000", color: "text-crimson" },
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
export function HisabJummalApp() {
  const [text, setText] = useState<string>("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
  const [options, setOptions] = useState<JummalOptions>(DEFAULT_JUMMAL_OPTIONS);
  const [showSettings, setShowSettings] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [viewColorTokens, setViewColorTokens] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "breakdown" | "words" | "lines" | "frequency" | "elements" | "comparison" | "reverse" | "table"
  >("breakdown");

  // Comparison Tab State
  const [compareText1, setCompareText1] = useState("القدس");
  const [compareText2, setCompareText2] = useState("فلسطين");

  // Reverse Lookup / Chronogram Solver State
  const [reverseTarget, setReverseTarget] = useState<number>(1447);
  const [chronogramHemistich, setChronogramHemistich] = useState("دام في عز ونصر");

  // Selected letter modal or focused letter
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Copy feedback states
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Filter for Abjad reference table
  const [tableSearch, setTableSearch] = useState("");
  const [tableTierFilter, setTableTierFilter] = useState<string>("ALL");

  // Main Calculation Result
  const result = useMemo(() => {
    return calculateJummal(text, options);
  }, [text, options]);

  // Comparison Results
  const comp1Result = useMemo(
    () => calculateJummal(compareText1, options),
    [compareText1, options]
  );
  const comp2Result = useMemo(
    () => calculateJummal(compareText2, options),
    [compareText2, options]
  );

  // Reverse Lookup Result
  const reverseResult = useMemo(() => {
    return generateCanonicalLettersForNumber(reverseTarget, options.system);
  }, [reverseTarget, options.system]);

  // Chronogram Hemistich Result
  const chronoResult = useMemo(() => {
    return calculateJummal(chronogramHemistich, options);
  }, [chronogramHemistich, options]);

  // Filtered Table Letters
  const filteredLetters = useMemo(() => {
    const list = Object.values(ARABIC_LETTERS_MAP);
    return list.filter((m) => {
      const matchSearch =
        !tableSearch ||
        m.char.includes(tableSearch) ||
        m.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        m.nameArabic.includes(tableSearch) ||
        String(options.system === "maghrebi" ? m.maghrebiValue : m.mashriqiValue).includes(
          tableSearch
        );
      const matchTier = tableTierFilter === "ALL" || m.tier === tableTierFilter;
      return matchSearch && matchTier;
    });
  }, [tableSearch, tableTierFilter, options.system]);

  // Handlers
  const handleCopy = (value: string | number, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStripDiacritics = () => {
    setText((prev) => stripTashkeel(prev));
  };

  const handleAppendChar = (c: string) => {
    setText((prev) => prev + c);
  };

  const handleExportJSON = () => {
    const payload = {
      text,
      options,
      results: {
        totalKabir: result.totalKabir,
        totalKabirWritten: tafqeet(result.totalKabir),
        totalSaghir: result.totalSaghir,
        digitalRoot: result.digitalRoot,
        totalLafzi: result.totalLafzi,
        stats: result.stats,
      },
      words: result.words.map((w) => ({
        word: w.word,
        clean: w.cleanWord,
        value: w.value,
        percentage: w.percentage,
        letters: w.characters.map((c) => ({
          char: c.original,
          value: c.value,
          element: c.element,
        })),
      })),
      lines: result.lines,
      letterFrequencies: result.letterFrequencies,
      timestamp: new Date().toISOString(),
      tool: "Hisab Al-Jummal (حساب الجُمَّل) by Rashad Hamidi",
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jummal-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyFullReport = () => {
    const lines: string[] = [
      `📜 تقرير حساب الجُمَّل (Hisab Al-Jummal Report)`,
      `──────────────────────────────`,
      `النص: "${result.text}"`,
      `النظام الأبجدي: ${options.system === "mashriqi" ? "المشرقي (المعياري)" : "المغربي"}`,
      ``,
      `✨ النتائج الحسابية:`,
      `• الجُمَّل الكبير: ${result.totalKabir.toLocaleString()} (${tafqeet(result.totalKabir)})`,
      `• الجُمَّل الصغير: ${result.totalSaghir}`,
      `• الجذر الرقمي: ${result.digitalRoot}`,
      `• الجُمَّل اللفظي (بسط الحروف): ${result.totalLafzi.toLocaleString()}`,
      ``,
      `📊 إحصاءات النص:`,
      `• عدد الحروف الخالصة: ${result.stats.pureLettersCount}`,
      `• عدد الكلمات: ${result.stats.wordsCount}`,
      `• عدد الأسطر/الأبيات: ${result.stats.linesCount}`,
      `• الحركات المفلترة: ${result.stats.diacriticsCount}`,
      ``,
      `🔤 تفصيل الكلمات:`,
      ...result.words.map(
        (w, i) =>
          `${i + 1}. [${w.word}]: ${w.value} (${w.percentage}%) = ${w.characters.map((c) => `${c.original}(${c.value})`).join(" + ")}`
      ),
      ``,
      `تم الحساب عبر موقع رشاد حميدي (Rashad Hamidi)`,
    ];
    handleCopy(lines.join("\n"), setCopiedReport);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* ── Main Input Card ────────────────────────────────────────────────── */}
      <div className="glass-card p-5 sm:p-7 border border-white/8 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-quantum/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-quantum animate-pulse" />
            <span>النص المراد حسابه (Arabic Text or Verse):</span>
          </label>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 relative">
            {/* Quick Presets Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  showPresetsMenu
                    ? "bg-quantum/20 text-quantum border-quantum/40 font-medium"
                    : "bg-white/5 hover:bg-white/10 text-foreground/70 border-white/8"
                }`}
                title="اختر مثالاً سريعاً"
              >
                <Sparkles size={12} className="text-quantum" />
                <span>أمثلة سريعة</span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${showPresetsMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showPresetsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 sm:w-80 p-2 rounded-xl bg-cosmos-900/95 backdrop-blur-xl border border-white/15 shadow-2xl z-50 space-y-1"
                  >
                    <div className="text-[10px] font-mono text-foreground/45 px-2 py-1 border-b border-white/6 mb-1">
                      نماذج مختارة للتحليل الفوري:
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {PRESET_PHRASES.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => {
                            setText(preset.text);
                            setShowPresetsMenu(false);
                          }}
                          className="w-full text-right p-2 rounded-lg hover:bg-white/8 transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-1">
                            <div className="text-xs font-semibold text-foreground/90 group-hover:text-quantum transition-colors truncate font-serif">
                              {preset.title}
                            </div>
                            <div className="text-[11px] text-foreground/45 truncate font-serif">
                              {preset.text}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-quantum/80 px-1.5 py-0.5 rounded bg-quantum/10 font-bold">
                            {preset.expectedKabirMashriqi}
                          </span>
                        </button>
                      ))}
                      {/* Extra Poetry Preset */}
                      <button
                        onClick={() => {
                          setText("إذا الشَّعْبُ يَوْمَاً أرَادَ الْحَيَاةَ *** فَلا بُدَّ أنْ يَسْتَجِيبَ الْقَدَر");
                          setShowPresetsMenu(false);
                        }}
                        className="w-full text-right p-2 rounded-lg hover:bg-white/8 transition-colors flex items-center justify-between group border-t border-white/6 pt-2"
                      >
                        <div className="min-w-0 pr-1">
                          <div className="text-xs font-semibold text-foreground/90 group-hover:text-quantum transition-colors truncate font-serif">
                            بيت شعر (الشابي)
                          </div>
                          <div className="text-[11px] text-foreground/45 truncate font-serif">
                            إذا الشعب يوماً أراد الحياة...
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-olive-400 px-1.5 py-0.5 rounded bg-olive/10 font-bold">
                          شعر
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Colorized Tokens Toggle */}
            <button
              onClick={() => setViewColorTokens(!viewColorTokens)}
              title="معاينة الحروف ملونة بحسب الطبائع الأربعة"
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                viewColorTokens
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium"
                  : "bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground/90 border border-white/8"
              }`}
            >
              {viewColorTokens ? <Edit3 size={12} /> : <Palette size={12} />}
              <span>{viewColorTokens ? "محرر النص" : "تلوين الطبائع"}</span>
            </button>

            <button
              onClick={handleStripDiacritics}
              title="إزالة جميع الحركات والتنوين والشدات"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground/90 border border-white/8 transition-all"
            >
              <Scissors size={12} />
              <span>إزالة التشكيل</span>
            </button>

            <button
              onClick={() => handleCopy(text, setCopiedText)}
              title="نسخ النص الحالي"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground/90 border border-white/8 transition-all"
            >
              {copiedText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedText ? "تم النسخ" : "نسخ النص"}</span>
            </button>

            <button
              onClick={() => setText("")}
              title="مسح حقل الإدخال"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-crimson/15 text-foreground/60 hover:text-crimson border border-white/8 transition-all"
            >
              <RotateCcw size={12} />
              <span>تفريغ</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                showSettings
                  ? "bg-olive/20 text-olive-300 border-olive/40 font-medium"
                  : "bg-white/5 hover:bg-white/10 text-foreground/70 border-white/10"
              }`}
            >
              <Sliders size={13} />
              <span>خيارات الحساب</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-300 ${showSettings ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Textarea or Colorized Tokens Preview */}
        {viewColorTokens ? (
          <div className="w-full min-h-[110px] bg-black/50 border border-amber-500/30 rounded-xl p-4 text-xl sm:text-2xl leading-loose font-serif flex flex-wrap gap-1.5 items-center">
            {result.characters.map((ch, idx) => {
              if (!ch.isArabicLetter) {
                return (
                  <span key={idx} className="text-foreground/30 px-0.5">
                    {ch.original}
                  </span>
                );
              }
              const conf = ch.element ? ELEMENT_CONFIG[ch.element] : null;
              return (
                <span
                  key={idx}
                  title={`${ch.original} (${ch.value}) · ${conf?.label || ""}`}
                  className={`inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded-md border text-lg sm:text-xl font-bold cursor-default transition-transform hover:scale-110 ${
                    conf ? `${conf.bg} ${conf.color} ${conf.border}` : "bg-white/5 text-foreground border-white/10"
                  }`}
                >
                  <span>{ch.original}</span>
                  <span className="text-[9px] font-mono leading-none opacity-70">
                    {ch.value}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              dir="rtl"
              placeholder="اكتب هنا أي نص، كلمة، آية، أو بيت شعر لحساب قيمته فورياً..."
              className="w-full bg-black/40 border border-white/10 focus:border-quantum/50 focus:ring-1 focus:ring-quantum/30 rounded-xl p-4 text-xl sm:text-2xl text-foreground font-serif leading-relaxed placeholder:text-foreground/25 transition-all outline-none resize-y"
              style={{
                fontFamily:
                  "var(--font-playfair), 'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Cairo', serif",
              }}
            />
          </div>
        )}

        {/* Live Text Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-white/6 text-xs text-foreground/45 font-mono">
          <div className="flex flex-wrap gap-4">
            <span>
              الحروف الخالصة:{" "}
              <strong className="text-foreground/80">{result.stats.pureLettersCount}</strong>
            </span>
            <span>
              الكلمات:{" "}
              <strong className="text-foreground/80">{result.stats.wordsCount}</strong>
            </span>
            {result.stats.linesCount > 1 && (
              <span>
                الأسطر/الأبيات:{" "}
                <strong className="text-foreground/80">{result.stats.linesCount}</strong>
              </span>
            )}
            <span>
              الحركات المفلترة:{" "}
              <strong className="text-foreground/80">{result.stats.diacriticsCount}</strong>
            </span>
            {result.stats.shaddahCount > 0 && (
              <span>
                الشدّات:{" "}
                <strong className="text-foreground/80">{result.stats.shaddahCount}</strong>
              </span>
            )}
          </div>
          <div className="text-[11px] text-quantum/70">
            {options.system === "mashriqi" ? "الأبجدية المشرقية القياسية" : "الأبجدية المغربية"}
          </div>
        </div>

        {/* ── Calculation Settings Drawer ─────────────────────────────────── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10 space-y-4"
            >
              <div className="text-xs font-semibold text-olive-400 flex items-center gap-1.5">
                <Sliders size={13} />
                <span>إعدادات وقواعد حساب الجُمَّل (Calculation Rules & Conventions):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Abjad System */}
                <div className="bg-white/3 p-3 rounded-xl border border-white/6 space-y-2">
                  <div className="font-semibold text-foreground/80">
                    الترتيب الأبجدي (System)
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="system"
                        checked={options.system === "mashriqi"}
                        onChange={() => setOptions({ ...options, system: "mashriqi" })}
                        className="text-quantum"
                      />
                      <span>المشرقي (س=60، ص=90، ش=300، ض=800)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="system"
                        checked={options.system === "maghrebi"}
                        onChange={() => setOptions({ ...options, system: "maghrebi" })}
                        className="text-quantum"
                      />
                      <span>المغربي (ص=60، ض=90، س=300، ش=1000)</span>
                    </label>
                  </div>
                </div>

                {/* 2. Taa Marbuta */}
                <div className="bg-white/3 p-3 rounded-xl border border-white/6 space-y-2">
                  <div className="font-semibold text-foreground/80">
                    التاء المربوطة (ة)
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taaMarbuta"
                        checked={options.taaMarbuta === 5}
                        onChange={() => setOptions({ ...options, taaMarbuta: 5 })}
                        className="text-quantum"
                      />
                      <span>5 (كالهاء - الأصل عند الوقف)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taaMarbuta"
                        checked={options.taaMarbuta === 400}
                        onChange={() => setOptions({ ...options, taaMarbuta: 400 })}
                        className="text-quantum"
                      />
                      <span>400 (كالتاء المفتوحة)</span>
                    </label>
                  </div>
                </div>

                {/* 3. Alif Maqsura */}
                <div className="bg-white/3 p-3 rounded-xl border border-white/6 space-y-2">
                  <div className="font-semibold text-foreground/80">
                    الألف المقصورة (ى)
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="alifMaqsura"
                        checked={options.alifMaqsura === 10}
                        onChange={() => setOptions({ ...options, alifMaqsura: 10 })}
                        className="text-quantum"
                      />
                      <span>10 (كالياء - رسماً)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="alifMaqsura"
                        checked={options.alifMaqsura === 1}
                        onChange={() => setOptions({ ...options, alifMaqsura: 1 })}
                        className="text-quantum"
                      />
                      <span>1 (كالألف - صوتاً)</span>
                    </label>
                  </div>
                </div>

                {/* 4. Shaddah */}
                <div className="bg-white/3 p-3 rounded-xl border border-white/6 space-y-2">
                  <div className="font-semibold text-foreground/80">
                    الحرف المشدّد (ّ)
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="shaddah"
                        checked={!options.shaddahDoubled}
                        onChange={() => setOptions({ ...options, shaddahDoubled: false })}
                        className="text-quantum"
                      />
                      <span>حرف واحد (الرسم الإملائي - الأصل)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="shaddah"
                        checked={options.shaddahDoubled}
                        onChange={() => setOptions({ ...options, shaddahDoubled: true })}
                        className="text-quantum"
                      />
                      <span>حرفان (التضعيف واللفظ العروضي)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOptions(DEFAULT_JUMMAL_OPTIONS)}
                  className="text-xs text-foreground/40 hover:text-foreground/80 flex items-center gap-1 underline underline-offset-4"
                >
                  <RotateCcw size={11} />
                  <span>استعادة الإعدادات الافتراضية القياسية</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Virtual Abjad Ribbon (Quick Insert) ─────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-white/6">
          <div className="text-[11px] text-foreground/40 mb-2 flex items-center justify-between">
            <span>لوحة الحروف الأبجدية للإدراج السريع (Quick Letter Bar):</span>
            <span className="font-mono text-[10px]">انقر على أي حرف لإضافته</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.values(ARABIC_LETTERS_MAP).map((m) => {
              const val = options.system === "maghrebi" ? m.maghrebiValue : m.mashriqiValue;
              return (
                <button
                  key={m.char}
                  onClick={() => handleAppendChar(m.char)}
                  title={`${m.nameArabic} = ${val}`}
                  className="flex flex-col items-center justify-center w-8 h-10 rounded-lg bg-white/4 hover:bg-quantum/20 hover:border-quantum/40 border border-white/6 text-foreground/80 hover:text-quantum transition-all duration-150 group"
                >
                  <span className="text-sm font-serif font-bold group-hover:scale-110 transition-transform">
                    {m.char}
                  </span>
                  <span className="text-[9px] font-mono text-foreground/40 group-hover:text-quantum/80">
                    {val}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Primary Results Showcase ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Hero Card: Total Jummal Kabir (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-8 border border-quantum/30 relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-quantum/10 via-black/40 to-olive/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-quantum/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-quantum/20 border border-quantum/40 text-quantum text-[11px] font-mono font-semibold uppercase tracking-wider">
                  المجموع الكلي القياسي
                </span>
                <span className="text-xs text-foreground/45 font-mono">
                  Al-Jummal Al-Kabir
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(result.totalKabir, setCopiedMain)}
                  title="نسخ الرقم"
                  className="p-2 rounded-lg bg-white/5 hover:bg-quantum/20 text-foreground/60 hover:text-quantum border border-white/10 transition-all"
                >
                  {copiedMain ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <button
                  onClick={handleCopyFullReport}
                  title="نسخ تقرير التحليل كاملاً"
                  className="p-2 rounded-lg bg-white/5 hover:bg-quantum/20 text-foreground/60 hover:text-quantum border border-white/10 transition-all"
                >
                  {copiedReport ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Share2 size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Giant Glowing Number */}
            <div className="my-4">
              <div className="text-6xl sm:text-7xl lg:text-8xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,195,245,0.4)]">
                {result.totalKabir.toLocaleString()}
              </div>
              <div className="text-base sm:text-lg font-serif text-quantum/90 mt-2 font-medium">
                {tafqeet(result.totalKabir)}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/50">
            <div className="truncate max-w-sm">
              النص المحسوب: <span className="text-foreground/90 font-serif">«{result.text || "—"}»</span>
            </div>
            <div className="font-mono text-[11px] text-quantum/80">
              {options.system === "mashriqi" ? "الترتيب المشرقي" : "الترتيب المغربي"}
            </div>
          </div>
        </div>

        {/* 3 Secondary Cards (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          {/* Card 1: Al-Jummal Al-Saghir */}
          <div className="glass-card p-4 sm:p-5 border border-white/8 flex items-center justify-between group hover:border-olive/35 transition-all">
            <div>
              <div className="text-[11px] text-foreground/45 font-mono mb-1">
                الجُمَّل الصغير (بحذف الأصفار)
              </div>
              <div className="text-3xl font-mono font-bold text-olive-400">
                {result.totalSaghir}
              </div>
              <div className="text-[10px] text-foreground/35 mt-1">
                مجموع الحساب بعد رد العشرات والمئات للآحاد (1..9)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-olive/15 border border-olive/30 text-olive-400 flex items-center justify-center font-serif text-lg font-bold">
              ص
            </div>
          </div>

          {/* Card 2: Digital Root */}
          <div className="glass-card p-4 sm:p-5 border border-white/8 flex items-center justify-between group hover:border-quantum/35 transition-all">
            <div>
              <div className="text-[11px] text-foreground/45 font-mono mb-1">
                الجذر الرقمي (Digital Root)
              </div>
              <div className="text-3xl font-mono font-bold text-quantum">
                {result.digitalRoot}
              </div>
              <div className="text-[10px] text-foreground/35 mt-1">
                اختزال خانات المجموع تكرارياً إلى رقم أحادي من 1 إلى 9
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-quantum/15 border border-quantum/30 text-quantum flex items-center justify-center font-mono text-lg font-bold">
              {result.digitalRoot}
            </div>
          </div>

          {/* Card 3: Al-Jummal Al-Lafzi */}
          <div className="glass-card p-4 sm:p-5 border border-white/8 flex items-center justify-between group hover:border-amber-500/35 transition-all">
            <div>
              <div className="text-[11px] text-foreground/45 font-mono mb-1">
                الجُمَّل اللفظي (بسط أسماء الحروف)
              </div>
              <div className="text-3xl font-mono font-bold text-amber-400">
                {result.totalLafzi.toLocaleString()}
              </div>
              <div className="text-[10px] text-foreground/35 mt-1">
                حساب نطق الحروف مفرودة (ألف = 111، لام = 71...)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-serif text-lg font-bold">
              لفظ
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Multi-Tab Deep Dive ─────────────────────────────────── */}
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
          {[
            { id: "breakdown", label: "التشريح الحرفي", icon: Layers, count: result.characters.length },
            { id: "words", label: "تحليل الكلمات", icon: Hash, count: result.words.length },
            { id: "lines", label: "الأبيات والأسطر", icon: AlignRight, count: result.lines.length },
            { id: "frequency", label: "تكرار الحروف والمساهمة", icon: BarChart3, count: result.letterFrequencies.length },
            { id: "elements", label: "طبائع الحروف والأوزان", icon: Flame },
            { id: "comparison", label: "مقارنة نصين", icon: ArrowRightLeft },
            { id: "reverse", label: "البحث العكسي والتأريخ", icon: Search },
            { id: "table", label: "جدول الأبجدية المرجعي", icon: BookOpen, count: 28 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-quantum/15 text-quantum border border-quantum/35 shadow-sm font-semibold"
                    : "bg-white/4 text-foreground/55 hover:bg-white/8 hover:text-foreground/80 border border-white/6"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-quantum/25 text-quantum" : "bg-white/6 text-foreground/40"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Character Breakdown */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>انقر على أي حرف لعرض بطاقة تفاصيله الكاملة وطبيعته:</span>
              <span className="font-mono">{result.characters.filter((c) => c.isArabicLetter).length} حرف محسوب</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {result.characters.map((ch, idx) => {
                if (!ch.isArabicLetter) {
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/2 border border-white/4 text-center text-foreground/30 flex flex-col items-center justify-center min-h-[90px]"
                    >
                      <span className="text-xl font-mono">{ch.original}</span>
                      <span className="text-[10px] mt-1 text-foreground/25">رمز مهمل</span>
                    </div>
                  );
                }

                const elementData = ch.element ? ELEMENT_CONFIG[ch.element] : null;

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedLetter(ch.original)}
                    className="p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 hover:border-quantum/40 transition-all text-center flex flex-col items-center justify-between min-h-[105px] group relative overflow-hidden"
                  >
                    {/* Element small dot */}
                    {elementData && (
                      <span
                        className={`absolute top-2 left-2 w-2 h-2 rounded-full ${elementData.bg} border ${elementData.border}`}
                        title={`طبيعة ${elementData.label}`}
                      />
                    )}

                    <div className="text-2xl sm:text-3xl font-serif font-bold text-foreground/90 group-hover:text-quantum transition-colors mt-1">
                      {ch.original}
                    </div>

                    <div className="w-full mt-2 pt-1.5 border-t border-white/6 flex items-center justify-between text-[11px] font-mono px-1">
                      <span className="text-foreground/40 text-[9px]">{ch.bastSpelling}</span>
                      <span className="text-quantum font-bold">{ch.value}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Letter Details Card */}
            {selectedLetter && (
              <div className="glass-card p-5 border border-quantum/30 rounded-2xl bg-quantum/5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-quantum/20 border border-quantum/40 text-quantum flex items-center justify-center font-serif text-3xl font-bold shadow-lg">
                    {selectedLetter}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground/90">
                      معلومات الحرف: {selectedLetter}
                    </div>
                    <div className="text-xs text-foreground/50 mt-1 leading-relaxed">
                      القيمة في النظام المشرقي:{" "}
                      <strong className="text-quantum">
                        {ARABIC_LETTERS_MAP[selectedLetter]?.mashriqiValue ?? "—"}
                      </strong>{" "}
                      · القيمة في المغربي:{" "}
                      <strong className="text-olive-400">
                        {ARABIC_LETTERS_MAP[selectedLetter]?.maghrebiValue ?? "—"}
                      </strong>{" "}
                      · بسط الحرف:{" "}
                      <strong className="text-amber-400">
                        {ARABIC_LETTERS_MAP[selectedLetter]?.bastSpelling} (
                        {ARABIC_LETTERS_MAP[selectedLetter]?.bastValue})
                      </strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/60 border border-white/8"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Word-by-Word Analysis */}
        {activeTab === "words" && (
          <div className="space-y-3">
            {result.words.length === 0 ? (
              <div className="text-center py-10 text-foreground/40">لا توجد كلمات لحسابها.</div>
            ) : (
              result.words.map((w, index) => (
                <div
                  key={index}
                  className="glass-card p-4 sm:p-5 border border-white/8 hover:border-quantum/25 transition-all rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-foreground/40">
                        {index + 1}
                      </span>
                      <span className="text-2xl font-serif font-bold text-foreground/95">
                        {w.word}
                      </span>
                      <span className="text-xs font-mono text-quantum font-semibold px-2 py-0.5 rounded bg-quantum/10 border border-quantum/20">
                        {w.value}
                      </span>
                      <span className="text-xs font-mono text-foreground/40">
                        ({w.percentage}% من المجموع)
                      </span>
                    </div>

                    {/* Equation Formula */}
                    <div className="text-xs text-foreground/50 font-mono flex flex-wrap items-center gap-1.5 mt-2">
                      {w.characters.map((c, ci) => (
                        <span key={ci} className="inline-flex items-center gap-1">
                          <span className="text-foreground/80 font-serif font-bold">{c.original}</span>
                          <span className="text-foreground/40 text-[10px]">({c.value})</span>
                          {ci < w.characters.length - 1 && (
                            <span className="text-foreground/25">+</span>
                          )}
                        </span>
                      ))}
                      <span className="text-quantum font-bold">= {w.value}</span>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="w-full sm:w-44 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-foreground/40">
                      <span>الوزن النسبي</span>
                      <span>{w.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-quantum to-olive-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(2, w.percentage))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Poetic Stanzas & Line Analysis (NEW!) */}
        {activeTab === "lines" && (
          <div className="space-y-4">
            <div className="text-xs text-foreground/50">
              تحليل الأسطر والأبيات الشعرية. يُمكن الفصل بين شطري البيت بـ (***) أو (...) أو (—) لحساب الصدر والعجز كلٍ على حدة:
            </div>

            {result.lines.map((l) => (
              <div
                key={l.lineNumber}
                className="glass-card p-5 border border-white/8 rounded-xl space-y-3 hover:border-quantum/25 transition-all"
              >
                <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-foreground/40">
                      {l.lineNumber}
                    </span>
                    <span className="text-xs font-semibold text-foreground/80">
                      {l.isPoeticBayt ? "بيت شعري (صدر وعجز)" : `سطر ${l.lineNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-foreground/45">مجموع السطر:</span>
                    <span className="text-lg font-mono font-bold text-quantum">
                      {l.totalValue}
                    </span>
                  </div>
                </div>

                {l.isPoeticBayt ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Sadr */}
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-quantum">
                        <span>صدر البيت (الشطر الأول)</span>
                        <strong className="text-sm font-bold">{l.sadrValue}</strong>
                      </div>
                      <div className="text-lg font-serif font-bold text-foreground/90">
                        {l.sadrText}
                      </div>
                    </div>

                    {/* Ajuz */}
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-olive-400">
                        <span>عجز البيت (الشطر الثاني)</span>
                        <strong className="text-sm font-bold">{l.ajuzValue}</strong>
                      </div>
                      <div className="text-lg font-serif font-bold text-foreground/90">
                        {l.ajuzText}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-serif text-foreground/90 pt-1">
                    {l.rawLine}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Letter Frequency & Ranking (NEW!) */}
        {activeTab === "frequency" && (
          <div className="space-y-4">
            <div className="text-xs text-foreground/50">
              ترتيب الحروف الواردة في النص حسب إجمالي النقاط المساهم بها في المجموع الكلي:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.letterFrequencies.map((lf, idx) => {
                const conf = ELEMENT_CONFIG[lf.element];
                return (
                  <div
                    key={lf.char}
                    className="glass-card p-3.5 rounded-xl border border-white/6 flex items-center justify-between gap-4 hover:border-quantum/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono w-5 h-5 rounded bg-white/5 flex items-center justify-center text-foreground/35">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-2xl font-serif font-bold text-foreground/90">
                        {lf.char}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground/85 flex items-center gap-1.5">
                          <span>{lf.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}>
                            {conf.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-foreground/45 font-mono">
                          تكرر: <strong className="text-foreground/75">{lf.count}×</strong> (القيمة للحرف: {lf.valuePerLetter})
                        </div>
                      </div>
                    </div>

                    <div className="text-left flex flex-col items-end gap-1 min-w-[80px]">
                      <div className="text-base font-mono font-bold text-quantum">
                        {lf.totalPoints}
                      </div>
                      <div className="text-[10px] font-mono text-foreground/40">
                        {lf.percentageOfTotal}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Elements & Abjad Tiers */}
        {activeTab === "elements" && (
          <div className="space-y-6">
            {/* Elemental Nature Breakdown */}
            <div>
              <div className="text-sm font-bold text-foreground/85 mb-3 flex items-center gap-2">
                <Flame size={16} className="text-amber-400" />
                <span>طبائع الحروف الأربعة (Classical Four Elements Classification):</span>
              </div>
              <p className="text-xs text-foreground/45 mb-4 leading-relaxed font-serif">
                قسّم علماء اللغة والحساب الحروف العربية الثمانية والعشرين إلى أربعة طبائع متساوية (7 حروف لكل عنصر) بحسب تواليها في أبجد هوز:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(ELEMENT_CONFIG) as LetterElement[]).map((elem) => {
                  const conf = ELEMENT_CONFIG[elem];
                  const Icon = conf.icon;
                  const stats = result.elementalDistribution[elem];

                  return (
                    <div
                      key={elem}
                      className={`glass-card p-5 rounded-2xl border ${conf.border} ${conf.bg} space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={conf.color} />
                          <span className={`font-bold text-base ${conf.color}`}>
                            الحروف {conf.label}
                          </span>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/5 font-semibold">
                          {stats.count} حرف
                        </span>
                      </div>

                      <div className="text-xs text-foreground/50 font-serif">
                        {conf.sublabel}
                      </div>

                      {/* Percentage Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-foreground/40">
                          <span>النسبة في النص</span>
                          <span className={conf.color}>{stats.percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${conf.bg.replace("/10", "/80")}`}
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Abjad Tiers (Units, Tens, Hundreds, Thousands) */}
            <div className="pt-4 border-t border-white/8">
              <div className="text-sm font-bold text-foreground/85 mb-3">
                مراتب الأبجدية العددية (Abjad Numerical Tiers):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(TIER_CONFIG) as AbjadTier[]).map((tier) => {
                  const conf = TIER_CONFIG[tier];
                  const stats = result.tierDistribution[tier];
                  return (
                    <div
                      key={tier}
                      className="glass-card p-4 rounded-xl border border-white/6 text-center space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-foreground/60">{conf.label}</div>
                      <div className={`text-2xl font-mono font-bold ${conf.color}`}>
                        {stats.count}
                      </div>
                      <div className="text-[10px] text-foreground/40 font-mono">
                        نطاق {conf.range} ({stats.percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Dual Text Comparison */}
        {activeTab === "comparison" && (
          <div className="space-y-6">
            <div className="text-xs text-foreground/50">
              قارن بين كلمتين أو عبارتين أو اسمين لاكتشاف الفروق العددية والجذور الرقمية والتوافق:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Text 1 Input */}
              <div className="glass-card p-5 border border-white/8 space-y-3">
                <label className="text-xs font-semibold text-quantum">النص الأول (Text A):</label>
                <input
                  type="text"
                  value={compareText1}
                  onChange={(e) => setCompareText1(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-quantum rounded-lg p-3 text-lg font-serif outline-none"
                  placeholder="اكتب النص الأول..."
                />
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50 pt-2 border-t border-white/6">
                  <span>المجموع الكبير:</span>
                  <strong className="text-quantum text-base font-bold">
                    {comp1Result.totalKabir}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50">
                  <span>الجُمَّل الصغير:</span>
                  <span className="text-foreground/80">{comp1Result.totalSaghir}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50">
                  <span>الجذر الرقمي:</span>
                  <span className="text-quantum font-bold">{comp1Result.digitalRoot}</span>
                </div>
              </div>

              {/* Text 2 Input */}
              <div className="glass-card p-5 border border-white/8 space-y-3">
                <label className="text-xs font-semibold text-olive-400">النص الثاني (Text B):</label>
                <input
                  type="text"
                  value={compareText2}
                  onChange={(e) => setCompareText2(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-olive-400 rounded-lg p-3 text-lg font-serif outline-none"
                  placeholder="اكتب النص الثاني..."
                />
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50 pt-2 border-t border-white/6">
                  <span>المجموع الكبير:</span>
                  <strong className="text-olive-400 text-base font-bold">
                    {comp2Result.totalKabir}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50">
                  <span>الجُمَّل الصغير:</span>
                  <span className="text-foreground/80">{comp2Result.totalSaghir}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-foreground/50">
                  <span>الجذر الرقمي:</span>
                  <span className="text-olive-400 font-bold">{comp2Result.digitalRoot}</span>
                </div>
              </div>
            </div>

            {/* Comparison Metrics Output */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/2 space-y-4">
              <div className="text-sm font-bold text-foreground/90">
                نتائج المقارنة والموازنة العددية:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-xs text-foreground/45 mb-1 font-mono">الفرق المطلق</div>
                  <div className="text-2xl font-mono font-bold text-foreground/90">
                    {Math.abs(comp1Result.totalKabir - comp2Result.totalKabir)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-xs text-foreground/45 mb-1 font-mono">مجموع النصين معاً</div>
                  <div className="text-2xl font-mono font-bold text-quantum">
                    {comp1Result.totalKabir + comp2Result.totalKabir}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-xs text-foreground/45 mb-1 font-mono">تطابق الجذر الرقمي</div>
                  <div
                    className={`text-xl font-bold ${
                      comp1Result.digitalRoot === comp2Result.digitalRoot
                        ? "text-emerald-400"
                        : "text-foreground/50"
                    }`}
                  >
                    {comp1Result.digitalRoot === comp2Result.digitalRoot ? "متطابقان ✓" : "مختلفان"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-xs text-foreground/45 mb-1 font-mono">النسبة الرياضية</div>
                  <div className="text-xl font-mono font-bold text-olive-400">
                    {comp2Result.totalKabir > 0
                      ? (comp1Result.totalKabir / comp2Result.totalKabir).toFixed(2)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Reverse Lookup & Chronogram Solver */}
        {activeTab === "reverse" && (
          <div className="space-y-6">
            {/* Tool 1: Number-to-Letters Generator */}
            <div className="glass-card p-6 border border-white/8 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-quantum">
                <Search size={16} />
                <span>البحث العكسي: توليد حروف تطابق رقماً معيناً (Reverse Lookup)</span>
              </div>
              <p className="text-xs text-foreground/50 leading-relaxed font-serif">
                أدخل أي رقم صحيح (مثل عام ميلاد، سنة هجرية كـ 1447، أو رقم خاص)، وسيقوم المحرك بحساب التركيب الأبجدي القانوني الأقصر له:
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={reverseTarget}
                  onChange={(e) => setReverseTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full sm:w-48 bg-black/40 border border-white/10 focus:border-quantum rounded-xl p-3 text-xl font-mono font-bold text-center outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {[786, 1447, 2026, 651, 558].map((presetNum) => (
                    <button
                      key={presetNum}
                      onClick={() => setReverseTarget(presetNum)}
                      className="text-xs font-mono px-3 py-2 rounded-lg bg-white/5 hover:bg-quantum/20 hover:text-quantum border border-white/8 transition-all"
                    >
                      {presetNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reverse Output */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/6 space-y-2">
                <div className="text-xs text-foreground/45 font-mono">
                  الحروف الأبجدية المطابقة للرقم {reverseTarget}:
                </div>
                <div className="text-2xl font-serif font-bold text-quantum tracking-wider">
                  {reverseResult.letters.join(" ")}
                </div>
                <div className="text-xs text-foreground/60 font-mono pt-2 border-t border-white/6">
                  المعادلة: {reverseResult.equation} = {reverseTarget}
                </div>
              </div>
            </div>

            {/* Tool 2: Chronogram Poetry Verifier */}
            <div className="glass-card p-6 border border-white/8 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-olive-400">
                <BookOpen size={16} />
                <span>مساعد التأريخ الشعري (Chronogram Poetry Verifier)</span>
              </div>
              <p className="text-xs text-foreground/50 leading-relaxed font-serif">
                في الشعر العربي القديم، كان الشاعر يؤرخ للأحداث (بناء، وفاة، ولادة، معركة) بأن يصوغ شطراً شعرياً يساوي مجموع حساب جمله السنة المستهدفة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-foreground/60 block mb-1">
                    الشطر الشعري المؤرخ (Poetic Hemistich):
                  </label>
                  <input
                    type="text"
                    value={chronogramHemistich}
                    onChange={(e) => setChronogramHemistich(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-olive-400 rounded-lg p-3 text-lg font-serif outline-none"
                    placeholder="اكتب الشطر المؤرخ هنا..."
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/60 block mb-1">
                    السنة المستهدفة (Target Year):
                  </label>
                  <input
                    type="number"
                    value={reverseTarget}
                    onChange={(e) => setReverseTarget(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 focus:border-olive-400 rounded-lg p-3 text-lg font-mono outline-none"
                    placeholder="مثال: 558 أو 1447"
                  />
                </div>
              </div>

              {/* Evaluation Card */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-foreground/45 font-mono">
                    مجموع شطر التأريخ الحالي:
                  </div>
                  <div className="text-2xl font-mono font-bold text-foreground/90">
                    {chronoResult.totalKabir}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {chronoResult.totalKabir === reverseTarget ? (
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                      <Check size={16} />
                      <span>تطابق تام ومثالي مع سنة {reverseTarget}!</span>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-foreground/60">
                      الفارق عن السنة المستهدفة:{" "}
                      <strong
                        className={
                          chronoResult.totalKabir > reverseTarget
                            ? "text-amber-400"
                            : "text-quantum"
                        }
                      >
                        {chronoResult.totalKabir > reverseTarget
                          ? `+${chronoResult.totalKabir - reverseTarget} (زائد)`
                          : `-${reverseTarget - chronoResult.totalKabir} (ناقص)`}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Complete Reference Table */}
        {activeTab === "table" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"
                />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="ابحث بالحرف أو الاسم أو القيمة الرقمية..."
                  className="w-full bg-black/30 border border-white/10 focus:border-quantum rounded-lg pr-9 pl-4 py-2 text-xs outline-none"
                />
              </div>

              {/* Tier Filters */}
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "آحاد", "عشرات", "مئات", "ألوف"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTableTierFilter(tier)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      tableTierFilter === tier
                        ? "bg-quantum/20 text-quantum border-quantum/40 font-semibold"
                        : "bg-white/4 text-foreground/50 border-white/6 hover:bg-white/8"
                    }`}
                  >
                    {tier === "ALL" ? "جميع المراتب" : tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/8 text-foreground/60 font-mono">
                    <th className="p-3">الحرف</th>
                    <th className="p-3">اسم الحرف</th>
                    <th className="p-3">المشرقي (القياسي)</th>
                    <th className="p-3">المغربي</th>
                    <th className="p-3">البسط اللفظي</th>
                    <th className="p-3">المرتبة</th>
                    <th className="p-3">الطبيعة</th>
                    <th className="p-3 text-center">إدراج</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 font-serif">
                  {filteredLetters.map((m) => {
                    const isDiff = m.mashriqiValue !== m.maghrebiValue;
                    return (
                      <tr
                        key={m.char}
                        className={`hover:bg-white/4 transition-colors ${
                          isDiff ? "bg-amber-500/3" : ""
                        }`}
                      >
                        <td className="p-3 text-xl font-bold text-foreground/95">{m.char}</td>
                        <td className="p-3 text-foreground/80 font-serif">{m.nameArabic}</td>
                        <td className="p-3 font-mono font-bold text-quantum">
                          {m.mashriqiValue}
                        </td>
                        <td
                          className={`p-3 font-mono font-bold ${
                            isDiff ? "text-amber-400 underline" : "text-foreground/60"
                          }`}
                        >
                          {m.maghrebiValue}
                          {isDiff && (
                            <span className="text-[10px] mr-1 text-amber-400 font-sans">
                              (مختلف)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-foreground/60 font-mono">
                          {m.bastSpelling} ({m.bastValue})
                        </td>
                        <td className="p-3 text-foreground/60 font-sans text-[11px]">{m.tier}</td>
                        <td className="p-3 text-[11px] font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              ELEMENT_CONFIG[m.element].bg
                            } ${ELEMENT_CONFIG[m.element].color} border ${
                              ELEMENT_CONFIG[m.element].border
                            }`}
                          >
                            {m.element}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleAppendChar(m.char)}
                            className="text-[11px] px-2 py-1 rounded bg-white/5 hover:bg-quantum/20 hover:text-quantum border border-white/6 transition-all"
                          >
                            + إضافة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Export & Actions Footer Bar ─────────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-5 border border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-foreground/50">
          تصدير ومشاركة نتائج الحساب كتقرير نصي كامل أو ملف بيانات JSON:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyFullReport}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-quantum/15 text-quantum border border-quantum/35 hover:bg-quantum/25 transition-all"
          >
            {copiedReport ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedReport ? "تم نسخ التقرير الكامل!" : "نسخ التقرير الشامل"}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-foreground/75 border border-white/10 transition-all"
          >
            <Download size={14} />
            <span>تنزيل تقرير JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
