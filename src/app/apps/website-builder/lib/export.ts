// ============================================================
// Website Builder Pro — Export & Preview Engine
// ============================================================

import type {
  BuilderProject, SectionNode, ElementNode, PageData,
  FormField, AccordionItem, TabItem, SocialLinkItem, TableData,
} from './types';
import {
  generateBaseCSS, getGoogleFontsUrl, stylesToCSS,
  collectHoverCSS, generateResponsiveCSS, getShapeDividerSVG,
  normalizeVideoEmbedUrl, collectUsedFonts,
} from './css-engine';

interface RenderContext {
  project: BuilderProject;
  currentPage?: PageData;
  isPreview: boolean;
  prefix: string;
  assetUrlMap?: Map<string, string>;
}

/* ========== URL & Asset Resolution ========== */

function resolveHref(rawHref: string | undefined, ctx: RenderContext): { href: string; extraAttr: string } {
  const href = rawHref || '#';
  if (href.startsWith('page:')) {
    const pageId = href.slice(5);
    const targetPage = ctx.project.pages[pageId];
    if (ctx.isPreview) {
      return { href: '#', extraAttr: ` data-goto="${escapeAttr(pageId)}"` };
    }
    if (targetPage) {
      const targetPath = getPageFilePath(targetPage, ctx.project.pages);
      return { href: `${ctx.prefix}${targetPath}`, extraAttr: '' };
    }
  }
  return { href, extraAttr: '' };
}

function resolveAssetUrl(url: string, ctx: RenderContext): string {
  if (!url || !ctx.assetUrlMap) return url;
  const mapped = ctx.assetUrlMap.get(url);
  return mapped ? `${ctx.prefix}${mapped}` : url;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/* ========== Render Element to HTML ========== */

function renderElement(el: ElementNode, ctx: RenderContext): string {
  if (el.hidden) return '';

  const mergedStyles = { ...el.styles };
  if (el.type === 'list') {
    const listTag = el.attributes.listTag || 'ul';
    if (listTag === 'ol' && (!mergedStyles.listStyleType || mergedStyles.listStyleType === 'disc')) {
      mergedStyles.listStyleType = 'decimal';
    } else if (listTag === 'checklist') {
      mergedStyles.listStyleType = 'none';
    }
  }
  if (el.animation && el.animation.type !== 'none') {
    if (el.animation.duration) mergedStyles.transition = mergedStyles.transition || undefined;
  }

  let style = stylesToCSS(mergedStyles);
  if (el.animation && el.animation.type !== 'none') {
    const dur = el.animation.duration || '0.6s';
    const del = el.animation.delay || '0s';
    style = `${style ? `${style}; ` : ''}animation-duration: ${dur}; animation-delay: ${del}`;
  }

  const styleAttr = style ? ` style="${escapeAttr(style)}"` : '';
  const animClass = el.animation && el.animation.type !== 'none' ? ` wb-anim wb-anim-${el.animation.type}` : '';
  const customClass = el.customClass ? ` ${escapeAttr(el.customClass)}` : '';
  const customId = el.customId ? ` id="${escapeAttr(el.customId)}"` : '';
  const idAttr = `${customId} data-id="${escapeAttr(el.id)}"`;

  switch (el.type) {
    case 'heading': {
      const tag = `h${el.headingLevel ?? 2}`;
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<${tag}${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</${tag}>`;
    }

    case 'paragraph': {
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<p${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</p>`;
    }

    case 'button': {
      const resolved = resolveHref(el.attributes.href, ctx);
      const targetAttr = el.attributes.target && !resolved.extraAttr ? ` target="${escapeAttr(el.attributes.target)}"` : '';
      const clsAttr = `wb-btn${animClass}${customClass}`;
      return `<a${idAttr} href="${escapeAttr(resolved.href)}"${resolved.extraAttr}${targetAttr} class="${clsAttr}"${styleAttr}>${el.content}</a>`;
    }

    case 'link': {
      const resolved = resolveHref(el.attributes.href, ctx);
      const targetAttr = el.attributes.target && !resolved.extraAttr ? ` target="${escapeAttr(el.attributes.target)}"` : '';
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<a${idAttr} href="${escapeAttr(resolved.href)}"${resolved.extraAttr}${targetAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</a>`;
    }

    case 'image': {
      const src = resolveAssetUrl(el.content, ctx);
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<img${idAttr} src="${escapeAttr(src)}" alt="${escapeAttr(el.attributes.alt || '')}"${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr} loading="lazy">`;
    }

    case 'video': {
      const embedUrl = normalizeVideoEmbedUrl(el.content);
      const clsAttr = `wb-video-wrapper${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}><iframe src="${escapeAttr(embedUrl)}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    }

    case 'icon': {
      const clsAttr = `${escapeAttr(el.content)} wb-icon${animClass}${customClass}`;
      return `<i${idAttr} class="${clsAttr}"${styleAttr}></i>`;
    }

    case 'list': {
      const listTag = el.attributes.listTag || 'ul';
      const tagName = listTag === 'ol' ? 'ol' : 'ul';
      const checkCls = listTag === 'checklist' ? 'wb-checklist' : '';
      const clsAttr = `${checkCls}${animClass}${customClass}`.trim();
      return `<${tagName}${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</${tagName}>`;
    }

    case 'blockquote': {
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<blockquote${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</blockquote>`;
    }

    case 'code': {
      const showCopy = el.attributes.showCopy !== 'false';
      const clsAttr = `wb-code${animClass}${customClass}`;
      return `<div class="wb-code-wrap">${showCopy ? `<button type="button" class="wb-code-copy" data-copy-code>Copy</button>` : ''}<pre${idAttr} class="${clsAttr}"${styleAttr}><code>${escapeHtml(el.content)}</code></pre></div>`;
    }

    case 'divider':
    case 'spacer': {
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<div${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}></div>`;
    }

    case 'form': {
      const action = el.attributes.action || '#';
      const method = el.attributes.method || 'POST';
      const submitText = el.attributes.submitText || 'Send Message';
      const successMsg = el.attributes.successMessage || 'Thanks! Your message has been received.';
      let fields: FormField[] = [];
      try { fields = JSON.parse(el.attributes.fields || '[]'); } catch { /* fallback */ }
      if (fields.length === 0) {
        fields = [
          { id: 'f1', type: 'text', label: 'Name', name: 'name', placeholder: 'Your name', required: true },
          { id: 'f2', type: 'email', label: 'Email', name: 'email', placeholder: 'Your email', required: true },
          { id: 'f3', type: 'textarea', label: 'Message', name: 'message', placeholder: 'Your message', required: true },
        ];
      }
      const fieldsHtml = fields.map(f => {
        const req = f.required ? ' required' : '';
        const ph = escapeAttr(f.placeholder || '');
        const lbl = escapeHtml(f.label);
        const nm = escapeAttr(f.name || f.id);
        if (f.type === 'textarea') {
          return `<div class="form-group"><label>${lbl}</label><textarea name="${nm}" rows="4" placeholder="${ph}"${req}></textarea></div>`;
        }
        if (f.type === 'select') {
          const opts = (f.options ?? ['Option 1', 'Option 2']).map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('');
          return `<div class="form-group"><label>${lbl}</label><select name="${nm}"${req}>${opts}</select></div>`;
        }
        if (f.type === 'checkbox') {
          return `<div class="form-check"><input type="checkbox" name="${nm}" id="${escapeAttr(el.id)}_${nm}"${req}><label for="${escapeAttr(el.id)}_${nm}">${lbl}</label></div>`;
        }
        return `<div class="form-group"><label>${lbl}</label><input type="${escapeAttr(f.type)}" name="${nm}" placeholder="${ph}"${req}></div>`;
      }).join('\n  ');

      const clsAttr = `wb-form${animClass}${customClass}`;
      return `<form${idAttr} class="${clsAttr}" action="${escapeAttr(action)}" method="${escapeAttr(method)}"${styleAttr}>
  ${fieldsHtml}
  <button type="submit">${escapeHtml(submitText)}</button>
  <div class="wb-form-feedback">${escapeHtml(successMsg)}</div>
</form>`;
    }

    case 'map': {
      const clsAttr = `wb-map${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}><iframe src="${escapeAttr(el.content)}" allowfullscreen loading="lazy"></iframe></div>`;
    }

    case 'embed': {
      const clsAttr = `wb-embed${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}><iframe src="${escapeAttr(el.content)}" title="${escapeAttr(el.attributes.title || 'Embed')}" loading="lazy"></iframe></div>`;
    }

    case 'social-links': {
      let links: SocialLinkItem[] = [];
      try { links = JSON.parse(el.attributes.links || '[]'); } catch { /* ignore */ }
      const variant = el.attributes.variant || 'circle';
      const items = links.map(l =>
        `<a href="${escapeAttr(l.url || '#')}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(l.platform)}"><i class="${escapeAttr(l.icon)}"></i>${variant === 'pill' ? `<span>${escapeHtml(l.platform)}</span>` : ''}</a>`
      ).join('\n  ');
      const clsAttr = `wb-social-links ${escapeAttr(variant)}${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>\n  ${items}\n</div>`;
    }

    case 'container': {
      const children = el.children.map(child => renderElement(child, ctx)).join('\n');
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<div${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>\n${children}\n</div>`;
    }

    case 'badge': {
      const variant = el.attributes.variant || 'soft';
      const icon = el.attributes.icon ? `<i class="${escapeAttr(el.attributes.icon)}"></i>` : '';
      const clsAttr = `wb-badge wb-badge-${escapeAttr(variant)}${animClass}${customClass}`;
      return `<span${idAttr} class="${clsAttr}"${styleAttr}>${icon}<span>${el.content}</span></span>`;
    }

    case 'card': {
      const title = el.attributes.title || 'Card Title';
      const desc = el.attributes.description || '';
      const icon = el.attributes.icon || '';
      const imgUrl = resolveAssetUrl(el.attributes.imageUrl || '', ctx);
      const ctaText = el.attributes.ctaText || '';
      const resolved = resolveHref(el.attributes.ctaHref, ctx);
      const clsAttr = `wb-card${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>
  ${imgUrl ? `<img class="wb-card-img" src="${escapeAttr(imgUrl)}" alt="${escapeAttr(title)}" loading="lazy">` : ''}
  ${!imgUrl && icon ? `<div class="wb-card-icon"><i class="${escapeAttr(icon)}"></i></div>` : ''}
  <h3 class="wb-card-title">${escapeHtml(title)}</h3>
  <p class="wb-card-desc">${escapeHtml(desc)}</p>
  ${ctaText ? `<a href="${escapeAttr(resolved.href)}"${resolved.extraAttr} class="wb-card-cta">${escapeHtml(ctaText)}</a>` : ''}
</div>`;
    }

    case 'accordion': {
      let items: AccordionItem[] = [];
      try { items = JSON.parse(el.attributes.items || '[]'); } catch { /* ignore */ }
      const allowMultiple = el.attributes.allowMultiple === 'true';
      const itemsHtml = items.map(item => {
        const openCls = item.openByDefault ? ' open' : '';
        return `<div class="wb-acc-item${openCls}">
  <button type="button" class="wb-acc-trigger" aria-expanded="${item.openByDefault ? 'true' : 'false'}">
    <span>${escapeHtml(item.title)}</span>
    <i class="fas fa-chevron-down wb-acc-chevron"></i>
  </button>
  <div class="wb-acc-body"${item.openByDefault ? '' : ' style="display:none;"'}>${escapeHtml(item.content)}</div>
</div>`;
      }).join('\n');
      const clsAttr = `wb-accordion${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}" data-allow-multiple="${allowMultiple ? 'true' : 'false'}"${styleAttr}>\n${itemsHtml}\n</div>`;
    }

    case 'tabs': {
      let items: TabItem[] = [];
      try { items = JSON.parse(el.attributes.items || '[]'); } catch { /* ignore */ }
      const variant = el.attributes.variant || 'underline';
      const navHtml = items.map((t, idx) =>
        `<button type="button" class="wb-tab-btn${idx === 0 ? ' active' : ''}" data-tab-idx="${idx}">${escapeHtml(t.label)}</button>`
      ).join('');
      const panelsHtml = items.map((t, idx) =>
        `<div class="wb-tab-panel" data-tab-panel="${idx}"${idx === 0 ? '' : ' style="display:none;"'}>${escapeHtml(t.content)}</div>`
      ).join('');
      const clsAttr = `wb-tabs ${escapeAttr(variant)}${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}><div class="wb-tabs-nav">${navHtml}</div>${panelsHtml}</div>`;
    }

    case 'progress': {
      const label = el.attributes.label || 'Progress';
      const value = Math.max(0, Math.min(100, Number(el.attributes.value ?? 75)));
      const showValue = el.attributes.showValue !== 'false';
      const barColor = el.attributes.barColor || 'var(--site-accent)';
      const clsAttr = `wb-progress-wrap${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>
  <div class="wb-progress-head"><span>${escapeHtml(label)}</span>${showValue ? `<span>${value}%</span>` : ''}</div>
  <div class="wb-progress-track"><div class="wb-progress-fill" style="width:${value}%;background:${escapeAttr(barColor)};"></div></div>
</div>`;
    }

    case 'alert': {
      const variant = el.attributes.variant || 'info';
      const title = el.attributes.title || 'Notice';
      const icon = el.attributes.icon || 'fas fa-circle-info';
      const clsAttr = `wb-alert wb-alert-${escapeAttr(variant)}${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>
  <i class="${escapeAttr(icon)} wb-alert-icon"></i>
  <div><div class="wb-alert-title">${escapeHtml(title)}</div><div class="wb-alert-text">${el.content}</div></div>
</div>`;
    }

    case 'stat': {
      const val = el.attributes.value || '99%';
      const label = el.attributes.label || 'Metric';
      const delta = el.attributes.delta || '';
      const pos = el.attributes.deltaPositive !== 'false';
      const clsAttr = `wb-stat${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>
  <div class="wb-stat-value">${escapeHtml(val)}</div>
  <div class="wb-stat-label">${escapeHtml(label)}</div>
  ${delta ? `<span class="wb-stat-delta ${pos ? 'pos' : 'neg'}">${escapeHtml(delta)}</span>` : ''}
</div>`;
    }

    case 'table': {
      let data: TableData = { headers: [], rows: [], striped: true };
      try { data = JSON.parse(el.attributes.tableData || '{}'); } catch { /* ignore */ }
      const ths = (data.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('');
      const trs = (data.rows || []).map(row =>
        `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
      ).join('\n    ');
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<div${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>
  <table class="wb-table${data.striped !== false ? ' striped' : ''}">
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</div>`;
    }

    case 'avatar': {
      const img = resolveAssetUrl(el.attributes.imageUrl || '', ctx);
      const name = el.attributes.name || 'Alex Morgan';
      const role = el.attributes.role || 'Designer';
      const rating = Math.max(0, Math.min(5, Number(el.attributes.rating ?? 0)));
      const stars = rating > 0
        ? `<div class="wb-avatar-stars">${Array.from({ length: rating }, () => '<i class="fas fa-star"></i>').join('')}</div>`
        : '';
      const clsAttr = `wb-avatar${animClass}${customClass}`;
      return `<div${idAttr} class="${clsAttr}"${styleAttr}>
  ${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" class="wb-avatar-img" loading="lazy">` : ''}
  <div>
    <div class="wb-avatar-name">${escapeHtml(name)}</div>
    <div class="wb-avatar-role">${escapeHtml(role)}</div>
    ${stars}
  </div>
</div>`;
    }

    case 'html': {
      const clsAttr = `${animClass}${customClass}`.trim();
      return `<div${idAttr}${clsAttr ? ` class="${clsAttr}"` : ''}${styleAttr}>${el.content}</div>`;
    }

    default:
      return `<div${idAttr}${styleAttr}>${el.content}</div>`;
  }
}

/* ========== Render Header (Synced with Project Pages & Settings) ========== */

function renderDynamicHeader(ctx: RenderContext): string {
  const { project, currentPage } = ctx;
  const headerStyle = project.settings.headerStyle || 'glass';
  const siteName = project.settings.siteName || project.name;
  const visiblePages = project.pageOrder
    .map(id => project.pages[id])
    .filter(p => p && !p.hidden);

  const navLinks = visiblePages.map(p => {
    const isActive = currentPage?.id === p.id;
    const targetPath = ctx.isPreview ? '#' : `${ctx.prefix}${getPageFilePath(p, project.pages)}`;
    const gotoAttr = ctx.isPreview ? ` data-goto="${escapeAttr(p.id)}"` : '';
    return `<a href="${escapeAttr(targetPath)}"${gotoAttr} class="wb-nav-link${isActive ? ' active' : ''}">${escapeHtml(p.title)}</a>`;
  }).join('\n        ');

  const ctaEnabled = project.settings.headerCtaEnabled && headerStyle !== 'minimal';
  const ctaResolved = resolveHref(project.settings.headerCtaHref, ctx);
  const ctaHtml = ctaEnabled
    ? `<a href="${escapeAttr(ctaResolved.href)}"${ctaResolved.extraAttr} class="wb-header-cta">${escapeHtml(project.settings.headerCtaText || 'Get Started')}</a>`
    : '';

  const homeTarget = visiblePages[0]
    ? (ctx.isPreview ? '#' : `${ctx.prefix}${getPageFilePath(visiblePages[0], project.pages)}`)
    : '#';
  const homeGoto = visiblePages[0] && ctx.isPreview ? ` data-goto="${escapeAttr(visiblePages[0].id)}"` : '';

  const rawHeaderStyles: Record<string, string | undefined> = { ...project.header.styles };
  if (headerStyle === 'glass' && rawHeaderStyles.backgroundColor === 'var(--site-bg)') {
    delete rawHeaderStyles.backgroundColor;
  }
  const headerStyleCss = stylesToCSS(rawHeaderStyles);
  const headerStyleAttr = headerStyleCss ? ` style="${escapeAttr(headerStyleCss)}"` : '';

  return `<header class="site-header header-${escapeAttr(headerStyle)}"${headerStyleAttr}>
  <div class="wb-header-inner">
    <a href="${escapeAttr(homeTarget)}"${homeGoto} class="wb-header-brand">${escapeHtml(siteName)}</a>
    <nav class="wb-header-nav" aria-label="Primary Navigation">
      ${navLinks}
    </nav>
    <div style="display:flex;align-items:center;gap:0.75rem;">
      ${ctaHtml}
      <button type="button" class="wb-mobile-toggle" aria-label="Toggle Menu" data-mobile-menu-toggle>
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </div>
  <div class="wb-mobile-drawer" data-mobile-drawer>
    ${navLinks}
    ${ctaHtml}
  </div>
</header>`;
}

/* ========== Render Section ========== */

function renderSection(section: SectionNode, ctx: RenderContext, isFooter = false): string {
  if (section.hidden) return '';

  const sectionStyles = { ...section.styles };
  if (sectionStyles.backgroundImage && ctx.assetUrlMap) {
    for (const [dataUrl, rel] of ctx.assetUrlMap.entries()) {
      if (sectionStyles.backgroundImage.includes(dataUrl)) {
        sectionStyles.backgroundImage = sectionStyles.backgroundImage.replace(dataUrl, `${ctx.prefix}${rel}`);
      }
    }
  }

  const sectionStyle = stylesToCSS(sectionStyles);
  const sectionClass = `wb-section${section.fullBleed ? ' full-bleed' : ''}`;
  const anchorAttr = section.anchorId ? ` id="${escapeAttr(section.anchorId)}"` : '';

  const rowsHtml = section.rows.map(row => {
    const rowStyle = stylesToCSS(row.styles);
    const colsHtml = row.columns.map(col => {
      const colStyle = stylesToCSS(col.styles);
      const elHtml = col.elements.map(el => renderElement(el, ctx)).join('\n      ');
      return `    <div class="wb-col wb-col-${col.span}"${colStyle ? ` style="${escapeAttr(colStyle)}"` : ''}>\n      ${elHtml}\n    </div>`;
    }).join('\n');
    return `  <div class="wb-row"${rowStyle ? ` style="${escapeAttr(rowStyle)}"` : ''}>\n${colsHtml}\n  </div>`;
  }).join('\n');

  const topDivider = section.shapeDividerTop && section.shapeDividerTop !== 'none'
    ? `<div class="wb-shape-divider top" style="color:${escapeAttr(section.shapeDividerColor || 'var(--site-bg)')};">${getShapeDividerSVG(section.shapeDividerTop, false)}</div>`
    : '';
  const bottomDivider = section.shapeDividerBottom && section.shapeDividerBottom !== 'none'
    ? `<div class="wb-shape-divider bottom" style="color:${escapeAttr(section.shapeDividerColor || 'var(--site-bg)')};">${getShapeDividerSVG(section.shapeDividerBottom, true)}</div>`
    : '';
  const overlayHtml = section.backgroundOverlay
    ? `<div class="wb-section-overlay" style="background:${escapeAttr(section.backgroundOverlay)};"></div>`
    : '';

  const inner = `${overlayHtml}${topDivider}<div class="wb-section-inner">\n${rowsHtml}\n</div>${bottomDivider}`;

  if (isFooter) {
    return `<footer class="site-footer">\n<div class="${sectionClass}" data-sec-id="${escapeAttr(section.id)}"${anchorAttr}${sectionStyle ? ` style="${escapeAttr(sectionStyle)}"` : ''}>\n${inner}\n</div>\n</footer>`;
  }
  return `<section class="${sectionClass}" data-sec-id="${escapeAttr(section.id)}"${anchorAttr}${sectionStyle ? ` style="${escapeAttr(sectionStyle)}"` : ''}>\n${inner}\n</section>`;
}

/* ========== Interactive Vanilla JS Bundle ========== */

export function generateSiteJS(respectInitialTheme = false): string {
  const initThemeBlock = respectInitialTheme
    ? ''
    : `  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
`;
  const persistThemeLine = respectInitialTheme
    ? ''
    : `    try { localStorage.setItem('theme', next); } catch (e) {}\n`;
  return `// Website Builder Pro — Interactive Runtime
(function () {
  // 1. Theme Persistence & Toggle
${initThemeBlock}
  window.toggleTheme = function () {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
${persistThemeLine}  };

  // 2. Mobile Drawer Navigation
  document.querySelectorAll('[data-mobile-menu-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var header = btn.closest('.site-header');
      var drawer = header && header.querySelector('[data-mobile-drawer]');
      if (drawer) drawer.classList.toggle('open');
    });
  });

  // 3. Accordions
  document.querySelectorAll('.wb-accordion').forEach(function (acc) {
    var allowMultiple = acc.getAttribute('data-allow-multiple') === 'true';
    acc.querySelectorAll('.wb-acc-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var item = trigger.closest('.wb-acc-item');
        if (!item) return;
        var isOpen = item.classList.contains('open');
        if (!allowMultiple) {
          acc.querySelectorAll('.wb-acc-item.open').forEach(function (other) {
            if (other !== item) {
              other.classList.remove('open');
              var b = other.querySelector('.wb-acc-body');
              if (b) b.style.display = 'none';
              var t = other.querySelector('.wb-acc-trigger');
              if (t) t.setAttribute('aria-expanded', 'false');
            }
          });
        }
        item.classList.toggle('open', !isOpen);
        trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        var body = item.querySelector('.wb-acc-body');
        if (body) body.style.display = !isOpen ? 'block' : 'none';
      });
    });
  });

  // 4. Tabs
  document.querySelectorAll('.wb-tabs').forEach(function (tabs) {
    var btns = tabs.querySelectorAll('.wb-tab-btn');
    var panels = tabs.querySelectorAll('.wb-tab-panel');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = btn.getAttribute('data-tab-idx');
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        panels.forEach(function (p) {
          p.style.display = p.getAttribute('data-tab-panel') === idx ? 'block' : 'none';
        });
      });
    });
  });

  // 5. Code Copy Buttons
  document.querySelectorAll('[data-copy-code]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.parentElement && btn.parentElement.querySelector('pre');
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent || '').then(function () {
        var orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = orig; }, 1600);
      });
    });
  });

  // 6. Demo Form Handling when action="#"
  document.querySelectorAll('form.wb-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action');
      if (!action || action === '#') {
        e.preventDefault();
        var fb = form.querySelector('.wb-form-feedback');
        if (fb) fb.classList.add('visible');
        form.reset();
      }
    });
  });

  // 7. Scroll Reveal Entrance Animations
  var animEls = document.querySelectorAll('.wb-anim');
  if (animEls.length > 0) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      animEls.forEach(function (el) { io.observe(el); });
    } else {
      animEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }
})();
`;
}

/* ========== Generate Single Page HTML (Export & Inspector) ========== */

export function generatePageHTML(
  project: BuilderProject,
  page: PageData,
  cssFilePath: string,
  jsFilePath = 'script.js',
  assetUrlMap?: Map<string, string>,
  prefix = '',
): string {
  const usedFonts = collectUsedFonts(project);
  const fontsUrl = getGoogleFontsUrl(project.theme, usedFonts);
  const allSections = [
    ...(project.settings.headerEnabled ? [project.header] : []),
    ...page.sections,
    ...(project.settings.footerEnabled ? [project.footer] : []),
  ];
  const hoverCSS = collectHoverCSS(allSections);
  const respCSS = generateResponsiveCSS(allSections);

  const ctx: RenderContext = {
    project,
    currentPage: page,
    isPreview: false,
    prefix,
    assetUrlMap,
  };

  const bodyContent = [
    project.settings.headerEnabled ? renderDynamicHeader(ctx) : '',
    '<main>',
    ...page.sections.map(s => renderSection(s, ctx)),
    '</main>',
    project.settings.footerEnabled ? renderSection(project.footer, ctx, true) : '',
  ].filter(Boolean).join('\n\n');

  const showToggle = project.settings.showThemeToggle !== false;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.seo.title || page.title)} — ${escapeHtml(project.settings.siteName)}</title>
  <meta name="description" content="${escapeAttr(page.seo.description || '')}">
  ${page.seo.ogImage ? `<meta property="og:image" content="${escapeAttr(page.seo.ogImage)}">` : ''}
  <meta property="og:title" content="${escapeAttr(page.seo.title || page.title)}">
  ${fontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${fontsUrl}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="${cssFilePath}">
  ${project.settings.favicon ? `<link rel="icon" href="${prefix}assets/favicon.png">` : ''}
  ${hoverCSS ? `<style>\n${hoverCSS}\n</style>` : ''}
  ${respCSS ? `<style>\n${respCSS}\n</style>` : ''}
  ${project.settings.globalCSS ? `<style>\n${project.settings.globalCSS}\n</style>` : ''}
  ${project.settings.customHeadCode || ''}
</head>
<body>
${bodyContent}

${showToggle ? '<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>' : ''}
<script src="${jsFilePath}"></script>
${project.settings.analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttr(project.settings.analyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${escapeAttr(project.settings.analyticsId)}');</script>` : ''}
</body>
</html>`;
}

/* ========== Standalone Single-Page HTML Download ========== */

export function generateSinglePageStandaloneHTML(
  project: BuilderProject,
  page: PageData,
  themeMode: 'light' | 'dark' = 'light',
): string {
  const usedFonts = collectUsedFonts(project);
  const fontsUrl = getGoogleFontsUrl(project.theme, usedFonts);
  const baseCSS = generateBaseCSS(project.theme);
  const siteJS = generateSiteJS();
  const allSections = [
    ...(project.settings.headerEnabled ? [project.header] : []),
    ...page.sections,
    ...(project.settings.footerEnabled ? [project.footer] : []),
  ];
  const hoverCSS = collectHoverCSS(allSections);
  const respCSS = generateResponsiveCSS(allSections);

  const ctx: RenderContext = {
    project,
    currentPage: page,
    isPreview: false,
    prefix: '',
  };

  const bodyContent = [
    project.settings.headerEnabled ? renderDynamicHeader(ctx) : '',
    '<main>',
    ...page.sections.map(s => renderSection(s, ctx)),
    '</main>',
    project.settings.footerEnabled ? renderSection(project.footer, ctx, true) : '',
  ].filter(Boolean).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeMode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.seo.title || page.title)} — ${escapeHtml(project.settings.siteName)}</title>
  <meta name="description" content="${escapeAttr(page.seo.description || '')}">
  ${fontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${fontsUrl}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${baseCSS}\n${hoverCSS}\n${respCSS}\n${project.settings.globalCSS || ''}</style>
  ${project.settings.customHeadCode || ''}
</head>
<body>
${bodyContent}
${project.settings.showThemeToggle !== false ? '<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>' : ''}
<script>${siteJS}</script>
</body>
</html>`;
}

/* ========== Preview HTML (all-in-one multi-page) ========== */

export function generatePreviewHTML(
  project: BuilderProject,
  themeMode: 'light' | 'dark',
  initialPageId?: string,
  embedMode = false,
): string {
  const usedFonts = collectUsedFonts(project);
  const fontsUrl = getGoogleFontsUrl(project.theme, usedFonts);
  const css = generateBaseCSS(project.theme);
  const siteJS = generateSiteJS(true);
  const pages = project.pageOrder.map(id => project.pages[id]).filter(Boolean);
  const startId = initialPageId && project.pages[initialPageId] ? initialPageId : pages[0]?.id ?? '';

  const pagesHTML = pages.map(page => {
    const ctx: RenderContext = {
      project,
      currentPage: page,
      isPreview: true,
      prefix: '',
    };

    const bodyContent = [
      project.settings.headerEnabled ? renderDynamicHeader(ctx) : '',
      '<main>',
      ...page.sections.map(s => renderSection(s, ctx)),
      '</main>',
      project.settings.footerEnabled ? renderSection(project.footer, ctx, true) : '',
    ].filter(Boolean).join('\n');

    const allSections = [
      ...(project.settings.headerEnabled ? [project.header] : []),
      ...page.sections,
      ...(project.settings.footerEnabled ? [project.footer] : []),
    ];
    const hoverCSS = collectHoverCSS(allSections);
    const respCSS = generateResponsiveCSS(allSections);

    return `<div class="wb-page" data-page-id="${escapeAttr(page.id)}" data-page-title="${escapeAttr(page.title)}" style="display:none;">\n${bodyContent}\n${hoverCSS ? `<style>${hoverCSS}</style>` : ''}\n${respCSS ? `<style>${respCSS}</style>` : ''}\n</div>`;
  }).join('\n');

  const navLinks = pages.filter(p => !p.hidden).map(p =>
    `<a href="#" data-goto="${escapeAttr(p.id)}" class="preview-nav-link">${escapeHtml(p.title)}</a>`
  ).join('\n    ');

  const previewChromeCSS = embedMode
    ? ''
    : `<style>
    .preview-bar { position:fixed;top:0;left:0;right:0;height:48px;background:#0e0e16;color:#fff;display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:0 1rem;z-index:10000;font-family:system-ui;font-size:0.85rem;border-bottom:1px solid #27273a; }
    .preview-bar a,.preview-bar button { color:#d4d4e4;background:none;border:1px solid #2c2c3f;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;text-decoration:none; }
    .preview-bar a.active,.preview-bar button.active { background:#6366f1;border-color:#6366f1;color:#fff; }
    .preview-content { padding-top:48px; }
  </style>`;

  const previewBarHTML = embedMode
    ? ''
    : `<div class="preview-bar">
  <span style="font-weight:700;margin-right:0.75rem;">${escapeHtml(project.settings.siteName)}</span>
  ${navLinks}
  <span style="margin-left:auto;display:flex;gap:0.45rem;">
    <button onclick="setViewport('100%')" class="active" id="vd">Desktop</button>
    <button onclick="setViewport('768px')" id="vt">Tablet</button>
    <button onclick="setViewport('375px')" id="vm">Mobile</button>
    <button onclick="toggleTheme()">🌓</button>
  </span>
</div>`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="${themeMode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview — ${escapeHtml(project.settings.siteName)}</title>
  ${fontsUrl ? `<link href="${fontsUrl}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${css}</style>
  ${project.settings.globalCSS ? `<style>${project.settings.globalCSS}</style>` : ''}
  ${previewChromeCSS}
</head>
<body>
${previewBarHTML}
<div class="preview-content" id="preview-content">
${pagesHTML}
</div>
<script>
function showPage(id){
  document.querySelectorAll('.wb-page').forEach(function(p){p.style.display='none';});
  var el=document.querySelector('[data-page-id="'+id+'"]');
  if(el){
    el.style.display='block';
    el.querySelectorAll('.wb-anim').forEach(function(a){a.classList.add('is-visible');});
  }
  document.querySelectorAll('.preview-nav-link').forEach(function(a){a.classList.toggle('active',a.getAttribute('data-goto')===id);});
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-goto]').forEach(function(a){
  a.addEventListener('click',function(e){e.preventDefault();showPage(a.getAttribute('data-goto'));});
});
showPage('${escapeAttr(startId)}');
function setViewport(w){
  var c=document.getElementById('preview-content');
  c.style.maxWidth=w;
  c.style.margin='0 auto';
  document.querySelectorAll('#vd,#vt,#vm').forEach(function(b){b.classList.remove('active');});
  if(w==='100%')document.getElementById('vd').classList.add('active');
  else if(w==='768px')document.getElementById('vt').classList.add('active');
  else document.getElementById('vm').classList.add('active');
}
</script>
<script>${siteJS}</script>
</body>
</html>`;
}

/* ========== Export as Production ZIP ========== */

export async function exportProjectZip(project: BuilderProject): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Map dataUrl assets to relative paths in assets/
  const assetUrlMap = new Map<string, string>();
  for (const asset of Object.values(project.assets)) {
    try {
      const base64Data = asset.dataUrl.split(',')[1];
      if (base64Data) {
        const rawExt = asset.mimeType.split('/')[1] || 'bin';
        const ext = rawExt.split('+')[0];
        const safePath = `assets/${asset.id}.${ext}`;
        zip.file(safePath, base64Data, { base64: true });
        assetUrlMap.set(asset.dataUrl, safePath);
      }
    } catch { /* skip invalid assets */ }
  }

  // Generate CSS & JS
  const css = generateBaseCSS(project.theme);
  zip.file('style.css', css);
  zip.file('script.js', generateSiteJS());

  // Generate pages
  const pages = project.pageOrder.map(id => project.pages[id]).filter(Boolean);
  const sitemapUrls: string[] = [];

  for (const page of pages) {
    const depth = getPageDepth(page, project.pages);
    const prefix = '../'.repeat(depth);
    const cssPath = `${prefix}style.css`;
    const jsPath = `${prefix}script.js`;
    const html = generatePageHTML(project, page, cssPath, jsPath, assetUrlMap, prefix);
    const filePath = getPageFilePath(page, project.pages);
    zip.file(filePath, html);
    sitemapUrls.push(filePath);
  }

  // Sitemap & Robots.txt
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url><loc>/${u}</loc></url>`).join('\n')}
</urlset>
`;
  zip.file('sitemap.xml', sitemap);
  zip.file('robots.txt', 'User-agent: *\nAllow: /\n');
  zip.file(
    'README.md',
    `# ${project.settings.siteName}\n\nExported from **Website Builder Pro**.\n\n## Files\n- \`index.html\` & subpages: static HTML5 pages\n- \`style.css\`: theme tokens, grid layout & widget styles\n- \`script.js\`: theme toggle, mobile navigation, tabs, accordions & animations\n- \`sitemap.xml\` & \`robots.txt\`: SEO metadata\n`,
  );

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

export function getPageFilePath(page: PageData, pages: Record<string, PageData>): string {
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
