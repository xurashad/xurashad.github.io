/**
 * ============================================================================
 * CONFIGURATION & CONSTANTS
 * ============================================================================
 * Application-wide settings and thresholds for the plagiarism algorithms.
 */

export const CONFIG = {
    // Search Constraints
    minWordsPerSentence: 5,      
    
    // Concurrency Settings (Speed Enhancements)
    maxConcurrentRequests: 5,    // Number of sentences to scan simultaneously
    requestDelayMs: 300,         // Small delay between batched items (ms)
    delayBetweenBatchesMs: 2000, // Wait 2 seconds between full batches to prevent API bans

    // Detection Thresholds (Advanced Accuracy Enhancements)
    exactMatchThreshold: 0.85,   // 85% similarity required for an Exactly Copied match
    partialMatchThreshold: 0.55, // 55% similarity required for a Paraphrased match (stricter)
    highOverlapParaphraseThreshold: 0.65, // 65% keyword overlap required to flag synonym-swapping
    
    // Strict Verification Rules
    minSequenceLength: 5,        // MUST have at least 5 strictly consecutive identical words to trigger an EXACT flag
    searchChunkSize: 8           // We search APIs using targeted 8-word N-Grams for precision
};