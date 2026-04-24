/* ────────────────────────────────────────────────────────────────────────────
   Base CSS used both for the builder canvas and for exported HTML
   ──────────────────────────────────────────────────────────────────────────── */

export function getBaseCSS(): string {
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
}
