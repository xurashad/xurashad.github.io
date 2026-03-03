let chats = [];
try { chats = JSON.parse(localStorage.getItem('trinity_chats')) || []; } catch (e) { chats = []; }
let currentChatId = null;
let currentImageBase64 = null; 
let isWaitingForResponse = false;

const chatBox = document.getElementById('chat-box');
const scrollContainer = document.querySelector('.chat-scroll-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const emptyState = document.getElementById('empty-state');
const chatListContainer = document.getElementById('chat-list');
const modelSelector = document.getElementById('model-selector');
const modelDesc = document.getElementById('model-desc');
const exportBtn = document.getElementById('export-btn');

// Image Upload DOM Elements
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const attachmentPreview = document.getElementById('attachment-preview');
const previewImg = document.getElementById('preview-img');
const removeAttachmentBtn = document.getElementById('remove-attachment');

// Settings Modal DOM Elements
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeModal = document.getElementById('close-modal');

const aiSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

function init() {
    initTheme();
    if (chats.length === 0) createNewChat();
    else loadChat(chats[0].id);
    renderSidebar();
    updateModelDesc();
}

function saveData() {
    try {
        localStorage.setItem('trinity_chats', JSON.stringify(chats));
        renderSidebar();
    } catch (e) {
        alert("⚠️ Storage Limit Reached! Delete old chats to clear memory.");
    }
}

modelSelector.addEventListener('change', updateModelDesc);
function updateModelDesc() {
    modelDesc.innerText = MODELS[modelSelector.value].desc;
}

// --- MODAL SETTINGS LOGIC ---
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', (e) => { if(e.target === settingsModal) settingsModal.classList.add('hidden'); });

// Gather values for API
function getSettings() {
    return {
        width: document.getElementById('img-width').value,
        height: document.getElementById('img-height').value,
        num_steps: document.getElementById('img-steps').value,
        guidance: document.getElementById('img-guidance').value,
        seed: document.getElementById('img-seed').value,
        negative_prompt: document.getElementById('img-negative').value,
        mask_url: document.getElementById('img-mask').value
    };
}

// --- IMAGE UPLOAD LOGIC ---
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!MODELS[modelSelector.value].supportsVision) {
        alert("⚠️ This model does not support image input. Select a Vision or Inpainting model.");
        fileInput.value = ""; return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        currentImageBase64 = event.target.result;
        previewImg.src = currentImageBase64;
        attachmentPreview.classList.remove('hidden');
        userInput.focus();
        handleInput();
    };
    reader.readAsDataURL(file);
});

removeAttachmentBtn.addEventListener('click', () => {
    currentImageBase64 = null;
    attachmentPreview.classList.add('hidden');
    fileInput.value = "";
    handleInput();
});

// --- ENHANCED MARKDOWN PARSER ---
function formatMessage(text) {
    if (!text) return "";
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const codeBlocks = [];
    safeText = safeText.replace(/```([\s\S]*?)```/g, (match, code) => {
        codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    safeText = safeText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safeText = safeText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    safeText = safeText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    safeText = safeText.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    safeText = safeText.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    safeText = safeText.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    safeText = safeText.replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/gim, '<ul>$1</ul>');
    safeText = safeText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => codeBlocks[index]);
    return safeText;
}

function renderMessageToDOM(msg) {
    if (emptyState.style.display !== 'none') emptyState.style.display = 'none';

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${msg.role}`;

    if (msg.role === 'assistant') {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = aiSvg;
        wrapper.appendChild(avatar);
    }

    const msgContainer = document.createElement('div');
    msgContainer.className = 'message';

    if (msg.image) {
        const imgEl = document.createElement('img');
        imgEl.src = msg.image;
        imgEl.className = 'chat-image';
        msgContainer.appendChild(imgEl);
    }

    if (msg.generatedImages && msg.generatedImages.length > 0) {
        msg.generatedImages.forEach(base64 => {
            const imgEl = document.createElement('img');
            imgEl.src = base64;
            imgEl.className = 'chat-image';
            msgContainer.appendChild(imgEl);
        });
    }

    if (msg.reasoning) {
        const details = document.createElement('details');
        details.className = 'reasoning';
        details.innerHTML = `<summary>Thought Process</summary><p>${formatMessage(msg.reasoning)}</p>`;
        msgContainer.appendChild(details);
    }

    if (msg.content) {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-content';
        textDiv.innerHTML = formatMessage(msg.content); 
        msgContainer.appendChild(textDiv);
    }

    wrapper.appendChild(msgContainer);
    scrollContainer.appendChild(wrapper);
    scrollToBottom();
}

function scrollToBottom() {
    requestAnimationFrame(() => { chatBox.scrollTop = chatBox.scrollHeight; });
}

async function sendMessage() {
    const text = userInput.value.trim();
    if ((!text && !currentImageBase64) || isWaitingForResponse) return;

    const chat = chats.find(c => c.id === currentChatId);

    const userMsg = { role: 'user', content: text, image: currentImageBase64 };
    chat.messages.push(userMsg);
    renderMessageToDOM(userMsg);
    
    if (chat.messages.length === 1) chat.title = text.substring(0, 20) + "...";
    saveData();

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    isWaitingForResponse = true;
    
    currentImageBase64 = null;
    attachmentPreview.classList.add('hidden');
    fileInput.value = "";
    
    const typingId = "typing-" + Date.now();
    const typingWrapper = document.createElement('div');
    typingWrapper.className = 'message-wrapper assistant';
    typingWrapper.id = typingId;
    typingWrapper.innerHTML = `<div class="avatar">${aiSvg}</div><div class="message"><div class="message-content"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></div>`;
    scrollContainer.appendChild(typingWrapper);
    scrollToBottom();

    try {
        const selectedModel = modelSelector.value;
        const currentSettings = getSettings();
        
        const aiResponse = await fetchAIResponse(selectedModel, chat.messages, currentSettings);
        
        const typingElement = document.getElementById(typingId);
        if(typingElement) typingElement.remove();

        const assistantMsg = { 
            role: 'assistant', 
            content: aiResponse.content, 
            reasoning: aiResponse.reasoning,
            reasoning_details: aiResponse.reasoning_details,
            generatedImages: aiResponse.generatedImages
        };

        chat.messages.push(assistantMsg);
        renderMessageToDOM(assistantMsg);
        saveData();

    } catch (error) {
        const typingElement = document.getElementById(typingId);
        if(typingElement) typingElement.remove();
        renderMessageToDOM({role: 'assistant', content: '⚠️ Error: ' + error.message});
    } finally {
        isWaitingForResponse = false;
        handleInput(); 
        userInput.focus();
    }
}

// --- CHAT MANAGEMENT ---
function createNewChat() {
    const newChat = { id: Date.now().toString(), title: "New Chat", messages: [] };
    chats.unshift(newChat);
    saveData();
    loadChat(newChat.id);
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    document.querySelectorAll('.message-wrapper').forEach(msg => msg.remove());
    if (chat.messages.length === 0) emptyState.style.display = 'flex';
    else chat.messages.forEach(msg => renderMessageToDOM(msg));
    renderSidebar();
    scrollToBottom();
}

function renderSidebar() {
    chatListContainer.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.innerText = chat.title;
        item.onclick = () => loadChat(chat.id);
        chatListContainer.appendChild(item);
    });
}

function exportCurrentChat() {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat || chat.messages.length === 0) return alert("Nothing to export!");

    let htmlContent = `<!DOCTYPE html><html lang="en" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chat Export: ${chat.title}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet"><style>:root[data-theme="dark"]{--bg-main:#0f1115;--bg-surface:#202228;--text-main:#f8fafc;--text-muted:#94a3b8;--user-bubble:#2d313a;--ai-bubble:transparent;--border:#2b2e36;--accent:#3b82f6;--code-bg:#1e1e1e}:root[data-theme="light"]{--bg-main:#f8fafc;--bg-surface:#ffffff;--text-main:#0f172a;--text-muted:#64748b;--user-bubble:#e2e8f0;--ai-bubble:transparent;--border:#e2e8f0;--accent:#2563eb;--code-bg:#f1f5f9}body{font-family:'Inter',sans-serif;background-color:var(--bg-main);color:var(--text-main);line-height:1.6;padding:20px;transition:.3s;margin:0}.header{display:flex;justify-content:space-between;align-items:center;max-width:800px;margin:0 auto 20px auto;padding-bottom:15px;border-bottom:1px solid var(--border)}h1{font-size:1.5rem;margin:0}.theme-btn{background:var(--bg-surface);color:var(--text-main);border:1px solid var(--border);padding:8px 16px;border-radius:8px;cursor:pointer;font-family:inherit;transition:.2s}.theme-btn:hover{border-color:var(--accent)}.chat-container{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:24px}.msg{display:flex;flex-direction:column;max-width:85%}.msg.user{align-self:flex-end;align-items:flex-end}.msg.assistant{align-self:flex-start}.role{font-size:.8rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase}.content{padding:12px 18px;border-radius:20px;white-space:pre-wrap;word-wrap:break-word}.user .content{background:var(--user-bubble);border-bottom-right-radius:4px}.assistant .content{background:var(--ai-bubble);padding:0}.content h1{font-size:1.5rem;margin:16px 0 8px 0;border-bottom:1px solid var(--border)}.content h2{font-size:1.3rem;margin:14px 0 8px 0}.content h3{font-size:1.1rem;margin:12px 0 6px 0}.content blockquote{border-left:4px solid var(--accent);padding-left:12px;margin:8px 0;color:var(--text-muted);font-style:italic}pre{background:var(--code-bg);padding:14px;border-radius:8px;overflow-x:auto;font-family:'JetBrains Mono',monospace;border:1px solid var(--border)}code.inline-code{background:var(--bg-surface);padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;border:1px solid var(--border);color:var(--accent)}.reasoning{background:var(--bg-surface);border-left:3px solid var(--text-muted);padding:12px;margin-bottom:16px;font-size:.9em;border-radius:8px;color:var(--text-muted)}img{max-width:100%;border-radius:12px;margin-top:10px;border:1px solid var(--border)}</style></head><body><div class="header"><h1>${chat.title}</h1><button class="theme-btn" onclick="toggleTheme()">Toggle Theme</button></div><div class="chat-container">`;

    chat.messages.forEach(m => {
        htmlContent += `<div class="msg ${m.role}"><div class="role">${m.role}</div><div class="content">`;
        if (m.image) htmlContent += `<img src="${m.image}" alt="User Uploaded Image"/>`;
        if (m.reasoning) htmlContent += `<div class="reasoning"><strong>Thought Process:</strong><br/>${formatMessage(m.reasoning)}</div>`;
        if (m.content) htmlContent += `<div>${formatMessage(m.content)}</div>`;
        if (m.generatedImages && m.generatedImages.length > 0) m.generatedImages.forEach(imgUrl => htmlContent += `<img src="${imgUrl}" alt="Generated AI Image"/>`);
        htmlContent += `</div></div>`;
    });

    htmlContent += `</div><script>function toggleTheme(){const html=document.documentElement;html.setAttribute('data-theme',html.getAttribute('data-theme')==='dark'?'light':'dark')}</script></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trinity_Chat_${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleInput() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    sendBtn.disabled = (userInput.value.trim() === '' && !currentImageBase64) || isWaitingForResponse;
}

userInput.addEventListener('input', handleInput);
userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }});
sendBtn.addEventListener('click', sendMessage);
document.getElementById('new-chat-btn').addEventListener('click', createNewChat);
exportBtn.addEventListener('click', exportCurrentChat);
document.getElementById('delete-chat-btn').addEventListener('click', () => {
    chats = chats.filter(c => c.id !== currentChatId);
    if (chats.length === 0) createNewChat(); else loadChat(chats[0].id);
    saveData();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}
document.getElementById('theme-toggle').addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

init();