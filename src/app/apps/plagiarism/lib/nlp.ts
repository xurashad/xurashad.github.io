import { CONFIG } from "./config";

/**
 * NLP module — sentence extraction, tokenisation, N-gram generation,
 * OpenAlex abstract decoding, and the core similarity algorithm.
 */

// Expanded stop-words list
const STOP_WORDS = new Set([
  "a", "an", "and", "or", "but", "the", "in", "on", "at",
  "to", "of", "is", "are", "was", "were", "it", "that",
  "this", "for", "with", "as", "by", "from", "which", "when",
  "where", "how", "why", "who", "whom", "whose", "what", "such",
  "there", "then", "we", "our", "us", "be", "been", "has", "have",
  "had", "do", "does", "did", "can", "could", "will", "would",
  "shall", "should", "may", "might", "must", "however", "thus",
  "therefore", "moreover", "furthermore", "also", "addition", "result",
]);

/** Splits text into sentences without breaking on decimals/abbreviations. */
export function extractSentences(text: string): string[] {
  return (
    text.match(
      /[^.!?\n]+(?:[.!?](?!['"']?\s|$)[^.!?]*)*[.!?]?['"']?(?=\s|$)/g
    ) ?? [text]
  );
}

/** Tokenises a string into lowercase words, stripping punctuation. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Removes stop words from a token array. */
export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((w) => !STOP_WORDS.has(w));
}

/**
 * Generates overlapping N-gram phrase chunks from a sentence.
 * Preserves commas/dashes so exact-phrase queries work correctly.
 */
export function generateNGrams(
  text: string,
  size: number = CONFIG.searchChunkSize
): string[] {
  const tokens = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (tokens.length <= size) return [text.trim()];

  const ngrams: string[] = [];
  for (let i = 0; i < tokens.length; i += Math.max(1, size - 2)) {
    const chunk = tokens.slice(i, i + size).join(" ");
    // Only include if at least 4 real words remain
    if (chunk.replace(/[^\w\s]/g, "").split(" ").length >= 4) {
      ngrams.push(chunk);
    }
  }
  return ngrams;
}

/**
 * Reconstructs a human-readable abstract from OpenAlex's
 * `abstract_inverted_index` format.
 */
export function decodeOpenAlexAbstract(
  invertedIndex: Record<string, number[]>
): string {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const wordsArray: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach((pos) => {
      wordsArray[pos] = word;
    });
  }
  return wordsArray.filter(Boolean).join(" ");
}

/**
 * Core similarity algorithm: keyword overlap + longest consecutive
 * sequence matching, with a strict 5-word chain requirement.
 * Returns a score between 0.0 and 1.0.
 */
export function calculateSimilarity(
  userSentence: string,
  sourceSnippet: string
): number {
  const userTokens = tokenize(userSentence);
  const snippetTokens = tokenize(sourceSnippet);

  if (userTokens.length === 0 || snippetTokens.length === 0) return 0;

  const userKeywords = removeStopWords(userTokens);
  const snippetKeywords = removeStopWords(snippetTokens);

  // 1. Longest consecutive sequence match
  let maxSeq = 0;
  for (let i = 0; i < userTokens.length; i++) {
    for (let j = 0; j < snippetTokens.length; j++) {
      let k = 0;
      while (
        i + k < userTokens.length &&
        j + k < snippetTokens.length &&
        userTokens[i + k] === snippetTokens[j + k]
      ) {
        k++;
      }
      if (k > maxSeq) maxSeq = k;
    }
  }

  // 2. Keyword overlap (fuzzy match for synonym-swapping)
  let matchCount = 0;
  userKeywords.forEach((kw) => {
    if (snippetKeywords.includes(kw)) matchCount++;
  });
  const kwSim =
    userKeywords.length > 0 ? matchCount / userKeywords.length : 0;
  const seqRatio = maxSeq / userTokens.length;

  if (maxSeq < CONFIG.minSequenceLength) {
    // Check for deep paraphrase via keyword overlap
    if (
      kwSim >= CONFIG.highOverlapParaphraseThreshold &&
      userKeywords.length >= 3
    ) {
      return Math.min(kwSim * 0.8 + seqRatio * 0.2, 0.84);
    }
    return 0;
  }

  // Exact chain match scoring
  const seqBoost = maxSeq >= 6 ? 0.35 : 0;
  const ultraBoost = maxSeq >= 8 ? 0.4 : 0;
  return Math.min(seqRatio * 0.5 + kwSim * 0.2 + seqBoost + ultraBoost, 1.0);
}

/**
 * Strips HTML tags from a string using a regex approach
 * (safe for both browser and SSR contexts).
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim();
}
