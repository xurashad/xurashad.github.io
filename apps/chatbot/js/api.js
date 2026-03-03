// ==========================================
// API KEY CONFIGURATION
// ==========================================
const OPENROUTER_API_KEY = "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"; 
const PIXAZO_API_KEY = "55a95137ed634c39baed309594bfae6a"; 

const MODELS = {
    // --- OPENROUTER REASONING MODELS ---
    "trinity-large": { provider: "openrouter", id: "arcee-ai/trinity-large-preview:free", desc: "Trinity Large (Reasoning)", reasoning: true },
    "trinity-mini": { provider: "openrouter", id: "arcee-ai/trinity-mini:free", desc: "Trinity Mini (Reasoning)", reasoning: true },
    "step-flash": { provider: "openrouter", id: "stepfun/step-3.5-flash:free", desc: "Step 3.5 Flash (Reasoning)", reasoning: true },
    "nemotron-3-nano": { provider: "openrouter", id: "nvidia/nemotron-3-nano-30b-a3b:free", desc: "Nemotron 3 Nano (Reasoning)", reasoning: true },
    "gpt-oss-120b": { provider: "openrouter", id: "openai/gpt-oss-120b:free", desc: "GPT OSS 120B (Reasoning)", reasoning: true },
    "gpt-oss-20b": { provider: "openrouter", id: "openai/gpt-oss-20b:free", desc: "GPT OSS 20B (Reasoning)", reasoning: true },

    // --- OPENROUTER VISION MODELS ---
    "nemotron-12b-vl": { provider: "openrouter", id: "nvidia/nemotron-nano-12b-v2-vl:free", desc: "Nemotron 12B VL (Vision + Reasoning)", reasoning: true, supportsVision: true },
    "gemma-3-27b": { provider: "openrouter", id: "google/gemma-3-27b-it:free", desc: "Gemma 3 27B (Vision)", supportsVision: true },
    "gemma-3-12b": { provider: "openrouter", id: "google/gemma-3-12b-it:free", desc: "Gemma 3 12B (Vision)", supportsVision: true },
    "gemma-3-4b": { provider: "openrouter", id: "google/gemma-3-4b-it:free", desc: "Gemma 3 4B (Vision)", supportsVision: true },
    "mistral-small-24b": { provider: "openrouter", id: "mistralai/mistral-small-3.1-24b-instruct:free", desc: "Mistral Small 3.1 24B (Vision)", supportsVision: true },

    // --- OPENROUTER STANDARD TEXT MODELS ---
    "llama-3.3-70b": { provider: "openrouter", id: "meta-llama/llama-3.3-70b-instruct:free", desc: "Llama 3.3 70B Instruct" },
    "llama-3.2-3b": { provider: "openrouter", id: "meta-llama/llama-3.2-3b-instruct:free", desc: "Llama 3.2 3B Instruct" },
    "hermes-3-405b": { provider: "openrouter", id: "nousresearch/hermes-3-llama-3.1-405b:free", desc: "Hermes 3 Llama 405B" },
    "qwen-coder": { provider: "openrouter", id: "qwen/qwen3-coder:free", desc: "Qwen 3 Coder" },
    "qwen-next-80b": { provider: "openrouter", id: "qwen/qwen3-next-80b-a3b-instruct:free", desc: "Qwen 3 Next 80B" },
    "qwen-4b": { provider: "openrouter", id: "qwen/qwen3-4b:free", desc: "Qwen 3 4B" },
    "glm-4.5-air": { provider: "openrouter", id: "z-ai/glm-4.5-air:free", desc: "GLM 4.5 Air" },
    "nemotron-9b-v2": { provider: "openrouter", id: "nvidia/nemotron-nano-9b-v2:free", desc: "Nemotron Nano 9B v2" },
    "lfm-thinking": { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-thinking:free", desc: "Liquid LFM 2.5 1.2B Thinking" },
    "lfm-instruct": { provider: "openrouter", id: "liquid/lfm-2.5-1.2b-instruct:free", desc: "Liquid LFM 2.5 1.2B Instruct" },
    "dolphin-mistral": { provider: "openrouter", id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", desc: "Dolphin Mistral 24B Venice" },
    "gemma-3n-e4b": { provider: "openrouter", id: "google/gemma-3n-e4b-it:free", desc: "Gemma 3n e4b IT" },
    "gemma-3n-e2b": { provider: "openrouter", id: "google/gemma-3n-e2b-it:free", desc: "Gemma 3n e2b IT" },

    // --- OPENROUTER EMBEDDINGS ---
    "nemotron-embed": { provider: "openrouter", id: "nvidia/llama-nemotron-embed-vl-1b-v2:free", desc: "Nemotron Embeddings API", isEmbedding: true, supportsVision: true },

    // --- PIXAZO AI (IMAGE GENERATION) ---
    "pixazo-flux": { provider: "pixazo", id: "flux-schnell", endpoint: "https://gateway.pixazo.ai/flux-1-schnell/v1/getData", desc: "Flux 1 Schnell (Pixazo)", generatesImages: true },
    "pixazo-sdxl": { provider: "pixazo", id: "sdxl", endpoint: "https://gateway.pixazo.ai/getImage/v1/getSDXLImage", desc: "SDXL (Pixazo)", generatesImages: true },
    "pixazo-inpainting": { provider: "pixazo", id: "inpainting", endpoint: "https://gateway.pixazo.ai/inpainting/v1/getImage", desc: "Image Inpainting (Pixazo)", generatesImages: true, supportsVision: true }
};

// Now passes settings for Image Customization
async function fetchAIResponse(modelKey, chatMessages, settings = {}) {
    const modelConfig = MODELS[modelKey];
    const lastMsg = chatMessages[chatMessages.length - 1];
    
    // ==========================================
    // PIXAZO AI IMAGE GENERATION
    // ==========================================
    if (modelConfig.provider === "pixazo") {
        let payload = {
            prompt: lastMsg.content,
            height: parseInt(settings.height) || 1024,
            width: parseInt(settings.width) || 1024,
            num_steps: parseInt(settings.num_steps) || 20,
            seed: parseInt(settings.seed) || Math.floor(Math.random() * 100000)
        };

        if (modelConfig.id === "flux-schnell") {
            payload.num_steps = parseInt(settings.num_steps) || 4; // Flux prefers 4 steps
        }

        if (modelConfig.id === "sdxl" || modelConfig.id === "inpainting") {
            payload.negative_prompt = settings.negative_prompt || "";
            if (modelConfig.id === "sdxl") payload.guidance_scale = parseFloat(settings.guidance) || 5;
            if (modelConfig.id === "inpainting") payload.guidance = parseFloat(settings.guidance) || 5;
        }

        if (modelConfig.id === "inpainting") {
            if(!lastMsg.image) throw new Error("Inpainting requires you to upload a base image (using the paperclip icon).");
            payload.imageUrl = lastMsg.image;
            payload.maskUrl = settings.mask_url || ""; // Provided via Settings Modal
        }

        const response = await fetch(modelConfig.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "Ocp-Apim-Subscription-Key": PIXAZO_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error || data.message) throw new Error(data.error || data.message);

        // Pixazo returns URLs in different keys based on the model. Check common ones.
        const imageUrl = data.url || data.image || data.imageUrl || data.output || (data.data && data.data[0] && data.data[0].url);
        
        if(!imageUrl) throw new Error("No image URL returned from Pixazo. Check your payload or API key.");

        return {
            content: `Generated with **${modelConfig.desc}**`,
            reasoning: null, reasoning_details: null,
            generatedImages: [imageUrl]
        };
    }

    // ==========================================
    // OPENROUTER API LOGIC 
    // ==========================================
    if (modelConfig.provider === "openrouter") {
        // Embeddings Handling
        if (modelConfig.isEmbedding) {
            const inputContent = [{ type: "text", text: lastMsg.content }];
            if (lastMsg.image) inputContent.push({ type: "image_url", image_url: { url: lastMsg.image } });

            const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
                method: "POST",
                headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: modelConfig.id, input: [{ content: inputContent }], encoding_format: "float" })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const vector = data.data[0].embedding;
            return {
                content: `**Embedding Vector**\n\n\`[${vector.slice(0, 10).map(n => n.toFixed(5)).join(", ")}, ...]\`\n*(Length: ${vector.length})*`,
                reasoning: null, reasoning_details: null, generatedImages: []
            };
        }

        // Chat Handling
        const payload = { model: modelConfig.id, messages: [] };
        if (modelConfig.reasoning) payload.reasoning = { enabled: true };

        chatMessages.forEach(msg => {
            const cleanMsg = { role: msg.role };
            if (msg.image && modelConfig.supportsVision) {
                cleanMsg.content = [{ type: "text", text: msg.content }, { type: "image_url", image_url: { url: msg.image } }];
            } else {
                cleanMsg.content = msg.content || "";
            }
            if (msg.reasoning_details) cleanMsg.reasoning_details = msg.reasoning_details;
            payload.messages.push(cleanMsg);
        });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return {
            content: data.choices[0].message.content || "",
            reasoning: data.choices[0].message.reasoning || null,
            reasoning_details: data.choices[0].message.reasoning_details || null,
            generatedImages: []
        };
    }
}