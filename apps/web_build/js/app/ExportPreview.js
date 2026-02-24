export function setupExportPreview(App) {
    Object.assign(App.prototype, {
        previewSite() {
            this.savePage();
            
            let allHoverCSS = '';
            const tempDiv = document.createElement('div');
            const cleanPages = {};
            const pathMap = {}; 
            
            for (let id in this.siteData.pages) {
                pathMap[this.getPageExportPath(id)] = id;
                tempDiv.innerHTML = this.siteData.pages[id].html;
                
                tempDiv.querySelectorAll('[data-hover]').forEach(el => {
                    if (!el.id) return;
                    let hover = {};
                    try { hover = JSON.parse(el.getAttribute('data-hover')); } catch(e) {}
                    const rules = Object.entries(hover).map(([p,v]) => `${p.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}!important`).join(';');
                    if (rules && !allHoverCSS.includes(`#${el.id}:hover`)) {
                        allHoverCSS += `#${el.id}:hover{${rules};transition:all 0.2s ease;}\n`;
                    }
                });
                
                tempDiv.querySelectorAll('.active-el').forEach(e => e.classList.remove('active-el'));
                tempDiv.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
                tempDiv.querySelectorAll('.b-col').forEach(c => {
                    if (!c.style.border || c.style.border === 'none') c.style.border = 'none';
                });
                
                cleanPages[id] = { ...this.siteData.pages[id], html: tempDiv.innerHTML };
            }
            
            const cleanHeader = document.getElementById('global-header').cloneNode(true);
            const cleanFooter = document.getElementById('global-footer').cloneNode(true);
            [cleanHeader, cleanFooter].forEach(el => {
                el.querySelectorAll('.active-el').forEach(e => e.classList.remove('active-el'));
                el.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
                
                el.querySelectorAll('a[data-page-id]').forEach(a => {
                    const pid = a.getAttribute('data-page-id');
                    a.setAttribute('href', this.getPageExportPath(pid));
                    a.removeAttribute('onclick');
                });
            });

            const pagesDataString = JSON.stringify(cleanPages).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
            const pathMapString = JSON.stringify(pathMap);

            const siteHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview — ${cleanPages[this.currPage].title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root{--site-bg:${this.siteData.theme.light.bg};--site-text:${this.siteData.theme.light.txt};--site-accent:${this.siteData.theme.accent};}
[data-theme="dark"]{--site-bg:${this.siteData.theme.dark.bg};--site-text:${this.siteData.theme.dark.txt};}
body{margin:0;font-family:'DM Sans',sans-serif;background:var(--site-bg);color:var(--site-text);transition:background 0.3s,color 0.3s;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;}
${this.getBaseCSS()}
#theme-toggle{position:fixed;bottom:20px;right:20px;background:var(--site-text);color:var(--site-bg);border:none;padding:10px 18px;border-radius:50px;cursor:pointer;font-weight:600;font-family:inherit;box-shadow:0 8px 20px rgba(0,0,0,0.2);z-index:100;font-size:0.85rem;}
${this.siteData.customCSS}
${allHoverCSS}
</style>
</head>
<body data-theme="light">
${cleanHeader.outerHTML}
<main id="page-content">${cleanPages[this.currPage].html}</main>
${cleanFooter.outerHTML}

<button id="theme-toggle" onclick="var b=document.body,t=b.getAttribute('data-theme')==='light';b.setAttribute('data-theme',t?'dark':'light');this.textContent=t?'☀️ Light':'🌙 Dark'">🌙 Dark</button>
<script>
    if(window.matchMedia('(prefers-color-scheme:dark)').matches){
        document.body.setAttribute('data-theme','dark');
        document.getElementById('theme-toggle').textContent='☀️ Light';
    }
    
    const siteData = ${pagesDataString};
    const pathMap = ${pathMapString};
    
    window.app = {
        loadPage: function(id) {
            if(siteData[id]) {
                document.getElementById('page-content').innerHTML = siteData[id].html;
                document.title = 'Preview — ' + siteData[id].title;
                window.scrollTo(0,0);
                
                const currentPath = Object.keys(pathMap).find(key => pathMap[key] === id);
                document.querySelectorAll('.site-nav a').forEach(a => {
                    if (a.getAttribute('href') === currentPath) a.classList.add('active-link');
                    else a.classList.remove('active-link');
                });
            }
        }
    };

    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href && pathMap[href]) {
            e.preventDefault();
            window.app.loadPage(pathMap[href]);
        }
    });
</script>
</body>
</html>`;

            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>WebGenius Previewer</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
    body { margin: 0; background: #0c0f1a; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    .preview-toolbar { height: 56px; background: #141824; border-bottom: 1px solid #252b3d; display: flex; justify-content: center; align-items: center; gap: 12px; flex-shrink: 0; position: relative; }
    .preview-toolbar button { background: #1a1f30; border: 1px solid #2e3650; color: #e8eaf0; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s; font-family: inherit;}
    .preview-toolbar button:hover { background: #252b3d; }
    .preview-toolbar button.active { background: #5b6af0; border-color: #5b6af0; color: white; }
    .preview-container { flex: 1; display: flex; justify-content: center; align-items: center; padding: 32px; overflow: hidden; }
    iframe { width: 100%; height: 100%; background: #fff; border: none; border-radius: 8px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
    iframe.mobile { width: 390px; height: 844px; max-height: 100%; border: 14px solid #1e293b; border-radius: 36px; }
    .close-btn { position: absolute; right: 20px; background: transparent !important; border: none !important; color: #6b7280 !important; }
    .close-btn:hover { color: #fff !important; }
</style></head>
<body>
    <div class="preview-toolbar">
        <button id="btn-desktop" class="active" onclick="setMode('desktop')"><i class="fas fa-desktop"></i> Desktop</button>
        <button id="btn-mobile" onclick="setMode('mobile')"><i class="fas fa-mobile-alt"></i> Mobile</button>
        <button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> Close</button>
    </div>
    <div class="preview-container"><iframe id="preview-frame"></iframe></div>
    <script>
        function setMode(mode) {
            const frame = document.getElementById('preview-frame');
            document.getElementById('btn-desktop').classList.toggle('active', mode === 'desktop');
            document.getElementById('btn-mobile').classList.toggle('active', mode === 'mobile');
            if(mode === 'mobile') frame.classList.add('mobile'); else frame.classList.remove('mobile');
        }
    </script>
</body></html>`);
            win.document.close();
            win.onload = () => {
                const iframe = win.document.getElementById('preview-frame');
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(siteHTML);
                iframe.contentWindow.document.close();
            };
        },

        getBaseCSS() {
            return `
*{box-sizing:border-box;}
body{margin:0;font-family:'DM Sans',sans-serif;background:var(--site-bg);color:var(--site-text);}
.site-header{padding:16px 5%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(128,128,128,0.15);flex-wrap:wrap;gap:12px;}
.site-nav{display:flex;gap:22px;font-weight:500;}
.site-nav a{color:var(--site-text);text-decoration:none;opacity:0.6;transition:0.2s;}
.site-nav a:hover,.site-nav a.active-link{opacity:1;color:var(--site-accent);}
.site-footer{padding:32px 5%;text-align:center;border-top:1px solid rgba(128,128,128,0.15);}
#page-content{display:flex;flex-direction:column;gap:0;}
.b-section{width:100%;}
.b-section.full-bleed{width:100%;}
.b-section-inner{max-width:1200px;margin:0 auto;padding:40px 5%;display:flex;flex-direction:column;gap:20px;}
.b-section.full-bleed .b-section-inner{max-width:100%;}
.b-row{display:grid;gap:20px;width:100%;}
.col-1{grid-template-columns:1fr}.col-2{grid-template-columns:1fr 1fr}.col-3{grid-template-columns:1fr 1fr 1fr}.col-4{grid-template-columns:repeat(4,1fr)}
.b-col{display:flex;flex-direction:column;gap:14px;}
.b-el{max-width:100%;word-break:break-word;margin:0;transition:all 0.2s ease;}
img.b-el{max-width:100%;height:auto;display:block;border-radius:inherit;}
h1.b-el{font-size:3.2rem;font-weight:800;line-height:1.15;letter-spacing:-1px;}
h2.b-el{font-size:2.1rem;font-weight:700;}
h3.b-el{font-size:1.4rem;font-weight:600;}
p.b-el{font-size:1rem;opacity:0.8;line-height:1.7;}
a.b-el.btn{display:inline-block;padding:11px 26px;background:var(--site-accent);color:#fff;text-decoration:none;border-radius:7px;font-weight:600;transition:opacity 0.2s;}
a.b-el.btn:hover{opacity:0.88;}
.b-el.divider{height:1px;background:currentColor;opacity:0.12;border:none;display:block;}
.b-el.spacer{display:block;}
.b-el.form-group{display:flex;flex-direction:column;gap:10px;width:100%;max-width:520px;}
.form-field{display:flex;flex-direction:column;gap:4px;}
.form-label{font-size:0.85rem;font-weight:600;}
.form-input{background:rgba(128,128,128,0.06);color:inherit;border:1px solid rgba(128,128,128,0.25);padding:11px 14px;border-radius:7px;width:100%;font-family:inherit;font-size:0.9rem;}
.form-btn{background:var(--site-accent);color:#fff;padding:12px;border:none;border-radius:7px;font-weight:700;cursor:pointer;width:100%;font-family:inherit;}
.b-el.icon{font-size:2.5rem;display:inline-flex;align-items:center;justify-content:center;color:var(--site-accent);}
.b-el.map iframe{width:100%;height:320px;border:0;border-radius:8px;display:block;}
blockquote.b-el{border-left:4px solid var(--site-accent);padding:12px 20px;margin:0;font-style:italic;background:rgba(128,128,128,0.06);border-radius:0 8px 8px 0;}
.b-el ul,.b-el ol{padding-left:20px;margin:0;line-height:1.8;}
.b-el.video-wrapper{position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;}
.b-el.video-wrapper iframe,.b-el.video-wrapper video{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
@media(max-width:768px){.col-2,.col-3,.col-4{grid-template-columns:1fr!important}.site-header{flex-direction:column;text-align:center}h1.b-el{font-size:2rem}[data-visibility="desktop-only"]{display:none!important}}
@media(min-width:769px){[data-visibility="mobile-only"]{display:none!important}}
[data-visibility="hidden"]{display:none!important}
.nav-dropdown-wrapper{position:relative;display:inline-block;padding-bottom:15px;margin-bottom:-15px;}
.nav-dropdown{display:none;position:absolute;top:100%;left:0;background:var(--site-bg);border:1px solid rgba(128,128,128,0.2);border-radius:6px;padding:8px 0;min-width:160px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.15);flex-direction:column;gap:0;}
.nav-dropdown a{padding:8px 16px!important;width:100%;opacity:0.8;font-size:0.85rem!important;text-align:left;transition:0.2s;}
.nav-dropdown a:hover{background:rgba(128,128,128,0.1);opacity:1;color:var(--site-accent);}
.nav-dropdown-wrapper:hover .nav-dropdown{display:flex;}`;
        },

        async exportSite() {
            this.savePage();
            this.toast('Generating ZIP…', 'info', 3000);
            const zip = new JSZip();
            const assetsFolder = zip.folder('assets');

            for (let id in this.siteData.assets) {
                const asset = this.siteData.assets[id];
                if (asset.base64) assetsFolder.file(asset.name, asset.base64, { base64: true });
            }
            if (this.siteData.favicon) {
                const b64 = this.siteData.favicon.split(',')[1];
                assetsFolder.file('favicon.png', b64, { base64: true });
            }

            const getHoverCSS = (container) => {
                let css = '';
                container.querySelectorAll('[data-hover]').forEach(el => {
                    if (!el.id) return;
                    let hover = {};
                    try { hover = JSON.parse(el.getAttribute('data-hover')); } catch(e) {}
                    const rules = Object.entries(hover).map(([p,v]) => `${p.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}!important`).join(';');
                    if (rules) css += `#${el.id}:hover{${rules};transition:all 0.2s ease;}\n`;
                });
                return css;
            };

            const css = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
:root{--site-bg:${this.siteData.theme.light.bg};--site-text:${this.siteData.theme.light.txt};--site-accent:${this.siteData.theme.accent};}
[data-theme="dark"]{--site-bg:${this.siteData.theme.dark.bg};--site-text:${this.siteData.theme.dark.txt};}
body{margin:0;font-family:'DM Sans',sans-serif;background:var(--site-bg);color:var(--site-text);transition:background 0.3s,color 0.3s;min-height:100vh;display:flex;flex-direction:column;}
${this.getBaseCSS()}
#theme-toggle{position:fixed;bottom:20px;right:20px;background:var(--site-text);color:var(--site-bg);border:none;padding:10px 18px;border-radius:50px;cursor:pointer;font-weight:600;font-family:inherit;box-shadow:0 8px 20px rgba(0,0,0,0.2);z-index:100;font-size:0.85rem;}
${this.siteData.customCSS}`;

            zip.file('style.css', css);

            const allPaths = Object.keys(this.siteData.pages).map(p => this.getPageExportPath(p));

            for (let id in this.siteData.pages) {
                const prefix = this.getRelativePrefix(id);
                const pagePath = this.getPageExportPath(id);

                const pageDiv = document.createElement('div');
                pageDiv.innerHTML = this.siteData.pages[id].html;
                
                const ph = document.getElementById('global-header').cloneNode(true);
                const pf = document.getElementById('global-footer').cloneNode(true);

                [pageDiv, ph, pf].forEach(node => {
                    this.cleanExportDOM(node, prefix);
                    node.querySelectorAll('a').forEach(a => {
                        const href = a.getAttribute('href');
                        if (href && allPaths.includes(href)) {
                            a.setAttribute('href', prefix + href);
                        }
                    });
                });

                ph.querySelectorAll('.site-nav a[data-page-id]').forEach((a) => {
                    const pid = a.getAttribute('data-page-id');
                    a.setAttribute('href', prefix + this.getPageExportPath(pid));
                    a.classList.toggle('active-link', pid === id);
                    a.removeAttribute('data-page-id'); 
                    a.removeAttribute('onclick'); 
                });

                const hoverCSS = getHoverCSS(pageDiv);
                const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.siteData.pages[id].title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<link rel="stylesheet" href="${prefix}style.css">
${this.siteData.favicon ? `<link rel="icon" href="${prefix}assets/favicon.png">` : ''}
${hoverCSS ? `<style>${hoverCSS}</style>` : ''}
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

            try {
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'WebGenius-Site.zip';
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.toast('🎉 Site exported!', 'success');
            } catch(err) {
                this.toast('Export failed: ' + err.message, 'error');
            }
        },

        cleanExportDOM(node, prefix = '') {
            node.querySelectorAll('.active-el').forEach(e => e.classList.remove('active-el'));
            node.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
            node.querySelectorAll('.b-col').forEach(c => {
                if (!c.style.border || c.style.border === 'none') {
                    c.style.border = 'none';
                }
            });
            node.querySelectorAll('[data-asset]').forEach(e => {
                const aid = e.getAttribute('data-asset');
                if (this.siteData.assets[aid]) {
                    const fname = prefix + 'assets/' + this.siteData.assets[aid].name;
                    if (e.tagName === 'IMG') e.src = fname;
                    else if (e.tagName === 'VIDEO') e.src = fname;
                    else if (e.classList.contains('video-wrapper')) {
                        const v = e.querySelector('video');
                        if (v) v.src = fname;
                    }
                }
            });
            node.querySelectorAll('[data-bg-asset]').forEach(e => {
                const aid = e.getAttribute('data-bg-asset');
                if (this.siteData.assets[aid]) {
                    e.style.backgroundImage = `url('${prefix}assets/${this.siteData.assets[aid].name}')`;
                }
            });
        }
    });
}