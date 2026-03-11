import { CONFIG } from './config.js';

/**
 * ============================================================================
 * NATURAL LANGUAGE PROCESSING (NLP) MODULE
 * ============================================================================
 * Handles text extraction, tokenization, abstract decoding, and similarity algorithms.
 * Upgraded to maximize accuracy alongside Exact-Phrase Querying and N-Gram Chunking.
 */

// Expanded Stop Words list to prevent false positives on common academic phrases
const stopWords = new Set([
    "a", "an", "and", "or", "but", "the", "in", "on", "at", 
    "to", "of", "is", "are", "was", "were", "it", "that", 
    "this", "for", "with", "as", "by", "from", "which", "when", 
    "where", "how", "why", "who", "whom", "whose", "what", "such",
    "there", "then", "we", "our", "us", "be", "been", "has", "have",
    "had", "do", "does", "did", "can", "could", "will", "would",
    "shall", "should", "may", "might", "must", "however", "thus",
    "therefore", "moreover", "furthermore", "also", "addition", "result"
]);

/**
 * Extracts sentences safely without breaking on decimals or common abbreviations.
 * @param {string} text - The full text to split.
 * @returns {Array<string>} List of sentences.
 */
export function extractSentences(text) {
    // Enhanced regex to prevent breaking on e.g., i.e., vs.
    return text.match(/[^.!?\n]+(?:[.!?](?!['"]?\s|$)[^.!?]*)*[.!?]?['"]?(?=\s|$)/g) || [text];
}

/**
 * Tokenizes a string into an array of lowercase words, removing punctuation.
 * @param {string} text - The sentence to tokenize.
 * @returns {Array<string>} Array of word tokens.
 */
export function tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
}

/**
 * Removes common stop words from an array of tokens.
 * @param {Array<string>} tokens - Array of word tokens.
 * @returns {Array<string>} Filtered array without stop words.
 */
export function removeStopWords(tokens) {
    return tokens.filter(w => !stopWords.has(w));
}

/**
 * Generates N-Grams (Phrase Chunks) from a sentence token array.
 * We DO NOT strip punctuation here, because search engines use Exact Quotes ("word, word")
 * and stripping the comma breaks the exact match on the target website.
 * @param {string} text - The original sentence.
 * @param {number} size - The number of words per chunk (e.g., 8).
 * @returns {Array<string>} Array of contiguous phrase chunks.
 */
export function generateNGrams(text, size = CONFIG.searchChunkSize) {
    // Split by spaces but preserve commas/dashes in the chunks
    const tokens = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (tokens.length <= size) return [text.trim()];

    let ngrams = [];
    // We step by `size - 2` to create overlapping chunks. 
    for (let i = 0; i < tokens.length; i += Math.max(1, size - 2)) {
        let chunk = tokens.slice(i, i + size).join(" ");
        // Ensure the final trailing chunk is worth searching (at least 4 words)
        // We strip punctuation JUST to count the true words.
        if (chunk.replace(/[^\w\s]/g, '').split(" ").length >= 4) {
            ngrams.push(chunk);
        }
    }
    return ngrams;
}

/**
 * RECONSTRUCTOR: Decodes the OpenAlex 'abstract_inverted_index' object back into readable text.
 * Essential for comparing user sentences against scientific paper abstracts accurately.
 * @param {Object} invertedIndex - The raw inverted index from the OpenAlex API.
 * @returns {string} The fully reconstructed abstract text.
 */
export function decodeOpenAlexAbstract(invertedIndex) {
    if (!invertedIndex || typeof invertedIndex !== 'object') return "";
    
    let wordsArray = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        positions.forEach(pos => {
            wordsArray[pos] = word;
        });
    }
    // Filter out undefined gaps and join
    return wordsArray.filter(w => w !== undefined).join(" ");
}

/**
 * ADVANCED ALGORITHM: Keyword Overlap + Continuous Sequence Matching
 * Highly tuned for EXACT PHRASE search snippets. Greatly rewards continuous matching strings.
 * Enforces a STRICT 5-word consecutive chain rule to eliminate all false positives.
 * @param {string} userSentence - The original sentence from the user.
 * @param {string} sourceSnippet - The snippet text from a search result.
 * @returns {number} Score between 0.0 and 1.0.
 */
export function calculateSimilarity(userSentence, sourceSnippet) {
    const userTokens = tokenize(userSentence);
    const snippetTokens = tokenize(sourceSnippet);

    if (userTokens.length === 0 || snippetTokens.length === 0) return 0;

    const userKeywords = removeStopWords(userTokens);
    const snippetKeywords = removeStopWords(snippetTokens);

    // 1. Exact Sequence Match (Finds the longest consecutive chain of identical words)
    let maxSequenceLength = 0;
    for (let i = 0; i < userTokens.length; i++) {
        for (let j = 0; j < snippetTokens.length; j++) {
            let k = 0;
            while (
                i + k < userTokens.length && 
                j + k < snippetTokens.length && 
                userTokens[i+k] === snippetTokens[j+k]
            ) {
                k++;
            }
            if (k > maxSequenceLength) maxSequenceLength = k;
        }
    }

    // 2. Keyword Overlap (Fuzzy Match for Synonym-Swapping)
    let matchCount = 0;
    userKeywords.forEach(kw => {
        if (snippetKeywords.includes(kw)) matchCount++;
    });
    let keywordSimilarity = userKeywords.length > 0 ? (matchCount / userKeywords.length) : 0;

    // STRICT VERIFICATION: 
    // If there isn't a solid chain of N matching words...
    let sequenceRatio = maxSequenceLength / userTokens.length;
    let sequenceBoost = 0;
    let ultraBoost = 0;

    if (maxSequenceLength < CONFIG.minSequenceLength) {
        // ...check if it's deeply paraphrased via keyword structural overlap.
        // If they swapped every 4th word, sequence breaks, but overlap remains > 65%.
        // REQUIRE at least 3 distinct keywords to prevent false positives on ultra-short generic sentences.
        if (keywordSimilarity >= CONFIG.highOverlapParaphraseThreshold && userKeywords.length >= 3) {
            // It's a Paraphrase. Calculate purely on keyword overlap, with a sequential boost.
            let fuzzyScore = (keywordSimilarity * 0.80) + (sequenceRatio * 0.20);
            return Math.min(fuzzyScore, 0.84); // Cap below ExactMatchThreshold so it stays "Partial/Paraphrased"
        } else {
            return 0; // Absolute Zero (False Positive Eliminated)
        }
    } else {
        // EXACT CHAIN MATCH
        sequenceBoost = maxSequenceLength >= 6 ? 0.35 : 0; 
        ultraBoost = maxSequenceLength >= 8 ? 0.40 : 0; 
    }

    // FINAL SCORE computation for Exact Matches
    let finalScore = (sequenceRatio * 0.5) + (keywordSimilarity * 0.2) + sequenceBoost + ultraBoost;

    // Cap the mathematical score at 1.0 (100%)
    return Math.min(finalScore, 1.0); 
}

/**
 * Strips HTML tags from a string to return purely raw text.
 * @param {string} html - The HTML string to parse.
 * @returns {string} The plain text content.
 */
export function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}