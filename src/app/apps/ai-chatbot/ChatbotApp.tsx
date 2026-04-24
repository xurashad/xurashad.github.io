"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MODELS,
  MODEL_GROUPS,
  DEFAULT_SETTINGS,
  type Chat,
  type ChatMessage,
  type ImageSettings,
} from "./lib/models";
import { fetchAIResponse } from "./lib/api";
import "./chatbot.css";

/* ── Markdown formatter ─── */
function formatMessage(text: string): string {
  if (!text) return "";
  let s = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const codeBlocks: string[] = [];
  s = s.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `__CB_${codeBlocks.length - 1}__`;
  });
  s = s.replace(/`([^`]+)`/g, '<code class="cb-inline">$1</code>');
  s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.*?)\*/g, "<em>$1</em>");
  s = s.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  s = s.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  s = s.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  s = s.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>");
  s = s.replace(/^\s*[-*]\s+(.*$)/gim, "<li>$1</li>");
  s = s.replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/gim, "<ul>$1</ul>");
  s = s.replace(/__CB_(\d+)__/g, (_, i) => codeBlocks[Number(i)]);
  return s;
}

/* ── localStorage helpers ─── */
const STORAGE_KEY = "trinity_chats";
function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    /* storage full — handled by UI */
  }
}

/* ── SVG icons (inlined) ─── */
const AiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChatbotApp() {
  /* ── Core state ── */
  const [chats, setChats] = useState<Chat[]>(() => {
    const loaded = loadChats();
    if (loaded.length === 0) {
      const initial: Chat = { id: Date.now().toString(), title: "New Chat", messages: [] };
      return [initial];
    }
    return loaded;
  });
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    const loaded = loadChats();
    return loaded.length > 0 ? loaded[0].id : Date.now().toString();
  });
  const [selectedModel, setSelectedModel] = useState("trinity-large");
  const [isWaiting, setIsWaiting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  /* ── Persist chats ── */
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages?.length, scrollToBottom]);

  /* ── Textarea auto-resize ── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputText]);

  /* ── Chat CRUD ── */
  function createNewChat() {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  }

  function switchChat(id: string) {
    setCurrentChatId(id);
    setSidebarOpen(false);
  }

  function deleteCurrentChat() {
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== currentChatId);
      if (updated.length === 0) {
        const newChat: Chat = { id: Date.now().toString(), title: "New Chat", messages: [] };
        setCurrentChatId(newChat.id);
        return [newChat];
      }
      setCurrentChatId(updated[0].id);
      return updated;
    });
  }

  /* ── Send message ── */
  async function sendMessage() {
    const text = inputText.trim();
    if ((!text && !attachedImage) || isWaiting) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      image: attachedImage,
    };

    /* update chats with user message */
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== currentChatId) return c;
        const updated = { ...c, messages: [...c.messages, userMsg] };
        if (c.messages.length === 0)
          updated.title = text.substring(0, 24) + (text.length > 24 ? "…" : "");
        return updated;
      })
    );

    setInputText("");
    setAttachedImage(null);
    setIsWaiting(true);

    try {
      const allMessages = [...(currentChat?.messages || []), userMsg];
      const response = await fetchAIResponse(selectedModel, allMessages, imageSettings);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.content,
        reasoning: response.reasoning,
        reasoning_details: response.reasoning_details,
        generatedImages: response.generatedImages,
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, assistantMsg] }
            : c
        )
      );
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "⚠️ Error: " + (err instanceof Error ? err.message : "Unknown error"),
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, errMsg] }
            : c
        )
      );
    } finally {
      setIsWaiting(false);
      textareaRef.current?.focus();
    }
  }

  /* ── Image upload ── */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!MODELS[selectedModel]?.supportsVision) {
      alert("⚠️ This model doesn't support image input. Select a Vision or Inpainting model.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage(ev.target!.result as string);
      textareaRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── Export chat ── */
  function exportChat() {
    if (!currentChat || currentChat.messages.length === 0) {
      alert("Nothing to export!");
      return;
    }
    let html = `<!DOCTYPE html><html lang="en" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chat: ${currentChat.title}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet"><style>:root[data-theme="dark"]{--bg:#0f1115;--surface:#202228;--text:#f8fafc;--muted:#94a3b8;--border:#2b2e36;--accent:#3b82f6;--code:#1e1e1e;--user-bg:#2d313a}:root[data-theme="light"]{--bg:#f8fafc;--surface:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--accent:#2563eb;--code:#f1f5f9;--user-bg:#e2e8f0}body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);padding:20px;margin:0;transition:.3s}.header{display:flex;justify-content:space-between;align-items:center;max-width:800px;margin:0 auto 20px;padding-bottom:15px;border-bottom:1px solid var(--border)}h1{font-size:1.5rem;margin:0}.btn{background:var(--surface);color:var(--text);border:1px solid var(--border);padding:8px 16px;border-radius:8px;cursor:pointer;font-family:inherit}.btn:hover{border-color:var(--accent)}.chat{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:24px}.msg{display:flex;flex-direction:column;max-width:85%}.msg.user{align-self:flex-end;align-items:flex-end}.msg.assistant{align-self:flex-start}.role{font-size:.8rem;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase}.content{padding:12px 18px;border-radius:20px;white-space:pre-wrap;word-wrap:break-word}.user .content{background:var(--user-bg);border-bottom-right-radius:4px}.assistant .content{background:transparent;padding:0}pre{background:var(--code);padding:14px;border-radius:8px;overflow-x:auto;font-family:'JetBrains Mono',monospace;border:1px solid var(--border)}code.cb-inline{background:var(--surface);padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;border:1px solid var(--border);color:var(--accent)}.reasoning{background:var(--surface);border-left:3px solid var(--muted);padding:12px;margin-bottom:16px;font-size:.9em;border-radius:8px;color:var(--muted)}img{max-width:100%;border-radius:12px;margin-top:10px;border:1px solid var(--border)}</style></head><body><div class="header"><h1>${currentChat.title}</h1><button class="btn" onclick="var h=document.documentElement;h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark')">Toggle Theme</button></div><div class="chat">`;
    currentChat.messages.forEach((m) => {
      html += `<div class="msg ${m.role}"><div class="role">${m.role}</div><div class="content">`;
      if (m.image) html += `<img src="${m.image}" alt="Uploaded"/>`;
      if (m.reasoning) html += `<div class="reasoning"><strong>Thought Process:</strong><br/>${formatMessage(m.reasoning)}</div>`;
      if (m.content) html += `<div>${formatMessage(m.content)}</div>`;
      m.generatedImages?.forEach((url) => (html += `<img src="${url}" alt="Generated"/>`));
      html += "</div></div>";
    });
    html += "</div></body></html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Keyboard ── */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const sendDisabled =
    (inputText.trim() === "" && !attachedImage) || isWaiting;

  const modelConfig = MODELS[selectedModel];

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="cb">
      {/* Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="cb-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`cb-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="cb-sidebar-header">
          <button className="cb-new-btn" onClick={createNewChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="cb-chat-list">
          {chats.map((c) => (
            <div
              key={c.id}
              className={`cb-chat-item ${c.id === currentChatId ? "active" : ""}`}
              onClick={() => switchChat(c.id)}
            >
              {c.title}
            </div>
          ))}
        </div>
        <div className="cb-sidebar-footer">
          <span style={{ fontSize: "0.75rem", color: "var(--cb-muted)" }}>
            {chats.length} chat{chats.length !== 1 ? "s" : ""} · Data stored locally
          </span>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="cb-main">
        {/* Header */}
        <header className="cb-header">
          <div className="cb-header-left">
            <button
              className="cb-icon-btn cb-mobile-only"
              onClick={() => setSidebarOpen(true)}
              title="Open Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="cb-model-area">
              <select
                className="cb-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {MODEL_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.keys.map((k) => (
                      <option key={k} value={k}>
                        {MODELS[k].desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="cb-model-desc">{modelConfig?.desc}</div>
            </div>
          </div>
          <div className="cb-header-right">
            <button
              className="cb-icon-btn"
              onClick={() => setSettingsOpen(true)}
              title="Image Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button className="cb-icon-btn" onClick={exportChat} title="Export Chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              className="cb-icon-btn cb-danger-hover"
              onClick={deleteCurrentChat}
              title="Delete Chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </header>

        {/* Chat messages */}
        <main className="cb-chat-box" ref={scrollRef}>
          <div className="cb-scroll">
            {(!currentChat || currentChat.messages.length === 0) && (
              <div className="cb-empty">
                <div className="cb-glow-icon">
                  <AiIcon />
                </div>
                <h2>How can I help you?</h2>
                <p>
                  Select a model from the top. Use ⚙️ to customize image generation
                  settings.
                </p>
              </div>
            )}
            {currentChat?.messages.map((msg, i) => (
              <div key={i} className={`cb-msg-wrap ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="cb-avatar">
                    <AiIcon />
                  </div>
                )}
                <div className="cb-msg">
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Uploaded"
                      className="cb-chat-img"
                    />
                  )}
                  {msg.generatedImages?.map((url, j) => (
                    <img
                      key={j}
                      src={url}
                      alt="Generated"
                      className="cb-chat-img"
                    />
                  ))}
                  {msg.reasoning && (
                    <details className="cb-reasoning">
                      <summary>Thought Process</summary>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(msg.reasoning),
                        }}
                      />
                    </details>
                  )}
                  {msg.content && (
                    <div
                      className="cb-msg-content"
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(msg.content),
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            {isWaiting && (
              <div className="cb-msg-wrap assistant">
                <div className="cb-avatar">
                  <AiIcon />
                </div>
                <div className="cb-msg">
                  <div className="cb-msg-content">
                    <div className="cb-typing">
                      <div className="cb-dot" />
                      <div className="cb-dot" />
                      <div className="cb-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input area */}
        <div className="cb-input-area">
          <div className="cb-input-container">
            {attachedImage && (
              <div className="cb-attachment">
                <img src={attachedImage} alt="Attached" />
                <button onClick={() => setAttachedImage(null)}>×</button>
              </div>
            )}
            <div className="cb-input-wrap">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
              <button
                className="cb-icon-btn cb-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI..."
                rows={1}
              />
              <button
                className="cb-send-btn"
                disabled={sendDisabled}
                onClick={sendMessage}
                title="Send message"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings Modal ── */}
      {settingsOpen && (
        <div className="cb-modal" onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}>
          <div className="cb-modal-content">
            <div className="cb-modal-header">
              <h3>Pixazo Image Settings</h3>
              <button className="cb-close-btn" onClick={() => setSettingsOpen(false)}>
                ×
              </button>
            </div>
            <div className="cb-modal-body">
              <div className="cb-form-group">
                <label>Resolution (W × H)</label>
                <div className="cb-flex-row">
                  <input
                    type="number"
                    value={imageSettings.width}
                    step={64}
                    onChange={(e) =>
                      setImageSettings((s) => ({ ...s, width: e.target.value }))
                    }
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={imageSettings.height}
                    step={64}
                    onChange={(e) =>
                      setImageSettings((s) => ({ ...s, height: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="cb-form-group">
                <label>Number of Steps (Flux = 4, SDXL = 20)</label>
                <input
                  type="number"
                  value={imageSettings.num_steps}
                  min={1}
                  max={50}
                  onChange={(e) =>
                    setImageSettings((s) => ({ ...s, num_steps: e.target.value }))
                  }
                />
              </div>
              <div className="cb-form-group">
                <label>Guidance Scale (SDXL / Inpaint only)</label>
                <input
                  type="number"
                  value={imageSettings.guidance}
                  step={0.5}
                  onChange={(e) =>
                    setImageSettings((s) => ({ ...s, guidance: e.target.value }))
                  }
                />
              </div>
              <div className="cb-form-group">
                <label>Seed (Random if blank)</label>
                <input
                  type="number"
                  value={imageSettings.seed}
                  placeholder="e.g. 42"
                  onChange={(e) =>
                    setImageSettings((s) => ({ ...s, seed: e.target.value }))
                  }
                />
              </div>
              <div className="cb-form-group">
                <label>Negative Prompt (SDXL / Inpaint only)</label>
                <textarea
                  rows={2}
                  value={imageSettings.negative_prompt}
                  placeholder="Low-quality, blurry..."
                  onChange={(e) =>
                    setImageSettings((s) => ({
                      ...s,
                      negative_prompt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="cb-form-group">
                <label>Mask Image URL (Inpainting only)</label>
                <input
                  type="text"
                  value={imageSettings.mask_url}
                  placeholder="https://.../mask.png"
                  onChange={(e) =>
                    setImageSettings((s) => ({ ...s, mask_url: e.target.value }))
                  }
                />
                <small>For the base image, use the 📎 upload button.</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
