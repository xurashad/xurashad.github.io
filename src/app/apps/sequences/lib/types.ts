export type StudioTab = "sequences" | "constants" | "lab";

export type SequenceCategory = "recurrence" | "primes" | "combinatorial";

export type SequenceId =
  | "fibonacci"
  | "lucas"
  | "tribonacci"
  | "pell"
  | "padovan"
  | "jacobsthal"
  | "primes"
  | "twin_primes"
  | "sophie_germain"
  | "mersenne"
  | "palindromic_primes"
  | "recaman"
  | "collatz_steps"
  | "catalan"
  | "factorials"
  | "bell"
  | "partitions"
  | "triangular"
  | "look_and_say";

export type ConstantCategory = "fundamental" | "algebraic" | "analytic";

export type ConstantId =
  | "pi"
  | "tau"
  | "e"
  | "phi"
  | "sqrt2"
  | "sqrt3"
  | "silver"
  | "custom_sqrt"
  | "ln2"
  | "ln10"
  | "apery"
  | "catalan_g"
  | "plastic"
  | "tribonacci_const"
  | "gamma";

export type SequenceMode = "full" | "nth" | "range";
export type ExportFormat = "json" | "csv" | "txt";
export type SequenceVisualizerType = "growth" | "spiral" | "arcs" | "gaps";

export interface SequenceMeta {
  id: SequenceId;
  name: string;
  category: SequenceCategory;
  oeis: string;
  formulaTex: string;
  description: string;
  algorithmFull: string;
  algorithmNth?: string;
  supportsNth: boolean;
  supportsRange: boolean;
  startIndex: number; // 0-indexed (e.g. Fibonacci F(0)=0) or 1-indexed (e.g. Primes P(1)=2)
  defaultCount: number;
  defaultMaxFull: number;
  defaultMaxNth: number;
  unlockedMaxFull: number;
  growthNote: string;
  accentHex: string;
  preview: string;
  facts: string[];
  defaultVisualizer: SequenceVisualizerType;
}

export interface ConstantMeta {
  id: ConstantId;
  symbol: string;
  name: string;
  category: ConstantCategory;
  formulaTex: string;
  description: string;
  algorithm: string;
  defaultDigits: number;
  maxDefaultDigits: number;
  unlockedMaxDigits: number;
  hasCustomParam?: boolean;
  referencePrefix: string;
  accentHex: string;
  facts: string[];
}

export interface SequenceResult {
  sequenceId: SequenceId;
  mode: SequenceMode;
  startIndex: number;
  totalCount: number;
  terms: string[];
  nthIndex?: number;
  nthValue?: string;
  elapsedMs: number;
  algorithmUsed: string;
  maxNumeric?: number;
}

export interface ConstantResult {
  constantId: ConstantId;
  customParam?: number;
  integerPart: string;
  fractionalDigits: string;
  totalDigits: number;
  elapsedMs: number;
  algorithmUsed: string;
  continuedFraction: number[];
  convergents: { num: string; den: string }[];
}
