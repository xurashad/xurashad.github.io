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
  "trinity-large":  { provider: "openrouter", id: "arcee-ai/trinity-large-preview:free",     desc: "Trinity Large (Reasoning)", reasoning: true },
  "trinity-mini":   { provider: "openrouter", id: "arcee-ai/trinity-mini:free",               desc: "Trinity Mini (Reasoning)",  reasoning: true },
  "step-flash":     { provider: "openrouter", id: "stepfun/step-3.5-flash:free",              desc: "Step 3.5 Flash (Reasoning)", reasoning: true },
  "nemotron-3-nano":{ provider: "openrouter", id: "nvidia/nemotron-3-nano-30b-a3b:free",      desc: "Nemotron 3 Nano (Reasoning)", reasoning: true },
  "gpt-oss-120b":   { provider: "openrouter", id: "openai/gpt-oss-120b:free",                 desc: "GPT OSS 120B (Reasoning)",  reasoning: true },
  "gpt-oss-20b":    { provider: "openrouter", id: "openai/gpt-oss-20b:free",                  desc: "GPT OSS 20B (Reasoning)",   reasoning: true },

  /* ── OpenRouter Vision ── */
  "nemotron-12b-vl":  { provider: "openrouter", id: "nvidia/nemotron-nano-12b-v2-vl:free",    desc: "Nemotron 12B VL (Vision + Reasoning)", reasoning: true, supportsVision: true },
  "gemma-3-27b":      { provider: "openrouter", id: "google/gemma-3-27b-it:free",             desc: "Gemma 3 27B (Vision)",       supportsVision: true },
  "gemma-3-12b":      { provider: "openrouter", id: "google/gemma-3-12b-it:free",             desc: "Gemma 3 12B (Vision)",       supportsVision: true },
  "gemma-3-4b":       { provider: "openrouter", id: "google/gemma-3-4b-it:free",              desc: "Gemma 3 4B (Vision)",        supportsVision: true },
  "mistral-small-24b":{ provider: "openrouter", id: "mistralai/mistral-small-3.1-24b-instruct:free", desc: "Mistral Small 3.1 24B (Vision)", supportsVision: true },

  /* ── OpenRouter Text ── */
  "llama-3.3-70b":    { provider: "openrouter", id: "meta-llama/llama-3.3-70b-instruct:free", desc: "Llama 3.3 70B Instruct" },
  "llama-3.2-3b":     { provider: "openrouter", id: "meta-llama/llama-3.2-3b-instruct:free",  desc: "Llama 3.2 3B Instruct" },
  "hermes-3-405b":    { provider: "openrouter", id: "nousresearch/hermes-3-llama-3.1-405b:free", desc: "Hermes 3 Llama 405B" },
  "qwen-coder":       { provider: "openrouter", id: "qwen/qwen3-coder:free",                  desc: "Qwen 3 Coder" },
  "qwen-next-80b":    { provider: "openrouter", id: "qwen/qwen3-next-80b-a3b-instruct:free",  desc: "Qwen 3 Next 80B" },
  "qwen-4b":          { provider: "openrouter", id: "qwen/qwen3-4b:free",                     desc: "Qwen 3 4B" },
  "glm-4.5-air":      { provider: "openrouter", id: "z-ai/glm-4.5-air:free",                  desc: "GLM 4.5 Air" },
  "nemotron-9b-v2":   { provider: "openrouter", id: "nvidia/nemotron-nano-9b-v2:free",         desc: "Nemotron Nano 9B v2" },
  "lfm-thinking":     { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-thinking:free",      desc: "Liquid LFM 2.5 1.2B Thinking" },
  "lfm-instruct":     { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-instruct:free",      desc: "Liquid LFM 2.5 1.2B Instruct" },
  "dolphin-mistral":  { provider: "openrouter", id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", desc: "Dolphin Mistral 24B Venice" },
  "gemma-3n-e4b":     { provider: "openrouter", id: "google/gemma-3n-e4b-it:free",            desc: "Gemma 3n e4b IT" },
  "gemma-3n-e2b":     { provider: "openrouter", id: "google/gemma-3n-e2b-it:free",            desc: "Gemma 3n e2b IT" },

  /* ── OpenRouter Embeddings ── */
  "nemotron-embed": { provider: "openrouter", id: "nvidia/llama-nemotron-embed-vl-1b-v2:free", desc: "Nemotron Embeddings API", isEmbedding: true, supportsVision: true },

  /* ── Pixazo AI Image Generation ── */
  "pixazo-flux":       { provider: "pixazo", id: "flux-schnell",  endpoint: "https://gateway.pixazo.ai/flux-1-schnell/v1/getData",   desc: "Flux 1 Schnell (Pixazo)", generatesImages: true },
  "pixazo-sdxl":       { provider: "pixazo", id: "sdxl",          endpoint: "https://gateway.pixazo.ai/getImage/v1/getSDXLImage",    desc: "SDXL (Pixazo)",           generatesImages: true },
  "pixazo-inpainting": { provider: "pixazo", id: "inpainting",    endpoint: "https://gateway.pixazo.ai/inpainting/v1/getImage",      desc: "Image Inpainting (Pixazo)", generatesImages: true, supportsVision: true },
};

export const MODEL_GROUPS = [
  { label: "🧠 Reasoning Models (OpenRouter)", keys: ["trinity-large", "trinity-mini", "step-flash", "nemotron-3-nano", "gpt-oss-120b", "gpt-oss-20b"] },
  { label: "👁️ Vision Models (OpenRouter)",    keys: ["nemotron-12b-vl", "gemma-3-27b", "gemma-3-12b", "gemma-3-4b", "mistral-small-24b"] },
  { label: "💬 Text Models (OpenRouter)",       keys: ["llama-3.3-70b", "llama-3.2-3b", "hermes-3-405b", "qwen-coder", "qwen-next-80b", "qwen-4b", "glm-4.5-air", "nemotron-9b-v2", "lfm-thinking", "lfm-instruct", "dolphin-mistral", "gemma-3n-e4b", "gemma-3n-e2b"] },
  { label: "🎨 Image Generation (Pixazo AI)",   keys: ["pixazo-flux", "pixazo-sdxl", "pixazo-inpainting"] },
  { label: "⚙️ Embeddings (OpenRouter)",         keys: ["nemotron-embed"] },
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
