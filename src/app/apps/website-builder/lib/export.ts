// ============================================================
// Website Builder Pro — Export Engine
// ============================================================

import type { BuilderProject, SectionNode, RowNode, ElementNode, PageData, SiteTheme } from './types';
import { generateBaseCSS, getGoogleFontsUrl, stylesToCSS, collectHoverCSS } from './css-engine';

/* ========== Render Element to HTML ========== */

function renderElement(el: ElementNode): string {
  if (el.hidden) return '';
  const style = stylesToCSS(el.styles);
  const styleAttr = style ? ` style="${style}"` : '';
  const id = ` data-id="${el.id}"`;

  switch (el.type) {
    case 'heading': {
      const tag = `h${el.headingLevel ?? 2}`;
      return `<${tag}${id}${styleAttr}>${el.content}</${tag}>`;
    }
    case 'paragraph':
      return `<p${id}${styleAttr}>${el.content}</p>`;
    case 'button':
      return `<a${id} href="${el.attributes.href || '#'}"${el.attributes.target ? ` target="${el.attributes.target}"` : ''} class="wb-btn"${styleAttr}>${el.content}</a>`;
    case 'link':
      return `<a${id} href="${el.attributes.href || '#'}"${el.attributes.target ? ` target="${el.attributes.target}"` : ''}${styleAttr}>${el.content}</a>`;
    case 'image':
      return `<img${id} src="${el.content}" alt="${el.attributes.alt || ''}"${styleAttr} loading="lazy">`;
    case 'video':
      return `<div${id} class="wb-video-wrapper"${styleAttr}><iframe src="${el.content}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    case 'icon':
      return `<i${id} class="${el.content} wb-icon"${styleAttr}></i>`;
    case 'list':
      return `<ul${id}${styleAttr}>${el.content}</ul>`;
    case 'blockquote':
      return `<blockquote${id}${styleAttr}>${el.content}</blockquote>`;
    case 'code':
      return `<pre${id} class="wb-code"${styleAttr}><code>${escapeHtml(el.content)}</code></pre>`;
    case 'divider':
      return `<div${id}${styleAttr}></div>`;
    case 'spacer':
      return `<div${id}${styleAttr}></div>`;
    case 'form': {
      const action = el.attributes.action || '#';
      const method = el.attributes.method || 'POST';
      const submitText = el.attributes.submitText || 'Submit';
      return `<form${id} class="wb-form" action="${action}" method="${method}"${styleAttr}>
  <div class="form-group"><label>Name</label><input type="text" name="name" placeholder="Your name" required></div>
  <div class="form-group"><label>Email</label><input type="email" name="email" placeholder="Your email" required></div>
  <div class="form-group"><label>Message</label><textarea name="message" rows="4" placeholder="Your message" required></textarea></div>
  <button type="submit">${submitText}</button>
</form>`;
    }
    case 'map':
      return `<div${id} class="wb-map"${styleAttr}><iframe src="${el.content}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
    case 'embed':
      return `<div${id} class="wb-embed"${styleAttr}><iframe src="${el.content}" frameborder="0" title="${el.attributes.title || 'Embed'}" loading="lazy"></iframe></div>`;
    case 'social-links': {
      let links: Array<{ platform: string; url: string; icon: string }> = [];
      try { links = JSON.parse(el.attributes.links || '[]'); } catch { /* ignore */ }
      const items = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" aria-label="${l.platform}"><i class="${l.icon}"></i></a>`).join('\n  ');
      return `<div${id} class="wb-social-links"${styleAttr}>\n  ${items}\n</div>`;
    }
    case 'container': {
      const children = el.children.map(renderElement).join('\n');
      return `<div${id}${styleAttr}>${children}</div>`;
    }
    default:
      return `<div${id}${styleAttr}>${el.content}</div>`;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ========== Render Section ========== */

function renderSection(section: SectionNode, isHeaderOrFooter?: 'header' | 'footer'): string {
  const sectionStyle = stylesToCSS(section.styles);
  const wrapperClass = isHeaderOrFooter === 'header' ? 'site-header' : isHeaderOrFooter === 'footer' ? 'site-footer' : '';
  const sectionClass = `wb-section${section.fullBleed ? ' full-bleed' : ''}`;

  const rowsHtml = section.rows.map(row => {
    const rowStyle = stylesToCSS(row.styles);
    const colsHtml = row.columns.map(col => {
      const colStyle = stylesToCSS(col.styles);
      const elHtml = col.elements.map(renderElement).join('\n      ');
      return `    <div class="wb-col wb-col-${col.span}"${colStyle ? ` style="${colStyle}"` : ''}>\n      ${elHtml}\n    </div>`;
    }).join('\n');
    return `  <div class="wb-row"${rowStyle ? ` style="${rowStyle}"` : ''}>\n${colsHtml}\n  </div>`;
  }).join('\n');

  const inner = `<div class="wb-section-inner">\n${rowsHtml}\n</div>`;

  if (wrapperClass) {
    return `<${isHeaderOrFooter === 'header' ? 'header' : 'footer'} class="${wrapperClass}">\n<div class="${sectionClass}"${sectionStyle ? ` style="${sectionStyle}"` : ''}>\n${inner}\n</div>\n</${isHeaderOrFooter === 'header' ? 'header' : 'footer'}>`;
  }
  return `<section class="${sectionClass}"${sectionStyle ? ` style="${sectionStyle}"` : ''}>\n${inner}\n</section>`;
}

/* ========== Generate Single Page HTML ========== */

function generatePageHTML(
  project: BuilderProject,
  page: PageData,
  cssFilePath: string,
): string {
  const fontsUrl = getGoogleFontsUrl(project.theme);
  const allSections = [...(project.settings.headerEnabled ? [project.header] : []), ...page.sections, ...(project.settings.footerEnabled ? [project.footer] : [])];
  const hoverCSS = collectHoverCSS(allSections);

  const bodyContent = [
    project.settings.headerEnabled ? renderSection(project.header, 'header') : '',
    '<main>',
    ...page.sections.map(s => renderSection(s)),
    '</main>',
    project.settings.footerEnabled ? renderSection(project.footer, 'footer') : '',
  ].filter(Boolean).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.seo.title || page.title} — ${project.settings.siteName}</title>
  <meta name="description" content="${page.seo.description || ''}">
  ${page.seo.ogImage ? `<meta property="og:image" content="${page.seo.ogImage}">` : ''}
  <meta property="og:title" content="${page.seo.title || page.title}">
  ${fontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${fontsUrl}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="${cssFilePath}">
  ${project.settings.favicon ? `<link rel="icon" href="assets/favicon.png">` : ''}
  ${hoverCSS ? `<style>\n${hoverCSS}\n</style>` : ''}
  ${project.settings.globalCSS ? `<style>\n${project.settings.globalCSS}\n</style>` : ''}
</head>
<body>
${bodyContent}

<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
<script>
function toggleTheme(){const h=document.documentElement;h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark');localStorage.setItem('theme',h.getAttribute('data-theme'));}
(function(){const t=localStorage.getItem('theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();
</script>
${project.settings.analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${project.settings.analyticsId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${project.settings.analyticsId}');</script>` : ''}
</body>
</html>`;
}

/* ========== Preview HTML (all-in-one) ========== */

export function generatePreviewHTML(project: BuilderProject, themeMode: 'light' | 'dark'): string {
  const fontsUrl = getGoogleFontsUrl(project.theme);
  const css = generateBaseCSS(project.theme);
  const pages = project.pageOrder.map(id => project.pages[id]).filter(Boolean);

  const pagesHTML = pages.map(page => {
    const bodyContent = [
      project.settings.headerEnabled ? renderSection(project.header, 'header') : '',
      '<main>',
      ...page.sections.map(s => renderSection(s)),
      '</main>',
      project.settings.footerEnabled ? renderSection(project.footer, 'footer') : '',
    ].filter(Boolean).join('\n');

    const allSections = [...(project.settings.headerEnabled ? [project.header] : []), ...page.sections, ...(project.settings.footerEnabled ? [project.footer] : [])];
    const hoverCSS = collectHoverCSS(allSections);

    return `<div class="wb-page" data-page-id="${page.id}" data-page-title="${page.title}" style="display:none;">\n${bodyContent}\n${hoverCSS ? `<style>${hoverCSS}</style>` : ''}\n</div>`;
  }).join('\n');

  const navLinks = pages.filter(p => !p.hidden).map(p =>
    `<a href="#" data-goto="${p.id}" class="preview-nav-link">${p.title}</a>`
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeMode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview — ${project.settings.siteName}</title>
  ${fontsUrl ? `<link href="${fontsUrl}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${css}</style>
  ${project.settings.globalCSS ? `<style>${project.settings.globalCSS}</style>` : ''}
  <style>
    .preview-bar { position:fixed;top:0;left:0;right:0;height:48px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;gap:1rem;z-index:10000;font-family:system-ui;font-size:0.85rem; }
    .preview-bar a,.preview-bar button { color:#fff;background:none;border:1px solid #333;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;text-decoration:none; }
    .preview-bar a.active,.preview-bar button.active { background:#6366f1;border-color:#6366f1; }
    .preview-content { padding-top:48px; }
  </style>
</head>
<body>
<div class="preview-bar">
  <span style="font-weight:600;margin-right:1rem;">${project.settings.siteName}</span>
  ${navLinks}
  <span style="margin-left:auto;display:flex;gap:0.5rem;">
    <button onclick="setViewport('100%')" class="active" id="vd">Desktop</button>
    <button onclick="setViewport('768px')" id="vt">Tablet</button>
    <button onclick="setViewport('375px')" id="vm">Mobile</button>
    <button onclick="toggleTheme()">🌓</button>
  </span>
</div>
<div class="preview-content" id="preview-content">
${pagesHTML}
</div>
<script>
function showPage(id){document.querySelectorAll('.wb-page').forEach(p=>p.style.display='none');const el=document.querySelector('[data-page-id="'+id+'"]');if(el)el.style.display='block';document.querySelectorAll('.preview-nav-link').forEach(a=>{a.classList.toggle('active',a.getAttribute('data-goto')===id);});}
document.querySelectorAll('[data-goto]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showPage(a.getAttribute('data-goto'));}));
showPage('${pages[0]?.id ?? ''}');
function setViewport(w){const c=document.getElementById('preview-content');c.style.maxWidth=w;c.style.margin='48px auto 0';document.querySelectorAll('#vd,#vt,#vm').forEach(b=>b.classList.remove('active'));if(w==='100%')document.getElementById('vd').classList.add('active');else if(w==='768px')document.getElementById('vt').classList.add('active');else document.getElementById('vm').classList.add('active');}
function toggleTheme(){const h=document.documentElement;h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark');}
</script>
</body>
</html>`;
}

/* ========== Export as ZIP ========== */

export async function exportProjectZip(project: BuilderProject): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Generate CSS
  const css = generateBaseCSS(project.theme);
  zip.file('style.css', css);

  // Generate pages
  const pages = project.pageOrder.map(id => project.pages[id]).filter(Boolean);

  for (const page of pages) {
    const depth = getPageDepth(page, project.pages);
    const prefix = '../'.repeat(depth);
    const cssPath = `${prefix}style.css`;
    const html = generatePageHTML(project, page, cssPath);
    const filePath = getPageFilePath(page, project.pages);
    zip.file(filePath, html);
  }

  // Export assets
  for (const asset of Object.values(project.assets)) {
    try {
      const base64Data = asset.dataUrl.split(',')[1];
      if (base64Data) {
        const ext = asset.mimeType.split('/')[1] || 'bin';
        zip.file(`assets/${asset.id}.${ext}`, base64Data, { base64: true });
      }
    } catch { /* skip invalid assets */ }
  }

  // Favicon
  if (project.settings.favicon) {
    try {
      const base64 = project.settings.favicon.split(',')[1];
      if (base64) zip.file('assets/favicon.png', base64, { base64: true });
    } catch { /* skip */ }
  }

  return zip.generateAsync({ type: 'blob' });
}

/* ========== Helpers ========== */

function getPageFilePath(page: PageData, pages: Record<string, PageData>): string {
  const parts: string[] = [];
  let current: PageData | undefined = page;
  while (current?.parentId) {
    const parent: PageData | undefined = pages[current.parentId];
    if (parent) {
      parts.unshift(parent.slug);
      current = parent;
    } else break;
  }
  if (page.slug === 'index') {
    return parts.length > 0 ? `${parts.join('/')}/index.html` : 'index.html';
  }
  return [...parts, `${page.slug}.html`].join('/');
}

function getPageDepth(page: PageData, pages: Record<string, PageData>): number {
  let depth = 0;
  let current: PageData | undefined = page;
  while (current?.parentId) {
    const parent: PageData | undefined = pages[current.parentId];
    if (parent) { depth++; current = parent; }
    else break;
  }
  return depth;
}
