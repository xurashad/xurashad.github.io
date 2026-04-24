import { CONFIG } from "./config";
import { extractSentences, generateNGrams, calculateSimilarity } from "./nlp";
import {
  searchWikipedia,
  searchAcademic,
  searchWeb,
  fetchFullWebpageText,
  SearchResult,
} from "./api";

/** A flagged sentence with its matched sources. */
export interface MatchGroup {
  sentence: string;
  isExact: boolean;
  isParaphrased: boolean;
  sources: (SearchResult & { similarity: number })[];
}

/** The complete scan report returned from performScan(). */
export interface ScanReport {
  plagiarizedPercent: number;
  /** Result per sentence: null = skipped (too short). */
  sentences: SentenceResult[];
  matches: MatchGroup[];
}

export interface SentenceResult {
  text: string;
  wordCount: number;
  isPlagiarized: boolean;
  isExact?: boolean;
  isParaphrased?: boolean;
  matchGroupIndex?: number; // index into ScanReport.matches
}

/** Callback invoked after every processed batch. */
export type ProgressCallback = (
  percent: number,
  message: string
) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Single-sentence processor ────────────────────────────────────────────────

async function processSentence(
  sentence: string,
  excludedDomains: string[],
  signal: AbortSignal
): Promise<{
  wordCount: number;
  isPlagiarized: boolean;
  isExact?: boolean;
  isParaphrased?: boolean;
  sources?: (SearchResult & { similarity: number })[];
}> {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount < CONFIG.minWordsPerSentence) {
    return { wordCount, isPlagiarized: false };
  }

  const chunks = generateNGrams(sentence, CONFIG.searchChunkSize);
  const primary = chunks[0];
  const secondary =
    chunks.length > 2
      ? chunks[Math.floor(chunks.length / 2)]
      : chunks.length > 1
      ? chunks[1]
      : null;

  const abortIfNeeded = () => {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  };

  const safeSearch = async <T>(
    fn: () => Promise<T>
  ): Promise<T | never[]> => {
    try {
      return await fn();
    } catch (e) {
      if ((e as DOMException).name === "AbortError") throw e;
      return [];
    }
  };

  abortIfNeeded();
  let [wikiData, academicData, webData] = await Promise.all([
    safeSearch(() => searchWikipedia(primary, signal)),
    safeSearch(() => searchAcademic(primary, signal)),
    safeSearch(() => searchWeb(primary, true, signal)),
  ]);

  let allResults = [...wikiData, ...academicData, ...webData];

  // Secondary chunk fallback
  if (allResults.length === 0 && secondary) {
    abortIfNeeded();
    const [w2, a2, web2] = await Promise.all([
      safeSearch(() => searchWikipedia(secondary, signal)),
      safeSearch(() => searchAcademic(secondary, signal)),
      safeSearch(() => searchWeb(secondary, true, signal)),
    ]);
    allResults = [...w2, ...a2, ...web2];
  }

  // Unquoted fallback
  if (allResults.length === 0) {
    abortIfNeeded();
    const fallback = await safeSearch(() => searchWeb(primary, false, signal));
    allResults = [...fallback];
  }

  // Deep URL fetching for top non-Wikipedia results
  let fetchCount = 0;
  await Promise.all(
    allResults.map(async (res) => {
      if (
        res.sourceType !== "Wikipedia" &&
        res.url?.startsWith("http") &&
        fetchCount < 2
      ) {
        fetchCount++;
        try {
          const fullText = await fetchFullWebpageText(res.url, signal);
          if (fullText && fullText.length > res.snippet.length) {
            res.snippet = fullText;
          }
        } catch (e) {
          if ((e as DOMException).name === "AbortError") throw e;
        }
      }
    })
  );

  // Score each result against the full sentence
  const matched: (SearchResult & { similarity: number })[] = [];
  let highestSim = 0;

  allResults.forEach((res) => {
    const excluded = excludedDomains.some((d) =>
      res.url.toLowerCase().includes(d)
    );
    if (excluded) return;

    const sim = calculateSimilarity(sentence, res.snippet);
    if (sim > highestSim) highestSim = sim;

    if (sim >= CONFIG.partialMatchThreshold) {
      if (!matched.some((m) => m.url === res.url)) {
        matched.push({ ...res, similarity: sim });
      }
    }
  });

  if (matched.length === 0) {
    return { wordCount, isPlagiarized: false };
  }

  matched.sort((a, b) => b.similarity - a.similarity);
  const isExact = highestSim >= CONFIG.exactMatchThreshold;
  return {
    wordCount,
    isPlagiarized: true,
    isExact,
    isParaphrased: !isExact,
    sources: matched,
  };
}

// ─── Main scan orchestrator ───────────────────────────────────────────────────

export async function performScan(
  userText: string,
  excludeUrlsRaw: string,
  signal: AbortSignal,
  onProgress: ProgressCallback
): Promise<ScanReport> {
  const sentences = extractSentences(userText);
  const excludedDomains = excludeUrlsRaw
    .toLowerCase()
    .split(",")
    .map((d) => d.trim().replace(/^https?:\/\//, ""))
    .filter((d) => d.length > 0);

  const orderedResults: Awaited<ReturnType<typeof processSentence>>[] =
    new Array(sentences.length);

  for (let i = 0; i < sentences.length; i += CONFIG.maxConcurrentRequests) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const batch = sentences.slice(i, i + CONFIG.maxConcurrentRequests);
    await Promise.all(
      batch.map(async (sentence, batchIdx) => {
        const idx = i + batchIdx;
        orderedResults[idx] = await processSentence(
          sentence,
          excludedDomains,
          signal
        );
      })
    );

    const done = Math.min(i + batch.length, sentences.length);
    const pct = Math.round((done / sentences.length) * 100);
    onProgress(pct, `Scanned ${done} of ${sentences.length} sentences…`);

    if (done < sentences.length) {
      await sleep(CONFIG.delayBetweenBatchesMs);
    }
  }

  // Compile report
  let totalWords = 0;
  let plagWords = 0;
  const sentenceResults: SentenceResult[] = [];
  const matches: MatchGroup[] = [];

  orderedResults.forEach((res, idx) => {
    if (!res) return;
    totalWords += res.wordCount;

    if (res.isPlagiarized && res.sources) {
      plagWords += res.wordCount;
      const matchGroupIndex = matches.length;
      matches.push({
        sentence: sentences[idx].trim(),
        isExact: !!res.isExact,
        isParaphrased: !!res.isParaphrased,
        sources: res.sources,
      });
      sentenceResults.push({
        text: sentences[idx],
        wordCount: res.wordCount,
        isPlagiarized: true,
        isExact: res.isExact,
        isParaphrased: res.isParaphrased,
        matchGroupIndex,
      });
    } else {
      sentenceResults.push({
        text: sentences[idx],
        wordCount: res.wordCount,
        isPlagiarized: false,
      });
    }
  });

  const plagiarizedPercent =
    totalWords > 0 ? Math.round((plagWords / totalWords) * 100) : 0;

  return { plagiarizedPercent, sentences: sentenceResults, matches };
}
