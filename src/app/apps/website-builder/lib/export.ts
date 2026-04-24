import type { BuilderState } from "./types";
import { getBaseCSS } from "./css";
import { getPageExportPath, getRelativePrefix } from "./reducer";

/* ────────────────────────────────────────────────────────────────────────────
   Export ZIP + Preview generation
   ──────────────────────────────────────────────────────────────────────────── */

/* ── video URL conversion ── */
function convertVideoUrl(url: string): string {
  if (!url) return url;
  let m = url.match(
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
  m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return url;
}

export { convertVideoUrl };

/* ── Hover CSS extraction from a DOM tree ── */
function extractHoverCSS(container: HTMLElement): string {
  let css = "";
  container.querySelectorAll("[data-hover]").forEach((el) => {
    const id = (el as HTMLElement).id;
    if (!id) return;
    try {
      const hover = JSON.parse(
        el.getAttribute("data-hover") || "{}"
      ) as Record<string, string>;
      const rules = Object.entries(hover)
        .map(
          ([p, v]) =>
            `${p.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}!important`
        )
        .join(";");
      if (rules) css += `#${id}:hover{${rules};transition:all 0.2s ease;}\n`;
    } catch {
      /* ignore bad JSON */
    }
  });
  return css;
}

/* ── Clean a cloned DOM node for export ── */
function cleanNode(
  node: HTMLElement,
  prefix: string,
  assets: BuilderState["assets"]
) {
  node
    .querySelectorAll(".active-el")
    .forEach((e) => e.classList.remove("active-el"));
  node
    .querySelectorAll("[contenteditable]")
    .forEach((e) => e.removeAttribute("contenteditable"));
  node.querySelectorAll(".b-col").forEach((c) => {
    const el = c as HTMLElement;
    if (!el.style.border || el.style.border === "none")
      el.style.border = "none";
  });
  node.querySelectorAll("[data-asset]").forEach((e) => {
    const aid = e.getAttribute("data-asset")!;
    if (assets[aid]) {
      const fname = prefix + "assets/" + assets[aid].name;
      if (e.tagName === "IMG") (e as HTMLImageElement).src = fname;
      else if (e.tagName === "VIDEO") (e as HTMLVideoElement).src = fname;
      else if (e.classList.contains("video-wrapper")) {
        const v = e.querySelector("video");
        if (v) v.src = fname;
      }
    }
  });
  node.querySelectorAll("[data-bg-asset]").forEach((e) => {
    const aid = e.getAttribute("data-bg-asset")!;
    if (assets[aid]) {
      (e as HTMLElement).style.backgroundImage = `url('${prefix}assets/${assets[aid].name}')`;
    }
  });
}

/* ── Preview HTML ─────────────────────────────────────────────────────────── */

export function generatePreviewHTML(
  state: BuilderState,
  headerHTML: string,
  footerHTML: string,
  mainHTML: string
): string {
  /* collect hover CSS from all pages */
  let allHoverCSS = "";
  const tempDiv = document.createElement("div");

  for (const id in state.pages) {
    tempDiv.innerHTML = state.pages[id].html;
    allHoverCSS += extractHoverCSS(tempDiv);
  }

  /* clean the page HTML snippets for preview */
  const cleanPages: Record<string, { title: string; html: string }> = {};
  const pathMap: Record<string, string> = {};

  for (const id in state.pages) {
    pathMap[getPageExportPath(id, state.pages)] = id;
    tempDiv.innerHTML = state.pages[id].html;
    tempDiv
      .querySelectorAll(".active-el")
      .forEach((e) => e.classList.remove("active-el"));
    tempDiv
      .querySelectorAll("[contenteditable]")
      .forEach((e) => e.removeAttribute("contenteditable"));
    tempDiv.querySelectorAll(".b-col").forEach((c) => {
      const el = c as HTMLElement;
      if (!el.style.border || el.style.border === "none")
        el.style.border = "none";
    });
    cleanPages[id] = {
      title: state.pages[id].title,
      html: tempDiv.innerHTML,
    };
  }

  /* clean header/footer */
  const hDiv = document.createElement("div");
  hDiv.innerHTML = headerHTML;
  const fDiv = document.createElement("div");
  fDiv.innerHTML = footerHTML;
  [hDiv, fDiv].forEach((d) => {
    d.querySelectorAll(".active-el").forEach((e) =>
      e.classList.remove("active-el")
    );
    d.querySelectorAll("[contenteditable]").forEach((e) =>
      e.removeAttribute("contenteditable")
    );
    d.querySelectorAll("a[data-page-id]").forEach((a) => {
      const pid = a.getAttribute("data-page-id")!;
      a.setAttribute("href", getPageExportPath(pid, state.pages));
      a.removeAttribute("onclick");
    });
  });

  const cleanMainDiv = document.createElement("div");
  cleanMainDiv.innerHTML = mainHTML;
  cleanMainDiv
    .querySelectorAll(".active-el")
    .forEach((e) => e.classList.remove("active-el"));
  cleanMainDiv
    .querySelectorAll("[contenteditable]")
    .forEach((e) => e.removeAttribute("contenteditable"));

  const pagesJson = JSON.stringify(cleanPages)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  const pathMapJson = JSON.stringify(pathMap);

  const mode = state.canvasThemeMode;
  const t = state.theme;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview — ${state.pages[state.currentPage]?.title || "Untitled"}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root{--site-bg:${t.light.bg};--site-text:${t.light.txt};--site-accent:${t.accent};}
[data-theme="dark"]{--site-bg:${t.dark.bg};--site-text:${t.dark.txt};}
body{margin:0;font-family:'DM Sans',sans-serif;background:var(--site-bg);color:var(--site-text);transition:background 0.3s,color 0.3s;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;}
${getBaseCSS()}
#theme-toggle{position:fixed;bottom:20px;right:20px;background:var(--site-text);color:var(--site-bg);border:none;padding:10px 18px;border-radius:50px;cursor:pointer;font-weight:600;font-family:inherit;box-shadow:0 8px 20px rgba(0,0,0,0.2);z-index:100;font-size:0.85rem;}
${state.customCSS}
${allHoverCSS}
</style>
</head>
<body data-theme="${mode}">
${hDiv.innerHTML}
<main id="page-content">${cleanMainDiv.innerHTML}</main>
${fDiv.innerHTML}
<button id="theme-toggle" onclick="var b=document.body,t=b.getAttribute('data-theme')==='light';b.setAttribute('data-theme',t?'dark':'light');this.textContent=t?'☀️ Light':'🌙 Dark'">${mode === "dark" ? "☀️ Light" : "🌙 Dark"}</button>
<script>
var siteData=${pagesJson};
var pathMap=${pathMapJson};
window.app={loadPage:function(id){if(siteData[id]){document.getElementById('page-content').innerHTML=siteData[id].html;document.title='Preview — '+siteData[id].title;window.scrollTo(0,0);}}};
document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(h&&pathMap[h]){e.preventDefault();window.app.loadPage(pathMap[h]);}});
</script>
</body>
</html>`;
}

/* ── Export ZIP ────────────────────────────────────────────────────────────── */

export async function exportSiteZip(
  state: BuilderState,
  headerEl: HTMLElement,
  footerEl: HTMLElement
): Promise<Blob> {
  /* dynamically import JSZip */
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const assetsFolder = zip.folder("assets")!;

  /* bundle assets */
  for (const id in state.assets) {
    const asset = state.assets[id];
    if (asset.base64) assetsFolder.file(asset.name, asset.base64, { base64: true });
  }
  if (state.favicon) {
    const b64 = state.favicon.split(",")[1];
    assetsFolder.file("favicon.png", b64, { base64: true });
  }

  /* CSS file */
  const t = state.theme;
  const css = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
:root{--site-bg:${t.light.bg};--site-text:${t.light.txt};--site-accent:${t.accent};}
[data-theme="dark"]{--site-bg:${t.dark.bg};--site-text:${t.dark.txt};}
body{margin:0;font-family:'DM Sans',sans-serif;background:var(--site-bg);color:var(--site-text);transition:background 0.3s,color 0.3s;min-height:100vh;display:flex;flex-direction:column;}
${getBaseCSS()}
#theme-toggle{position:fixed;bottom:20px;right:20px;background:var(--site-text);color:var(--site-bg);border:none;padding:10px 18px;border-radius:50px;cursor:pointer;font-weight:600;font-family:inherit;box-shadow:0 8px 20px rgba(0,0,0,0.2);z-index:100;font-size:0.85rem;}
${state.customCSS}`;

  zip.file("style.css", css);

  const allPaths = Object.keys(state.pages).map((p) =>
    getPageExportPath(p, state.pages)
  );

  /* per-page HTML */
  for (const id in state.pages) {
    const prefix = getRelativePrefix(id, state.pages);
    const pagePath = getPageExportPath(id, state.pages);
    const pageDiv = document.createElement("div");
    pageDiv.innerHTML = state.pages[id].html;

    const ph = headerEl.cloneNode(true) as HTMLElement;
    const pf = footerEl.cloneNode(true) as HTMLElement;

    [pageDiv, ph, pf].forEach((node) => {
      cleanNode(node as HTMLElement, prefix, state.assets);
      node.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && allPaths.includes(href)) {
          a.setAttribute("href", prefix + href);
        }
      });
    });

    /* fix nav links */
    ph.querySelectorAll(".site-nav a[data-page-id]").forEach((a) => {
      const pid = a.getAttribute("data-page-id")!;
      a.setAttribute("href", prefix + getPageExportPath(pid, state.pages));
      a.classList.toggle("active-link", pid === id);
      a.removeAttribute("data-page-id");
      a.removeAttribute("onclick");
    });

    const hoverCSS = extractHoverCSS(pageDiv);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${state.pages[id].title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<link rel="stylesheet" href="${prefix}style.css">
${state.favicon ? `<link rel="icon" href="${prefix}assets/favicon.png">` : ""}
${hoverCSS ? `<style>${hoverCSS}</style>` : ""}
</head>
<body data-theme="light">
${ph.outerHTML}
<main id="page-content">${pageDiv.innerHTML}</main>
${pf.outerHTML}
<button id="theme-toggle" onclick="var b=document.body,t=b.getAttribute('data-theme')==='light';b.setAttribute('data-theme',t?'dark':'light');this.textContent=t?'☀️ Light':'🌙 Dark'">🌙 Dark</button>
<script>if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.body.setAttribute('data-theme','dark');document.getElementById('theme-toggle').textContent='☀️ Light';}<\/script>
</body>
</html>`;
    zip.file(pagePath, html);
  }

  return zip.generateAsync({ type: "blob" });
}
