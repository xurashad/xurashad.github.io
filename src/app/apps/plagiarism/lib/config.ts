/**
 * Application-wide configuration constants for the plagiarism scanner.
 */
export const CONFIG = {
  // Search Constraints
  minWordsPerSentence: 5,

  // Concurrency Settings
  maxConcurrentRequests: 5,
  requestDelayMs: 300,
  delayBetweenBatchesMs: 2000,

  // Detection Thresholds
  exactMatchThreshold: 0.85,
  partialMatchThreshold: 0.55,
  highOverlapParaphraseThreshold: 0.65,

  // Strict Verification
  minSequenceLength: 5,
  searchChunkSize: 8,
} as const;
