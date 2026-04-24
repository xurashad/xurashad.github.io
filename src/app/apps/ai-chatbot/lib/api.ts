import { MODELS, type ChatMessage, type ImageSettings } from "./models";

/* ─── API Keys ────────────────────────────────────────────────────────────── */
const OPENROUTER_API_KEY =
  "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";
const PIXAZO_API_KEY = "55a95137ed634c39baed309594bfae6a";

/* ─── Response type ───────────────────────────────────────────────────────── */
export interface AIResponse {
  content: string;
  reasoning: string | null;
  reasoning_details: unknown;
  generatedImages: string[];
}

/* ─── Universal fetch function ────────────────────────────────────────────── */
export async function fetchAIResponse(
  modelKey: string,
  chatMessages: ChatMessage[],
  settings: ImageSettings
): Promise<AIResponse> {
  const modelConfig = MODELS[modelKey];
  if (!modelConfig) throw new Error(`Unknown model: ${modelKey}`);
  const lastMsg = chatMessages[chatMessages.length - 1];

  /* ═══ PIXAZO (Image Gen) ═══ */
  if (modelConfig.provider === "pixazo") {
    const payload: Record<string, unknown> = {
      prompt: lastMsg.content,
      height: parseInt(settings.height) || 1024,
      width: parseInt(settings.width) || 1024,
      num_steps: parseInt(settings.num_steps) || 20,
      seed: parseInt(settings.seed) || Math.floor(Math.random() * 100000),
    };

    if (modelConfig.id === "flux-schnell") {
      payload.num_steps = parseInt(settings.num_steps) || 4;
    }
    if (modelConfig.id === "sdxl" || modelConfig.id === "inpainting") {
      payload.negative_prompt = settings.negative_prompt || "";
      if (modelConfig.id === "sdxl")
        payload.guidance_scale = parseFloat(settings.guidance) || 5;
      if (modelConfig.id === "inpainting")
        payload.guidance = parseFloat(settings.guidance) || 5;
    }
    if (modelConfig.id === "inpainting") {
      if (!lastMsg.image)
        throw new Error(
          "Inpainting requires a base image — use the 📎 button to upload one."
        );
      payload.imageUrl = lastMsg.image;
      payload.maskUrl = settings.mask_url || "";
    }

    const res = await fetch(modelConfig.endpoint!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": PIXAZO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.error || data.message)
      throw new Error(data.error || data.message);

    const imageUrl =
      data.url ||
      data.image ||
      data.imageUrl ||
      data.output ||
      (data.data?.[0]?.url);

    if (!imageUrl)
      throw new Error("No image URL returned. Check API key / payload.");

    return {
      content: `Generated with **${modelConfig.desc}**`,
      reasoning: null,
      reasoning_details: null,
      generatedImages: [imageUrl],
    };
  }

  /* ═══ OPENROUTER ═══ */
  if (modelConfig.isEmbedding) {
    const inputContent: Record<string, unknown>[] = [
      { type: "text", text: lastMsg.content },
    ];
    if (lastMsg.image)
      inputContent.push({
        type: "image_url",
        image_url: { url: lastMsg.image },
      });

    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.id,
        input: [{ content: inputContent }],
        encoding_format: "float",
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const vector: number[] = data.data[0].embedding;

    return {
      content: `**Embedding Vector**\n\n\`[${vector.slice(0, 10).map((n) => n.toFixed(5)).join(", ")}, ...]\`\n*(Length: ${vector.length})*`,
      reasoning: null,
      reasoning_details: null,
      generatedImages: [],
    };
  }

  /* ── Chat completion ── */
  const payload: Record<string, unknown> = {
    model: modelConfig.id,
    messages: chatMessages.map((msg) => {
      const m: Record<string, unknown> = { role: msg.role };
      if (msg.image && modelConfig.supportsVision) {
        m.content = [
          { type: "text", text: msg.content },
          { type: "image_url", image_url: { url: msg.image } },
        ];
      } else {
        m.content = msg.content || "";
      }
      if (msg.reasoning_details)
        m.reasoning_details = msg.reasoning_details;
      return m;
    }),
  };

  if (modelConfig.reasoning) payload.reasoning = { enabled: true };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return {
    content: data.choices[0].message.content || "",
    reasoning: data.choices[0].message.reasoning || null,
    reasoning_details: data.choices[0].message.reasoning_details || null,
    generatedImages: [],
  };
}
