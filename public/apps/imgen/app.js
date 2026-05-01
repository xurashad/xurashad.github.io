// ===== ArtForge AI - Image Generator (Powered by Pollinations.ai — 100% Free) =====
const API_BASE = 'https://image.pollinations.ai/prompt';
let generationCount = 0;
let imageHistory = [];
let currentShape = { width: 1024, height: 1024 };
let imageCount = 1;
let isGenerating = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const promptInput = $('#promptInput');
const negativePrompt = $('#negativePrompt');
const artStyle = $('#artStyle');
const aiModel = $('#aiModel');
const seedInput = $('#seedInput');
const generateBtn = $('#generateBtn');
const galleryGrid = $('#galleryGrid');
const emptyState = $('#emptyState');
const clearGalleryBtn = $('#clearGalleryBtn');
const imageModal = $('#imageModal');
const modalImage = $('#modalImage');
const modalPrompt = $('#modalPrompt');

// ===== Random Prompts =====
const randomPrompts = [
  "A mystical anime girl with flowing galaxy hair, wearing a celestial kimono, floating among stars and nebulae, soft ethereal glow",
  "A cyberpunk samurai standing on a neon-lit rooftop in Tokyo at night, rain falling, holographic billboards",
  "A magical forest with bioluminescent mushrooms, fairy lights, a crystal-clear stream, ancient mossy trees",
  "A steampunk airship flying through golden clouds at sunset, brass gears and copper pipes, Victorian aesthetic",
  "An underwater palace made of coral and pearls, mermaids swimming around glowing jellyfish, deep blue tones",
  "A dragon perched on a snow-capped mountain peak, aurora borealis dancing in the sky, epic fantasy",
  "A cozy Japanese cafe in autumn, warm lantern light, maple leaves falling outside, detailed interior",
  "A warrior princess in ornate golden armor, standing in a field of red flowers, wind blowing her cape",
  "A futuristic space station orbiting a gas giant, sleek design, stars in the background, sci-fi concept art",
  "An enchanted library with floating books, magical runes glowing on the walls, spiral staircase, warm candlelight",
  "A cute fox spirit with nine glowing tails, cherry blossoms swirling around, moonlit shrine",
  "A post-apocalyptic garden where nature reclaimed a city, vines on skyscrapers, deer grazing on a highway",
  "A witch's cottage in a dark enchanted forest, glowing potions, black cat on the windowsill",
  "A majestic phoenix rising from flames, feathers of gold and crimson, sparks flying, dark background",
  "An alien planet landscape with two suns, bioluminescent alien flora, crystal formations"
];

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initShapeSelector();
  initCustomDimensions();
  initEventListeners();
  loadHistory();
});

function initParticles() {
  const container = $('#bgParticles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 200 + 50;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*20}s;animation-duration:${15+Math.random()*20}s`;
    container.appendChild(p);
  }
}

function initShapeSelector() {
  const customPanel = $('#customDimensionsPanel');
  $$('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.shape === 'custom') {
        customPanel.classList.add('visible');
        updateCustomDimensions();
      } else {
        customPanel.classList.remove('visible');
        currentShape = { width: parseInt(btn.dataset.width), height: parseInt(btn.dataset.height) };
      }
    });
  });
}

function initCustomDimensions() {
  const widthInput = $('#customWidth');
  const heightInput = $('#customHeight');
  const previewText = $('#dimPreviewText');

  function updateCustomDimensions() {
    let w = parseInt(widthInput.value) || 1024;
    let h = parseInt(heightInput.value) || 1024;
    w = Math.max(64, Math.min(4096, w));
    h = Math.max(64, Math.min(4096, h));
    currentShape = { width: w, height: h };
    const mp = ((w * h) / 1000000).toFixed(1);
    previewText.textContent = `${w} × ${h} — ${mp} MP`;
    // Highlight matching preset chip
    $$('.preset-chip').forEach(chip => {
      chip.classList.toggle('active',
        parseInt(chip.dataset.w) === w && parseInt(chip.dataset.h) === h);
    });
  }
  // Expose for shape selector
  window.updateCustomDimensions = updateCustomDimensions;

  widthInput.addEventListener('input', updateCustomDimensions);
  heightInput.addEventListener('input', updateCustomDimensions);
  widthInput.addEventListener('change', () => { widthInput.value = Math.max(64, Math.min(4096, parseInt(widthInput.value) || 1024)); updateCustomDimensions(); });
  heightInput.addEventListener('change', () => { heightInput.value = Math.max(64, Math.min(4096, parseInt(heightInput.value) || 1024)); updateCustomDimensions(); });

  // Swap button
  $('#swapDimsBtn').addEventListener('click', () => {
    const tmp = widthInput.value;
    widthInput.value = heightInput.value;
    heightInput.value = tmp;
    updateCustomDimensions();
  });

  // Preset chips
  $$('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      widthInput.value = chip.dataset.w;
      heightInput.value = chip.dataset.h;
      updateCustomDimensions();
    });
  });
}


function initEventListeners() {
  generateBtn.addEventListener('click', generateImages);
  $('#randomizeBtn').addEventListener('click', randomizePrompt);
  $('#enhanceBtn').addEventListener('click', enhancePrompt);
  $('#randomSeedBtn').addEventListener('click', () => { seedInput.value = Math.floor(Math.random() * 999999); });
  $('#toggleNegative').addEventListener('click', () => { $('#negativeSection').classList.toggle('collapsed'); });
  clearGalleryBtn.addEventListener('click', clearGallery);
  $('#modalClose').addEventListener('click', closeModal);
  imageModal.addEventListener('click', (e) => { if (e.target === imageModal) closeModal(); });
  $('#modalDownload').addEventListener('click', () => {
    if (imageModal._url) downloadImage(imageModal._url, `artforge-${Date.now()}.png`);
  });
  $('#modalCopyPrompt').addEventListener('click', () => {
    navigator.clipboard.writeText(modalPrompt.textContent);
    showToast('Prompt copied!', 'success');
  });
  $('#modalReuse').addEventListener('click', () => {
    if (imageModal._meta) { promptInput.value = imageModal._meta.prompt; closeModal(); showToast('Settings loaded!', 'success'); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!isGenerating) generateImages(); }
    if (e.key === 'Escape') closeModal();
  });
}

// ===== Generate =====
function generateImages() {
  const prompt = promptInput.value.trim();
  if (!prompt) { showToast('Please enter a description first!', 'error'); promptInput.focus(); return; }
  if (isGenerating) return;

  isGenerating = true;
  toggleGenerateButton(true);
  emptyState.style.display = 'none';
  clearGalleryBtn.style.display = 'flex';

  const style = artStyle.value;
  const model = aiModel.value;
  const negative = negativePrompt.value.trim();
  const seed = parseInt(seedInput.value) || -1;
  const fullPrompt = style ? `${prompt}, ${style}` : prompt;

  let pending = imageCount;

  for (let i = 0; i < imageCount; i++) {
    const imgSeed = seed === -1 ? Math.floor(Math.random() * 999999) : seed + i;
    const card = createLoadingCard(i);
    galleryGrid.prepend(card);

    const params = new URLSearchParams({
      width: currentShape.width,
      height: currentShape.height,
      seed: imgSeed,
      model: model,
      nologo: 'true'
    });
    if (negative) params.set('negative_prompt', negative);

    const url = `${API_BASE}/${encodeURIComponent(fullPrompt)}?${params.toString()}`;
    const meta = {
      prompt, fullPrompt, style: artStyle.options[artStyle.selectedIndex].text,
      model, seed: imgSeed, width: currentShape.width, height: currentShape.height
    };

    loadImage(url, card, meta, () => {
      pending--;
      if (pending <= 0) { isGenerating = false; toggleGenerateButton(false); }
    });
  }

  generationCount += imageCount;
  $('#generationCount .stat-value').textContent = generationCount;
  saveHistory();
}

function loadImage(url, card, meta, onDone) {
  const domImg = card.querySelector('.card-image');
  const loadingOverlay = card.querySelector('.card-loading-overlay');
  const promptEl = card.querySelector('.card-info .card-prompt');

  // Use a hidden Image object to preload — this fires onload reliably
  const preloader = new Image();
  preloader.referrerPolicy = 'no-referrer';

  preloader.onload = function() {
    console.log('[ArtForge] Image preloaded successfully:', url.substring(0, 80));
    // Set the DOM image src — browser serves from cache
    domImg.src = url;
    domImg.style.display = 'block';
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (promptEl) promptEl.textContent = meta.prompt;
    card.dataset.url = url;

    // Attach click handlers
    const viewBtn = card.querySelector('[data-action="view"]');
    const dlBtn = card.querySelector('[data-action="download"]');
    if (viewBtn) viewBtn.onclick = (e) => { e.stopPropagation(); openModal(url, meta); };
    if (dlBtn) dlBtn.onclick = (e) => { e.stopPropagation(); downloadImage(url, `artforge-${meta.seed}.png`); };
    card.onclick = () => openModal(url, meta);

    imageHistory.unshift({ url, meta, time: Date.now() });
    if (imageHistory.length > 50) imageHistory.pop();
    onDone();
  };

  preloader.onerror = function() {
    console.error('[ArtForge] Image preload failed:', url.substring(0, 80));
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
        <span class="loading-text" style="color:#ef4444">Failed to generate</span>`;
    }
    onDone();
  };

  preloader.src = url;
}

function createLoadingCard(index) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.style.animationDelay = `${index * 0.1}s`;
  const aspect = `${currentShape.width}/${currentShape.height}`;
  card.innerHTML = `
    <div class="card-image-wrapper" style="--aspect:${aspect}">
      <img class="card-image" style="display:none" alt="Generated image" referrerpolicy="no-referrer">
      <div class="card-loading-overlay">
        <div class="loading-ring"></div>
        <span class="loading-text">Generating...</span>
      </div>
      <div class="card-overlay">
        <div class="card-actions">
          <button class="card-action-btn" data-action="view" title="View full size">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
          <button class="card-action-btn" data-action="download" title="Download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="card-info">
      <p class="card-prompt">Generating image...</p>
      <div class="card-meta">
        <span class="card-badge">${aiModel.options[aiModel.selectedIndex].text}</span>
        <span class="card-time">Just now</span>
      </div>
    </div>`;
  return card;
}

function toggleGenerateButton(loading) {
  const c = generateBtn.querySelector('.btn-content');
  const l = generateBtn.querySelector('.btn-loading');
  c.style.display = loading ? 'none' : 'flex';
  l.style.display = loading ? 'flex' : 'none';
  generateBtn.disabled = loading;
}

// ===== Prompt Helpers =====
function randomizePrompt() {
  promptInput.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
  promptInput.style.animation = 'none'; promptInput.offsetHeight; promptInput.style.animation = 'cardIn 0.3s ease';
  showToast('Random prompt loaded!', 'success');
}

async function enhancePrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) { showToast('Enter a prompt first', 'error'); return; }
  const btn = $('#enhanceBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px"></div><span>Enhancing...</span>';

  let enhanced = null;

  // Try POST /openai endpoint (anonymous, no cookies)
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are an AI image prompt enhancer. Take the user\'s prompt and make it more detailed for AI image generation. Add lighting, composition, colors, atmosphere details. Keep it under 80 words, single paragraph, output ONLY the enhanced prompt with no extra commentary.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 200
      })
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
    // Check if the response is valid (not a deprecation warning or error message)
    if (text && text.length > 10 && !text.includes('deprecated') && !text.includes('IMPORTANT NOTICE') && !text.includes('migrate')) {
      enhanced = text;
    }
  } catch (e) { console.log('[ArtForge] POST /openai failed:', e.message); }

  // Fallback: try GET endpoint (anonymous, no cookies)
  if (!enhanced) {
    try {
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(
        `You are an AI image prompt enhancer. Take this prompt and make it more detailed for AI image generation. Add lighting, composition, colors, atmosphere details. Keep it under 80 words, single paragraph, output only the enhanced prompt. Original: "${prompt}"`
      )}`, { credentials: 'omit', referrerPolicy: 'no-referrer' });
      const text = await res.text();
      if (text && text.length > 10 && !text.includes('deprecated') && !text.includes('IMPORTANT NOTICE') && !text.includes('migrate')) {
        enhanced = text.trim().replace(/^["']|["']$/g, '');
      }
    } catch (e) { console.log('[ArtForge] GET text fallback failed:', e.message); }
  }

  // Local fallback: smart prompt enhancement using templates
  if (!enhanced) {
    enhanced = localEnhancePrompt(prompt);
    showToast('Prompt enhanced locally!', 'success');
  } else {
    showToast('Prompt enhanced!', 'success');
  }

  promptInput.value = enhanced;
  btn.disabled = false;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg><span>Enhance</span>';
}

function localEnhancePrompt(prompt) {
  const lighting = ['soft golden hour lighting', 'dramatic cinematic lighting', 'ethereal moonlight glow',
    'vibrant neon illumination', 'warm ambient candlelight', 'cool blue twilight', 'harsh spotlight contrast',
    'diffused natural daylight', 'atmospheric volumetric rays', 'bioluminescent soft glow'];
  const atmosphere = ['dreamlike and surreal atmosphere', 'moody and mysterious ambiance', 'serene and peaceful vibes',
    'epic and grandiose scale', 'intimate and cozy feeling', 'dystopian and gritty mood', 'whimsical and fantastical energy',
    'melancholic and nostalgic tone', 'vibrant and energetic aura', 'dark and foreboding presence'];
  const composition = ['rule of thirds composition', 'symmetrical centered framing', 'dynamic diagonal lines',
    'extreme close-up detail', 'sweeping wide-angle panorama', 'bird\'s eye aerial view', 'low-angle heroic perspective',
    'depth with foreground bokeh', 'layered atmospheric perspective', 'minimalist negative space'];
  const quality = ['ultra detailed 8K resolution', 'photorealistic render quality', 'masterpiece illustration quality',
    'award-winning photography style', 'highly detailed digital art', 'professional concept art quality',
    'sharp focus intricate details', 'trending on ArtStation quality', 'hyperrealistic fine textures'];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return `${prompt}, ${pick(lighting)}, ${pick(atmosphere)}, ${pick(composition)}, ${pick(quality)}`;
}

// ===== Modal =====
function openModal(url, meta) {
  modalImage.src = url;
  modalPrompt.textContent = `${meta.prompt} | Style: ${meta.style} | Model: ${meta.model} | Seed: ${meta.seed} | ${meta.width}×${meta.height}`;
  imageModal.classList.add('active'); imageModal._meta = meta; imageModal._url = url;
  document.body.style.overflow = 'hidden';
}
function closeModal() { imageModal.classList.remove('active'); document.body.style.overflow = ''; }

// ===== Download =====
async function downloadImage(url, filename) {
  // Ensure filename has .png extension
  if (!filename.endsWith('.png') && !filename.endsWith('.jpg')) {
    filename += '.png';
  }

  let blob = null;

  // Step 1: Get the image as a blob
  try {
    // Try fetch with CORS
    const fetchUrl = new URL(url);
    fetchUrl.searchParams.set('_dl', Date.now());
    const res = await fetch(fetchUrl.href, {
      mode: 'cors',
      referrerPolicy: 'no-referrer'
    });
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    const rawBlob = await res.blob();
    // Force correct MIME type
    blob = new Blob([rawBlob], { type: 'image/png' });
  } catch (e) {
    console.log('[ArtForge] Fetch download failed, trying canvas:', e.message);
  }

  if (!blob) {
    try {
      // Try canvas with a fresh CORS image
      const corsImg = new Image();
      corsImg.crossOrigin = 'anonymous';
      blob = await new Promise((resolve, reject) => {
        corsImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = corsImg.naturalWidth;
            canvas.height = corsImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(corsImg, 0, 0);
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error('toBlob returned null'));
            }, 'image/png');
          } catch (err) { reject(err); }
        };
        corsImg.onerror = () => reject(new Error('Image load failed'));
        const corsUrl = new URL(url);
        corsUrl.searchParams.set('_dl', Date.now());
        corsImg.src = corsUrl.href;
      });
    } catch (e) {
      console.log('[ArtForge] Canvas download failed:', e.message);
    }
  }

  if (!blob) {
    // Last resort — open in new tab
    window.open(url, '_blank');
    showToast('Right-click the image → Save Image As...', 'success');
    return;
  }

  // Step 2: Save the blob with the correct filename
  // Try File System Access API first (works on file:// origins, gives user save dialog)
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'PNG Image',
          accept: { 'image/png': ['.png'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      showToast('Image saved!', 'success');
      return;
    } catch (e) {
      // AbortError = user cancelled the save dialog
      if (e.name === 'AbortError') return;
      console.log('[ArtForge] showSaveFilePicker failed, using fallback:', e.message);
    }
  }

  // Fallback: blob URL + anchor tag
  triggerDownload(blob, filename);
  showToast('Image downloaded!', 'success');
}

function triggerDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Longer delay to ensure download fully initiates before cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 10000);
}

// ===== Gallery =====
function clearGallery() {
  galleryGrid.innerHTML = ''; emptyState.style.display = 'flex'; clearGalleryBtn.style.display = 'none';
  imageHistory = []; saveHistory(); showToast('Gallery cleared', 'success');
}

// ===== Toast =====
function showToast(msg, type = 'success') {
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span><span>${msg}</span>`;
  $('#toastContainer').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== Persistence =====
function saveHistory() { try { localStorage.setItem('artforge_count', generationCount); } catch {} }
function loadHistory() { try { const c = localStorage.getItem('artforge_count'); if (c) { generationCount = parseInt(c); $('#generationCount .stat-value').textContent = generationCount; } } catch {} }
