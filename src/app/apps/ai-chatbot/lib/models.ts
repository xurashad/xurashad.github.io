/* ─── Model Definitions ───────────────────────────────────────────────────── */

export interface ModelConfig {
  provider: "openrouter" | "pixazo";
  id: string;
  desc: string;
  endpoint?: string;
  reasoning?: boolean;
  supportsVision?: boolean;
  isEmbedding?: boolean;
  generatesImages?: boolean;
}

export const MODELS: Record<string, ModelConfig> = {
  /* ── OpenRouter Reasoning ── */
  "nemotron-3-ultra":   { provider: "openrouter", id: "nvidia/nemotron-3-ultra-550b-a55b:free",                desc: "Nemotron 3 Ultra 550B (Reasoning)",   reasoning: true },
  "nemotron-3-super":   { provider: "openrouter", id: "nvidia/nemotron-3-super-120b-a12b:free",                desc: "Nemotron 3 Super 120B (Reasoning)",   reasoning: true },
  "nemotron-3-nano":    { provider: "openrouter", id: "nvidia/nemotron-3-nano-30b-a3b:free",                   desc: "Nemotron 3 Nano 30B (Reasoning)",     reasoning: true },
  "gpt-oss-120b":       { provider: "openrouter", id: "openai/gpt-oss-120b:free",                             desc: "GPT OSS 120B (Reasoning)",            reasoning: true },
  "gpt-oss-20b":        { provider: "openrouter", id: "openai/gpt-oss-20b:free",                              desc: "GPT OSS 20B (Reasoning)",             reasoning: true },
  "laguna-m1":          { provider: "openrouter", id: "poolside/laguna-m.1:free",                              desc: "Poolside Laguna M.1 (Reasoning)",     reasoning: true },
  "laguna-xs2":         { provider: "openrouter", id: "poolside/laguna-xs.2:free",                             desc: "Poolside Laguna XS.2 (Reasoning)",    reasoning: true },
  "lfm-thinking":       { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-thinking:free",                    desc: "Liquid LFM 2.5 1.2B Thinking",        reasoning: true },

  /* ── OpenRouter Vision ── */
  "gemma-4-31b":        { provider: "openrouter", id: "google/gemma-4-31b-it:free",                           desc: "Gemma 4 31B (Vision + Reasoning)",    reasoning: true, supportsVision: true },
  "gemma-4-26b":        { provider: "openrouter", id: "google/gemma-4-26b-a4b-it:free",                       desc: "Gemma 4 26B A4B (Vision + Reasoning)",reasoning: true, supportsVision: true },
  "nemotron-omni":      { provider: "openrouter", id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",    desc: "Nemotron 3 Nano Omni (Vision + Reasoning)", reasoning: true, supportsVision: true },
  "nemotron-12b-vl":    { provider: "openrouter", id: "nvidia/nemotron-nano-12b-v2-vl:free",                   desc: "Nemotron 12B VL (Vision + Reasoning)",reasoning: true, supportsVision: true },
  "nex-n2-pro":         { provider: "openrouter", id: "nex-agi/nex-n2-pro:free",                              desc: "Nex-N2-Pro (Vision + Reasoning)",     reasoning: true, supportsVision: true },

  /* ── OpenRouter Text ── */
  "llama-3.3-70b":      { provider: "openrouter", id: "meta-llama/llama-3.3-70b-instruct:free",               desc: "Llama 3.3 70B Instruct" },
  "llama-3.2-3b":       { provider: "openrouter", id: "meta-llama/llama-3.2-3b-instruct:free",                desc: "Llama 3.2 3B Instruct" },
  "hermes-3-405b":      { provider: "openrouter", id: "nousresearch/hermes-3-llama-3.1-405b:free",            desc: "Hermes 3 Llama 405B" },
  "qwen-coder":         { provider: "openrouter", id: "qwen/qwen3-coder:free",                                desc: "Qwen 3 Coder 480B" },
  "qwen-next-80b":      { provider: "openrouter", id: "qwen/qwen3-next-80b-a3b-instruct:free",                desc: "Qwen 3 Next 80B" },
  "nemotron-9b-v2":     { provider: "openrouter", id: "nvidia/nemotron-nano-9b-v2:free",                       desc: "Nemotron Nano 9B v2",                 reasoning: true },
  "lfm-instruct":       { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-instruct:free",                    desc: "Liquid LFM 2.5 1.2B Instruct" },
  "dolphin-mistral":    { provider: "openrouter", id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", desc: "Dolphin Mistral 24B Venice" },

  /* ── Pixazo AI Image Generation ── */
  "pixazo-flux":       { provider: "pixazo", id: "flux-schnell",  endpoint: "https://gateway.pixazo.ai/flux-1-schnell/v1/getData",   desc: "Flux 1 Schnell (Pixazo)", generatesImages: true },
  "pixazo-sdxl":       { provider: "pixazo", id: "sdxl",          endpoint: "https://gateway.pixazo.ai/getImage/v1/getSDXLImage",    desc: "SDXL (Pixazo)",           generatesImages: true },
  "pixazo-inpainting": { provider: "pixazo", id: "inpainting",    endpoint: "https://gateway.pixazo.ai/inpainting/v1/getImage",      desc: "Image Inpainting (Pixazo)", generatesImages: true, supportsVision: true },
};

export const MODEL_GROUPS = [
  { label: "🧠 Reasoning Models",    keys: ["nemotron-3-ultra", "nemotron-3-super", "nemotron-3-nano", "gpt-oss-120b", "gpt-oss-20b", "laguna-m1", "laguna-xs2", "lfm-thinking"] },
  { label: "👁️ Vision Models",       keys: ["gemma-4-31b", "gemma-4-26b", "nemotron-omni", "nemotron-12b-vl", "nex-n2-pro"] },
  { label: "💬 Text Models",          keys: ["llama-3.3-70b", "llama-3.2-3b", "hermes-3-405b", "qwen-coder", "qwen-next-80b", "nemotron-9b-v2", "lfm-instruct", "dolphin-mistral"] },
  { label: "🎨 Image Generation (Pixazo AI)", keys: ["pixazo-flux", "pixazo-sdxl", "pixazo-inpainting"] },
];

/* ─── Chat Types ──────────────────────────────────────────────────────────── */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string | null;
  reasoning?: string | null;
  reasoning_details?: unknown;
  generatedImages?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ImageSettings {
  width: string;
  height: string;
  num_steps: string;
  guidance: string;
  seed: string;
  negative_prompt: string;
  mask_url: string;
}

export const DEFAULT_SETTINGS: ImageSettings = {
  width: "1024",
  height: "1024",
  num_steps: "20",
  guidance: "5",
  seed: "42",
  negative_prompt: "",
  mask_url: "",
};
