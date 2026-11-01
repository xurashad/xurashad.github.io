/**
 * Hisab Al-Jummal (حساب الجُمَّل) Calculation Engine
 * Comprehensive engine supporting both Mashriqi (المشرقي) and Maghrebi (المغربي) Abjad traditions,
 * detailed character breakdowns, diacritic handling, Bast (بسط الحروف), digital roots,
 * and classical elemental classifications.
 */

export type AbjadSystem = "mashriqi" | "maghrebi";

export interface JummalOptions {
  system: AbjadSystem;
  taaMarbuta: 5 | 400; // 5 (as Ha / standard) or 400 (as Ta)
  alifMaqsura: 10 | 1; // 10 (as Ya / standard) or 1 (as Alif)
  shaddahDoubled: boolean; // false = counted once (orthographic), true = counted twice (prosodic)
  hamzaAsCarrier: boolean; // false = all hamza variants = 1; true = carrier base (ئ=10, ؤ=6)
}

export const DEFAULT_JUMMAL_OPTIONS: JummalOptions = {
  system: "mashriqi",
  taaMarbuta: 5,
  alifMaqsura: 10,
  shaddahDoubled: false,
  hamzaAsCarrier: false,
};

export type LetterElement = "ناري" | "ترابي" | "هوائي" | "مائي";
export type AbjadTier = "آحاد" | "عشرات" | "مئات" | "ألوف";

export interface LetterMeta {
  char: string;
  name: string;
  nameArabic: string;
  bastSpelling: string; // e.g. ألف, باء
  bastValue: number;
  mashriqiValue: number;
  maghrebiValue: number;
  element: LetterElement;
  tier: AbjadTier;
  mashriqiOrder: number;
  maghrebiOrder: number;
  groupMashriqi: string;
  groupMaghrebi: string;
}

/**
 * 28 Canonical Arabic Letters with full philological metadata
 */
export const ARABIC_LETTERS_MAP: Record<string, LetterMeta> = {
  "ا": {
    char: "ا",
    name: "Alif",
    nameArabic: "أَلِف",
    bastSpelling: "ألف",
    bastValue: 111, // 1 + 30 + 80
    mashriqiValue: 1,
    maghrebiValue: 1,
    element: "ناري",
    tier: "آحاد",
    mashriqiOrder: 1,
    maghrebiOrder: 1,
    groupMashriqi: "أَبْجَدْ",
    groupMaghrebi: "أَبْجَدْ",
  },
  "ب": {
    char: "ب",
    name: "Baa",
    nameArabic: "بَاء",
    bastSpelling: "با",
    bastValue: 3, // 2 + 1
    mashriqiValue: 2,
    maghrebiValue: 2,
    element: "ترابي",
    tier: "آحاد",
    mashriqiOrder: 2,
    maghrebiOrder: 2,
    groupMashriqi: "أَبْجَدْ",
    groupMaghrebi: "أَبْجَدْ",
  },
  "ج": {
    char: "ج",
    name: "Jeem",
    nameArabic: "جِيم",
    bastSpelling: "جيم",
    bastValue: 53, // 3 + 10 + 40
    mashriqiValue: 3,
    maghrebiValue: 3,
    element: "هوائي",
    tier: "آحاد",
    mashriqiOrder: 3,
    maghrebiOrder: 3,
    groupMashriqi: "أَبْجَدْ",
    groupMaghrebi: "أَبْجَدْ",
  },
  "د": {
    char: "د",
    name: "Daal",
    nameArabic: "دَال",
    bastSpelling: "دال",
    bastValue: 35, // 4 + 1 + 30
    mashriqiValue: 4,
    maghrebiValue: 4,
    element: "مائي",
    tier: "آحاد",
    mashriqiOrder: 4,
    maghrebiOrder: 4,
    groupMashriqi: "أَبْجَدْ",
    groupMaghrebi: "أَبْجَدْ",
  },
  "ه": {
    char: "ه",
    name: "Haa",
    nameArabic: "هَاء",
    bastSpelling: "ها",
    bastValue: 6, // 5 + 1
    mashriqiValue: 5,
    maghrebiValue: 5,
    element: "ناري",
    tier: "آحاد",
    mashriqiOrder: 5,
    maghrebiOrder: 5,
    groupMashriqi: "هَوَّزْ",
    groupMaghrebi: "هَوَّزْ",
  },
  "و": {
    char: "و",
    name: "Waaw",
    nameArabic: "وَاو",
    bastSpelling: "واو",
    bastValue: 13, // 6 + 1 + 6
    mashriqiValue: 6,
    maghrebiValue: 6,
    element: "ترابي",
    tier: "آحاد",
    mashriqiOrder: 6,
    maghrebiOrder: 6,
    groupMashriqi: "هَوَّزْ",
    groupMaghrebi: "هَوَّزْ",
  },
  "ز": {
    char: "ز",
    name: "Zaay",
    nameArabic: "زَاي",
    bastSpelling: "زاي",
    bastValue: 18, // 7 + 1 + 10
    mashriqiValue: 7,
    maghrebiValue: 7,
    element: "هوائي",
    tier: "آحاد",
    mashriqiOrder: 7,
    maghrebiOrder: 7,
    groupMashriqi: "هَوَّزْ",
    groupMaghrebi: "هَوَّزْ",
  },
  "ح": {
    char: "ح",
    name: "Haa (Pharyngeal)",
    nameArabic: "حَاء",
    bastSpelling: "حا",
    bastValue: 9, // 8 + 1
    mashriqiValue: 8,
    maghrebiValue: 8,
    element: "مائي",
    tier: "آحاد",
    mashriqiOrder: 8,
    maghrebiOrder: 8,
    groupMashriqi: "حُطِّي",
    groupMaghrebi: "حُطِّي",
  },
  "ط": {
    char: "ط",
    name: "Taa (Emphatic)",
    nameArabic: "طَاء",
    bastSpelling: "طا",
    bastValue: 10, // 9 + 1
    mashriqiValue: 9,
    maghrebiValue: 9,
    element: "ناري",
    tier: "آحاد",
    mashriqiOrder: 9,
    maghrebiOrder: 9,
    groupMashriqi: "حُطِّي",
    groupMaghrebi: "حُطِّي",
  },
  "ي": {
    char: "ي",
    name: "Yaa",
    nameArabic: "يَاء",
    bastSpelling: "يا",
    bastValue: 11, // 10 + 1
    mashriqiValue: 10,
    maghrebiValue: 10,
    element: "ترابي",
    tier: "عشرات",
    mashriqiOrder: 10,
    maghrebiOrder: 10,
    groupMashriqi: "حُطِّي",
    groupMaghrebi: "حُطِّي",
  },
  "ك": {
    char: "ك",
    name: "Kaaf",
    nameArabic: "كَاف",
    bastSpelling: "كاف",
    bastValue: 101, // 20 + 1 + 80
    mashriqiValue: 20,
    maghrebiValue: 20,
    element: "هوائي",
    tier: "عشرات",
    mashriqiOrder: 11,
    maghrebiOrder: 11,
    groupMashriqi: "كَلَمُنْ",
    groupMaghrebi: "كَلَمُنْ",
  },
  "ل": {
    char: "ل",
    name: "Laam",
    nameArabic: "لَام",
    bastSpelling: "لام",
    bastValue: 71, // 30 + 1 + 40
    mashriqiValue: 30,
    maghrebiValue: 30,
    element: "مائي",
    tier: "عشرات",
    mashriqiOrder: 12,
    maghrebiOrder: 12,
    groupMashriqi: "كَلَمُنْ",
    groupMaghrebi: "كَلَمُنْ",
  },
  "م": {
    char: "م",
    name: "Meem",
    nameArabic: "مِيم",
    bastSpelling: "ميم",
    bastValue: 90, // 40 + 10 + 40
    mashriqiValue: 40,
    maghrebiValue: 40,
    element: "ناري",
    tier: "عشرات",
    mashriqiOrder: 13,
    maghrebiOrder: 13,
    groupMashriqi: "كَلَمُنْ",
    groupMaghrebi: "كَلَمُنْ",
  },
  "ن": {
    char: "ن",
    name: "Noon",
    nameArabic: "نُون",
    bastSpelling: "نون",
    bastValue: 106, // 50 + 6 + 50
    mashriqiValue: 50,
    maghrebiValue: 50,
    element: "ترابي",
    tier: "عشرات",
    mashriqiOrder: 14,
    maghrebiOrder: 14,
    groupMashriqi: "كَلَمُنْ",
    groupMaghrebi: "كَلَمُنْ",
  },
  "س": {
    char: "س",
    name: "Seen",
    nameArabic: "سِين",
    bastSpelling: "سين",
    bastValue: 120, // 60 + 10 + 50
    mashriqiValue: 60,
    maghrebiValue: 300, // In Maghrebi, س is in قرست = 300
    element: "هوائي",
    tier: "عشرات", // In Mashriqi
    mashriqiOrder: 15,
    maghrebiOrder: 21,
    groupMashriqi: "سَعْفَصْ",
    groupMaghrebi: "قَرَسَتْ",
  },
  "ع": {
    char: "ع",
    name: "Ayn",
    nameArabic: "عَيْن",
    bastSpelling: "عين",
    bastValue: 130, // 70 + 10 + 50
    mashriqiValue: 70,
    maghrebiValue: 70,
    element: "مائي",
    tier: "عشرات",
    mashriqiOrder: 16,
    maghrebiOrder: 16,
    groupMashriqi: "سَعْفَصْ",
    groupMaghrebi: "صَعْفَضْ",
  },
  "ف": {
    char: "ف",
    name: "Faa",
    nameArabic: "فَاء",
    bastSpelling: "فا",
    bastValue: 81, // 80 + 1
    mashriqiValue: 80,
    maghrebiValue: 80,
    element: "ناري",
    tier: "عشرات",
    mashriqiOrder: 17,
    maghrebiOrder: 17,
    groupMashriqi: "سَعْفَصْ",
    groupMaghrebi: "صَعْفَضْ",
  },
  "ص": {
    char: "ص",
    name: "Saad",
    nameArabic: "صَاد",
    bastSpelling: "صاد",
    bastValue: 95, // 90 + 1 + 4
    mashriqiValue: 90,
    maghrebiValue: 60, // In Maghrebi, ص is in صعفض = 60
    element: "ترابي",
    tier: "عشرات",
    mashriqiOrder: 18,
    maghrebiOrder: 15,
    groupMashriqi: "سَعْفَصْ",
    groupMaghrebi: "صَعْفَضْ",
  },
  "ق": {
    char: "ق",
    name: "Qaaf",
    nameArabic: "قَاف",
    bastSpelling: "قاف",
    bastValue: 181, // 100 + 1 + 80
    mashriqiValue: 100,
    maghrebiValue: 100,
    element: "هوائي",
    tier: "مئات",
    mashriqiOrder: 19,
    maghrebiOrder: 19,
    groupMashriqi: "قَرَشَتْ",
    groupMaghrebi: "قَرَسَتْ",
  },
  "ر": {
    char: "ر",
    name: "Raa",
    nameArabic: "رَاء",
    bastSpelling: "را",
    bastValue: 201, // 200 + 1
    mashriqiValue: 200,
    maghrebiValue: 200,
    element: "مائي",
    tier: "مئات",
    mashriqiOrder: 20,
    maghrebiOrder: 20,
    groupMashriqi: "قَرَشَتْ",
    groupMaghrebi: "قَرَسَتْ",
  },
  "ش": {
    char: "ش",
    name: "Sheen",
    nameArabic: "شِين",
    bastSpelling: "شين",
    bastValue: 360, // 300 + 10 + 50
    mashriqiValue: 300,
    maghrebiValue: 1000, // In Maghrebi, ش is in ظغش = 1000
    element: "ناري",
    tier: "مئات",
    mashriqiOrder: 21,
    maghrebiOrder: 28,
    groupMashriqi: "قَرَشَتْ",
    groupMaghrebi: "ظَغَشْ",
  },
  "ت": {
    char: "ت",
    name: "Taa",
    nameArabic: "تَاء",
    bastSpelling: "تا",
    bastValue: 401, // 400 + 1
    mashriqiValue: 400,
    maghrebiValue: 400,
    element: "ترابي",
    tier: "مئات",
    mashriqiOrder: 22,
    maghrebiOrder: 22,
    groupMashriqi: "قَرَشَتْ",
    groupMaghrebi: "قَرَسَتْ",
  },
  "ث": {
    char: "ث",
    name: "Thaa",
    nameArabic: "ثَاء",
    bastSpelling: "ثا",
    bastValue: 501, // 500 + 1
    mashriqiValue: 500,
    maghrebiValue: 500,
    element: "هوائي",
    tier: "مئات",
    mashriqiOrder: 23,
    maghrebiOrder: 23,
    groupMashriqi: "ثَخَذْ",
    groupMaghrebi: "ثَخَذْ",
  },
  "خ": {
    char: "خ",
    name: "Khaa",
    nameArabic: "خَاء",
    bastSpelling: "خا",
    bastValue: 601, // 600 + 1
    mashriqiValue: 600,
    maghrebiValue: 600,
    element: "مائي",
    tier: "مئات",
    mashriqiOrder: 24,
    maghrebiOrder: 24,
    groupMashriqi: "ثَخَذْ",
    groupMaghrebi: "ثَخَذْ",
  },
  "ذ": {
    char: "ذ",
    name: "Dhaal",
    nameArabic: "ذَال",
    bastSpelling: "ذال",
    bastValue: 731, // 700 + 1 + 30
    mashriqiValue: 700,
    maghrebiValue: 700,
    element: "ناري",
    tier: "مئات",
    mashriqiOrder: 25,
    maghrebiOrder: 25,
    groupMashriqi: "ثَخَذْ",
    groupMaghrebi: "ثَخَذْ",
  },
  "ض": {
    char: "ض",
    name: "Daad",
    nameArabic: "ضَاد",
    bastSpelling: "ضاد",
    bastValue: 805, // 800 + 1 + 4
    mashriqiValue: 800,
    maghrebiValue: 90, // In Maghrebi, ض is in صعفض = 90
    element: "ترابي",
    tier: "مئات",
    mashriqiOrder: 26,
    maghrebiOrder: 18,
    groupMashriqi: "ضَظَغْ",
    groupMaghrebi: "صَعْفَضْ",
  },
  "ظ": {
    char: "ظ",
    name: "Zhaa (Emphatic)",
    nameArabic: "ظَاء",
    bastSpelling: "ظا",
    bastValue: 901, // 900 + 1
    mashriqiValue: 900,
    maghrebiValue: 800, // In Maghrebi, ظ is in ظغش = 800
    element: "هوائي",
    tier: "مئات",
    mashriqiOrder: 27,
    maghrebiOrder: 26,
    groupMashriqi: "ضَظَغْ",
    groupMaghrebi: "ظَغَشْ",
  },
  "غ": {
    char: "غ",
    name: "Ghayn",
    nameArabic: "غَيْن",
    bastSpelling: "غين",
    bastValue: 1060, // 1000 + 10 + 50
    mashriqiValue: 1000,
    maghrebiValue: 900, // In Maghrebi, غ is in ظغش = 900
    element: "مائي",
    tier: "ألوف",
    mashriqiOrder: 28,
    maghrebiOrder: 27,
    groupMashriqi: "ضَظَغْ",
    groupMaghrebi: "ظَغَشْ",
  },
};

/**
 * Diacritic marks and formatting marks to strip or track
 */
export const DIACRITICS_REGEX = /[\u064B-\u0652\u0670\u0640]/g; // Tanween, Harakat, Dagger Alif, Tatweel
export const SHADDAH_CHAR = "\u0651"; // Shaddah (ّ)

/**
 * Computes Digital Root (الجذر الرقمي): recursive sum of digits until 1–9.
 */
export function computeDigitalRoot(n: number): number {
  if (n <= 0) return 0;
  return ((n - 1) % 9) + 1;
}

/**
 * Converts a large Jummal number to minor value (الجمل الصغير بحذف الأصفار):
 * Units 1..9 stay 1..9, 10..90 become 1..9, 100..900 become 1..9, 1000 becomes 1.
 */
export function toSaghirValue(kabir: number): number {
  if (kabir <= 0) return 0;
  const str = String(kabir).replace(/0/g, "");
  return Number(str) || 0;
}

export interface CharacterAnalysis {
  original: string;
  normalized: string;
  isArabicLetter: boolean;
  value: number;
  saghirValue: number;
  bastSpelling: string;
  bastValue: number;
  nameArabic: string;
  element?: LetterElement;
  tier?: AbjadTier;
  isDoubledByShaddah?: boolean;
}

export interface WordAnalysis {
  word: string;
  cleanWord: string;
  value: number;
  percentage: number;
  characters: CharacterAnalysis[];
}

export interface LineAnalysis {
  lineNumber: number;
  rawLine: string;
  isPoeticBayt: boolean;
  sadrText?: string;
  sadrValue?: number;
  ajuzText?: string;
  ajuzValue?: number;
  totalValue: number;
}

export interface LetterFrequency {
  char: string;
  name: string;
  count: number;
  valuePerLetter: number;
  totalPoints: number;
  percentageOfTotal: number;
  element: LetterElement;
  tier: AbjadTier;
}

export interface JummalCalculationResult {
  text: string;
  totalKabir: number;
  totalSaghir: number;
  digitalRoot: number;
  totalLafzi: number;
  words: WordAnalysis[];
  characters: CharacterAnalysis[];
  lines: LineAnalysis[];
  letterFrequencies: LetterFrequency[];
  stats: {
    pureLettersCount: number;
    wordsCount: number;
    linesCount: number;
    diacriticsCount: number;
    spacesCount: number;
    shaddahCount: number;
    ignoredCharsCount: number;
  };
  elementalDistribution: Record<LetterElement, { count: number; percentage: number }>;
  tierDistribution: Record<AbjadTier, { count: number; percentage: number }>;
}

/**
 * Analyzes and calculates Hisab Al-Jummal for a given Arabic text.
 */
export function calculateJummal(
  rawText: string,
  options: JummalOptions = DEFAULT_JUMMAL_OPTIONS
): JummalCalculationResult {
  const text = rawText || "";
  let diacriticsCount = 0;
  let shaddahCount = 0;
  let spacesCount = 0;
  let ignoredCharsCount = 0;

  // We will process token by token, taking Shaddah into account if needed.
  // First, split into words by whitespace:
  const rawWords = text.trim().split(/\s+/).filter(Boolean);

  const wordAnalyses: WordAnalysis[] = [];
  const allCharacters: CharacterAnalysis[] = [];

  let grandTotalKabir = 0;
  let grandTotalSaghir = 0;
  let grandTotalLafzi = 0;

  const elementCounts: Record<LetterElement, number> = {
    ناري: 0,
    ترابي: 0,
    هوائي: 0,
    مائي: 0,
  };

  const tierCounts: Record<AbjadTier, number> = {
    آحاد: 0,
    عشرات: 0,
    مئات: 0,
    ألوف: 0,
  };

  let pureLettersCount = 0;

  // Iterate over each character in the string, maintaining word boundaries
  for (const rawWord of rawWords) {
    let wordValue = 0;
    const wordChars: CharacterAnalysis[] = [];
    let cleanWordChars = "";

    for (let i = 0; i < rawWord.length; i++) {
      const char = rawWord[i];
      const nextChar = i + 1 < rawWord.length ? rawWord[i + 1] : "";
      const hasShaddahNext = nextChar === SHADDAH_CHAR;

      // Check if current char is diacritic / shaddah / tatweel
      if (char === SHADDAH_CHAR) {
        shaddahCount++;
        continue;
      }
      if (/[\u064B-\u0650\u0652\u0670\u0640]/.test(char)) {
        diacriticsCount++;
        continue;
      }

      // Check for Ta Marbuta (ة)
      if (char === "ة") {
        const val = options.taaMarbuta; // 5 or 400
        const isDoubled = options.shaddahDoubled && hasShaddahNext;
        const multiplier = isDoubled ? 2 : 1;
        const finalVal = val * multiplier;
        const saghir = toSaghirValue(val) * multiplier;
        const meta = ARABIC_LETTERS_MAP[val === 5 ? "ه" : "ت"];

        const analysis: CharacterAnalysis = {
          original: hasShaddahNext ? char + SHADDAH_CHAR : char,
          normalized: "ة",
          isArabicLetter: true,
          value: finalVal,
          saghirValue: saghir,
          bastSpelling: val === 5 ? "ها" : "تا",
          bastValue: (val === 5 ? 6 : 401) * multiplier,
          nameArabic: `تَاء مَرْبُوطَة (${val})`,
          element: meta.element,
          tier: meta.tier,
          isDoubledByShaddah: isDoubled,
        };

        wordValue += finalVal;
        grandTotalKabir += finalVal;
        grandTotalSaghir += saghir;
        grandTotalLafzi += analysis.bastValue;
        pureLettersCount += multiplier;
        elementCounts[meta.element] += multiplier;
        tierCounts[meta.tier] += multiplier;

        wordChars.push(analysis);
        allCharacters.push(analysis);
        cleanWordChars += char;
        continue;
      }

      // Check for Alif Maqsura (ى)
      if (char === "ى") {
        const val = options.alifMaqsura; // 10 or 1
        const isDoubled = options.shaddahDoubled && hasShaddahNext;
        const multiplier = isDoubled ? 2 : 1;
        const finalVal = val * multiplier;
        const saghir = toSaghirValue(val) * multiplier;
        const meta = ARABIC_LETTERS_MAP[val === 10 ? "ي" : "ا"];

        const analysis: CharacterAnalysis = {
          original: hasShaddahNext ? char + SHADDAH_CHAR : char,
          normalized: "ى",
          isArabicLetter: true,
          value: finalVal,
          saghirValue: saghir,
          bastSpelling: val === 10 ? "يا" : "ألف",
          bastValue: (val === 10 ? 11 : 111) * multiplier,
          nameArabic: `أَلِف مَقْصُورَة (${val})`,
          element: meta.element,
          tier: meta.tier,
          isDoubledByShaddah: isDoubled,
        };

        wordValue += finalVal;
        grandTotalKabir += finalVal;
        grandTotalSaghir += saghir;
        grandTotalLafzi += analysis.bastValue;
        pureLettersCount += multiplier;
        elementCounts[meta.element] += multiplier;
        tierCounts[meta.tier] += multiplier;

        wordChars.push(analysis);
        allCharacters.push(analysis);
        cleanWordChars += char;
        continue;
      }

      // Check for Hamza variants: أ, إ, آ, ٱ, ء, ئ, ؤ
      if (["أ", "إ", "آ", "ٱ", "ء", "ئ", "ؤ"].includes(char)) {
        let baseVal = 1;
        let baseLetter = "ا";

        if (options.hamzaAsCarrier) {
          if (char === "ئ") {
            baseVal = 10;
            baseLetter = "ي";
          } else if (char === "ؤ") {
            baseVal = 6;
            baseLetter = "و";
          }
        }

        const isDoubled = options.shaddahDoubled && hasShaddahNext;
        const multiplier = isDoubled ? 2 : 1;
        const finalVal = baseVal * multiplier;
        const saghir = toSaghirValue(baseVal) * multiplier;
        const meta = ARABIC_LETTERS_MAP[baseLetter];

        const analysis: CharacterAnalysis = {
          original: hasShaddahNext ? char + SHADDAH_CHAR : char,
          normalized: char,
          isArabicLetter: true,
          value: finalVal,
          saghirValue: saghir,
          bastSpelling: meta.bastSpelling,
          bastValue: meta.bastValue * multiplier,
          nameArabic: `هَمْزَة (${char})`,
          element: meta.element,
          tier: meta.tier,
          isDoubledByShaddah: isDoubled,
        };

        wordValue += finalVal;
        grandTotalKabir += finalVal;
        grandTotalSaghir += saghir;
        grandTotalLafzi += analysis.bastValue;
        pureLettersCount += multiplier;
        elementCounts[meta.element] += multiplier;
        tierCounts[meta.tier] += multiplier;

        wordChars.push(analysis);
        allCharacters.push(analysis);
        cleanWordChars += char;
        continue;
      }

      // Standard Arabic Alphabet Letters (ا..غ)
      const meta = ARABIC_LETTERS_MAP[char];
      if (meta) {
        const isDoubled = options.shaddahDoubled && hasShaddahNext;
        const multiplier = isDoubled ? 2 : 1;
        const val =
          (options.system === "maghrebi" ? meta.maghrebiValue : meta.mashriqiValue) * multiplier;
        const unitVal =
          toSaghirValue(options.system === "maghrebi" ? meta.maghrebiValue : meta.mashriqiValue) *
          multiplier;

        const analysis: CharacterAnalysis = {
          original: hasShaddahNext ? char + SHADDAH_CHAR : char,
          normalized: char,
          isArabicLetter: true,
          value: val,
          saghirValue: unitVal,
          bastSpelling: meta.bastSpelling,
          bastValue: meta.bastValue * multiplier,
          nameArabic: meta.nameArabic,
          element: meta.element,
          tier: meta.tier,
          isDoubledByShaddah: isDoubled,
        };

        wordValue += val;
        grandTotalKabir += val;
        grandTotalSaghir += unitVal;
        grandTotalLafzi += analysis.bastValue;
        pureLettersCount += multiplier;
        elementCounts[meta.element] += multiplier;
        tierCounts[meta.tier] += multiplier;

        wordChars.push(analysis);
        allCharacters.push(analysis);
        cleanWordChars += char;
      } else {
        // Non-Arabic symbol, punctuation, numeral or foreign letter
        ignoredCharsCount++;
        allCharacters.push({
          original: char,
          normalized: char,
          isArabicLetter: false,
          value: 0,
          saghirValue: 0,
          bastSpelling: "-",
          bastValue: 0,
          nameArabic: "رمز / غير عربي",
        });
      }
    }

    if (cleanWordChars.length > 0 || wordChars.length > 0) {
      wordAnalyses.push({
        word: rawWord,
        cleanWord: cleanWordChars || rawWord,
        value: wordValue,
        percentage: 0, // will compute after grandTotalKabir is known
        characters: wordChars,
      });
    }
  }

  // Count spaces in the text
  const spaceMatches = text.match(/\s/g);
  spacesCount = spaceMatches ? spaceMatches.length : 0;

  // Compute percentages for each word
  for (const w of wordAnalyses) {
    w.percentage = grandTotalKabir > 0 ? Math.round((w.value / grandTotalKabir) * 1000) / 10 : 0;
  }

  // Compute elemental distribution percentages
  const elementalDistribution: Record<LetterElement, { count: number; percentage: number }> = {
    ناري: {
      count: elementCounts.ناري,
      percentage: pureLettersCount > 0 ? Math.round((elementCounts.ناري / pureLettersCount) * 100) : 0,
    },
    ترابي: {
      count: elementCounts.ترابي,
      percentage: pureLettersCount > 0 ? Math.round((elementCounts.ترابي / pureLettersCount) * 100) : 0,
    },
    هوائي: {
      count: elementCounts.هوائي,
      percentage: pureLettersCount > 0 ? Math.round((elementCounts.هوائي / pureLettersCount) * 100) : 0,
    },
    مائي: {
      count: elementCounts.مائي,
      percentage: pureLettersCount > 0 ? Math.round((elementCounts.مائي / pureLettersCount) * 100) : 0,
    },
  };

  // Compute tier distribution percentages
  const tierDistribution: Record<AbjadTier, { count: number; percentage: number }> = {
    آحاد: {
      count: tierCounts.آحاد,
      percentage: pureLettersCount > 0 ? Math.round((tierCounts.آحاد / pureLettersCount) * 100) : 0,
    },
    عشرات: {
      count: tierCounts.عشرات,
      percentage: pureLettersCount > 0 ? Math.round((tierCounts.عشرات / pureLettersCount) * 100) : 0,
    },
    مئات: {
      count: tierCounts.مئات,
      percentage: pureLettersCount > 0 ? Math.round((tierCounts.مئات / pureLettersCount) * 100) : 0,
    },
    ألوف: {
      count: tierCounts.ألوف,
      percentage: pureLettersCount > 0 ? Math.round((tierCounts.ألوف / pureLettersCount) * 100) : 0,
    },
  };

  // Helper to calculate raw sum of text
  function calculateSimpleSum(str: string): number {
    let s = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const nextChar = i + 1 < str.length ? str[i + 1] : "";
      const hasShaddah = nextChar === SHADDAH_CHAR;
      if (char === SHADDAH_CHAR || /[\u064B-\u0650\u0652\u0670\u0640]/.test(char)) continue;
      const mult = options.shaddahDoubled && hasShaddah ? 2 : 1;
      if (char === "ة") {
        s += options.taaMarbuta * mult;
      } else if (char === "ى") {
        s += options.alifMaqsura * mult;
      } else if (["أ", "إ", "آ", "ٱ", "ء", "ئ", "ؤ"].includes(char)) {
        let bv = 1;
        if (options.hamzaAsCarrier) {
          if (char === "ئ") bv = 10;
          else if (char === "ؤ") bv = 6;
        }
        s += bv * mult;
      } else if (ARABIC_LETTERS_MAP[char]) {
        const val = options.system === "maghrebi" ? ARABIC_LETTERS_MAP[char].maghrebiValue : ARABIC_LETTERS_MAP[char].mashriqiValue;
        s += val * mult;
      }
    }
    return s;
  }

  // Calculate letter frequencies
  const freqMap: Record<string, { count: number; totalPoints: number; meta: LetterMeta }> = {};
  for (const c of allCharacters) {
    if (!c.isArabicLetter) continue;
    const baseChar = c.normalized in ARABIC_LETTERS_MAP
      ? c.normalized
      : (c.normalized === "ة" ? (options.taaMarbuta === 5 ? "ه" : "ت") : (c.normalized === "ى" ? (options.alifMaqsura === 10 ? "ي" : "ا") : "ا"));
    const meta = ARABIC_LETTERS_MAP[baseChar] || ARABIC_LETTERS_MAP["ا"];
    if (!freqMap[c.normalized]) {
      freqMap[c.normalized] = { count: 0, totalPoints: 0, meta };
    }
    freqMap[c.normalized].count++;
    freqMap[c.normalized].totalPoints += c.value;
  }

  const letterFrequencies: LetterFrequency[] = Object.entries(freqMap)
    .map(([char, data]) => ({
      char,
      name: data.meta.nameArabic,
      count: data.count,
      valuePerLetter: options.system === "maghrebi" ? data.meta.maghrebiValue : data.meta.mashriqiValue,
      totalPoints: data.totalPoints,
      percentageOfTotal: grandTotalKabir > 0 ? Math.round((data.totalPoints / grandTotalKabir) * 1000) / 10 : 0,
      element: data.meta.element,
      tier: data.meta.tier,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate lines / poetic hemistichs
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lineAnalyses: LineAnalysis[] = rawLines.map((line, idx) => {
    const hemistichRegex = /\s*(?:\*{2,}|\.{3,}|::|\||—|–)\s*/;
    if (hemistichRegex.test(line)) {
      const parts = line.split(hemistichRegex).filter(Boolean);
      if (parts.length >= 2) {
        const sadr = parts[0].trim();
        const ajuz = parts[1].trim();
        const sadrVal = calculateSimpleSum(sadr);
        const ajuzVal = calculateSimpleSum(ajuz);
        return {
          lineNumber: idx + 1,
          rawLine: line,
          isPoeticBayt: true,
          sadrText: sadr,
          sadrValue: sadrVal,
          ajuzText: ajuz,
          ajuzValue: ajuzVal,
          totalValue: sadrVal + ajuzVal,
        };
      }
    }

    const lineVal = calculateSimpleSum(line);
    return {
      lineNumber: idx + 1,
      rawLine: line,
      isPoeticBayt: false,
      totalValue: lineVal,
    };
  });

  return {
    text,
    totalKabir: grandTotalKabir,
    totalSaghir: grandTotalSaghir,
    digitalRoot: computeDigitalRoot(grandTotalKabir),
    totalLafzi: grandTotalLafzi,
    words: wordAnalyses,
    characters: allCharacters,
    lines: lineAnalyses,
    letterFrequencies,
    stats: {
      pureLettersCount,
      wordsCount: wordAnalyses.length,
      linesCount: lineAnalyses.length,
      diacriticsCount,
      spacesCount,
      shaddahCount,
      ignoredCharsCount,
    },
    elementalDistribution,
    tierDistribution,
  };
}

/**
 * Classical Arabic Number Speller (Tafqeet)
 * Accurately spells out any integer into literary classical Arabic words.
 */
export function tafqeet(num: number): string {
  if (num === 0) return "صفر";
  if (num < 0) return "سالب " + tafqeet(Math.abs(num));

  const ones = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة",
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر",
  ];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = [
    "", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة",
  ];

  function convertGroup(n: number): string {
    if (n === 0) return "";
    let res = "";
    const h = Math.floor(n / 100);
    const rem = n % 100;

    if (h > 0) {
      res = hundreds[h];
    }

    if (rem > 0) {
      let remStr = "";
      if (rem < 20) {
        remStr = ones[rem];
      } else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o === 0) {
          remStr = tens[t];
        } else {
          remStr = `${ones[o]} و${tens[t]}`;
        }
      }
      res = res ? `${res} و${remStr}` : remStr;
    }

    return res;
  }

  const parts: string[] = [];

  // Millions
  const millions = Math.floor(num / 1000000);
  const remMillions = num % 1000000;
  if (millions > 0) {
    if (millions === 1) parts.push("مليون");
    else if (millions === 2) parts.push("مليونان");
    else if (millions >= 3 && millions <= 10) parts.push(`${convertGroup(millions)} ملايين`);
    else parts.push(`${convertGroup(millions)} مليوناً`);
  }

  // Thousands
  const thousands = Math.floor(remMillions / 1000);
  const remainder = remMillions % 1000;
  if (thousands > 0) {
    if (thousands === 1) parts.push("ألف");
    else if (thousands === 2) parts.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertGroup(thousands)} آلاف`);
    else parts.push(`${convertGroup(thousands)} ألفاً`);
  }

  // Units, tens, hundreds
  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  return parts.join(" و");
}

/**
 * Strips all diacritics and tashkeel marks from text
 */
export function stripTashkeel(text: string): string {
  return text.replace(DIACRITICS_REGEX, "").replace(new RegExp(SHADDAH_CHAR, "g"), "");
}

/**
 * Reverse Lookup: Finds minimal canonical Abjad letters that sum to a given target number N.
 * Greedy algorithm picking the highest available letter value from 1000 down to 1.
 */
export function generateCanonicalLettersForNumber(
  target: number,
  system: AbjadSystem = "mashriqi"
): { letters: string[]; equation: string } {
  if (target <= 0 || !Number.isInteger(target)) {
    return { letters: [], equation: "" };
  }

  // Get available letters sorted descending by value in the chosen system
  const letters = Object.values(ARABIC_LETTERS_MAP).map((m) => ({
    char: m.char,
    val: system === "maghrebi" ? m.maghrebiValue : m.mashriqiValue,
  }));
  letters.sort((a, b) => b.val - a.val);

  const result: string[] = [];
  const parts: string[] = [];
  let remaining = target;

  for (const item of letters) {
    while (remaining >= item.val) {
      result.push(item.char);
      parts.push(`${item.char} (${item.val})`);
      remaining -= item.val;
    }
    if (remaining === 0) break;
  }

  return {
    letters: result,
    equation: parts.join(" + "),
  };
}

/**
 * Curated presets for quick tests and historical interest
 */
export interface PresetPhrase {
  title: string;
  category: "آيات وأذكار" | "فلسطين والقدس" | "تأريخ شعري" | "أمثال وحكمة";
  text: string;
  expectedKabirMashriqi: number;
  note: string;
}

export const PRESET_PHRASES: PresetPhrase[] = [
  {
    title: "البسملة الشريفة",
    category: "آيات وأذكار",
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    expectedKabirMashriqi: 786,
    note: "أشهر رقم في حساب الجمل عبر التاريخ (786)، اعتاد الكُتّاب وضعه في صدور الرسائل تبركاً.",
  },
  {
    title: "الحمدلة",
    category: "آيات وأذكار",
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    expectedKabirMashriqi: 582,
    note: "فاتحة كتاب الله تعالى وتمام الشكر والثناء.",
  },
  {
    title: "القدس عاصمة فلسطين",
    category: "فلسطين والقدس",
    text: "القدس عاصمة فلسطين",
    expectedKabirMashriqi: 651,
    note: "رمزية الصمود والهوية والرباط.",
  },
  {
    title: "فلسطين حرة أبية",
    category: "فلسطين والقدس",
    text: "فلسطين حرة أبية",
    expectedKabirMashriqi: 486,
    note: "نداء الحرية والكرامة.",
  },
  {
    title: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    category: "آيات وأذكار",
    text: "قل هو الله أحد",
    expectedKabirMashriqi: 181,
    note: "سورة الإخلاص وأساس التوحيد الخالص.",
  },
  {
    title: "الحكمة ضالة المؤمن",
    category: "أمثال وحكمة",
    text: "الحكمة ضالة المؤمن",
    expectedKabirMashriqi: 288,
    note: "أثر شريف في طلب العلم والمعرفة أنى وجدت.",
  },
];
