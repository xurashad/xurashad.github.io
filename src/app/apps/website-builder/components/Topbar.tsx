"use client";

import type { BuilderState, BuilderAction } from "../lib/types";
import { toast } from "../lib/reducer";
import { generatePreviewHTML, exportSiteZip } from "../lib/export";

interface Props {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLElement | null>;
  footerRef: React.RefObject<HTMLElement | null>;
  mainRef: React.RefObject<HTMLElement | null>;
  onSavePage: () => void;
}

export function Topbar({
  state,
  dispatch,
  canvasRef,
  headerRef,
  footerRef,
  mainRef,
  onSavePage,
}: Props) {
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  function handleUndo() {
    if (!canUndo) {
      toast(dispatch, "Nothing to undo", "warning", 1200);
      return;
    }
    dispatch({ type: "UNDO" });
    const prevState = state.history[state.historyIndex - 1];
    if (prevState) {
      dispatch({ type: "RESTORE_HISTORY", pages: prevState.pages });
      toast(dispatch, "Undone", "info", 1200);
    }
  }

  function handleRedo() {
    if (!canRedo) {
      toast(dispatch, "Nothing to redo", "warning", 1200);
      return;
    }
    dispatch({ type: "REDO" });
    const nextState = state.history[state.historyIndex + 1];
    if (nextState) {
      dispatch({ type: "RESTORE_HISTORY", pages: nextState.pages });
      toast(dispatch, "Redone", "info", 1200);
    }
  }

  function handlePreview() {
    onSavePage();
    if (!headerRef.current || !footerRef.current || !mainRef.current) return;
    const html = generatePreviewHTML(
      state,
      headerRef.current.outerHTML,
      footerRef.current.outerHTML,
      mainRef.current.innerHTML
    );

    const win = window.open("", "_blank");
    if (!win) {
      toast(dispatch, "Popup blocked — allow popups for preview", "error");
      return;
    }

    /* Preview shell with desktop/mobile toggle */
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Preview</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
body{margin:0;background:#0c0f1a;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;height:100vh;overflow:hidden;}
.preview-toolbar{height:56px;background:#141824;border-bottom:1px solid #252b3d;display:flex;justify-content:center;align-items:center;gap:12px;flex-shrink:0;position:relative;}
.preview-toolbar button{background:#1a1f30;border:1px solid #2e3650;color:#e8eaf0;padding:8px 16px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;transition:all 0.2s;font-family:inherit;}
.preview-toolbar button:hover{background:#252b3d;}
.preview-toolbar button.active{background:#5b6af0;border-color:#5b6af0;color:white;}
.preview-container{flex:1;display:flex;justify-content:center;align-items:center;padding:32px;overflow:hidden;}
iframe{width:100%;height:100%;background:#fff;border:none;border-radius:8px;box-shadow:0 30px 60px rgba(0,0,0,0.5);transition:all 0.35s cubic-bezier(0.4,0,0.2,1);}
iframe.mobile{width:390px;height:844px;max-height:100%;border:14px solid #1e293b;border-radius:36px;}
.close-btn{position:absolute;right:20px;background:transparent!important;border:none!important;color:#6b7280!important;}
.close-btn:hover{color:#fff!important;}
</style></head>
<body>
<div class="preview-toolbar">
<button id="btn-desktop" class="active" onclick="setMode('desktop')"><i class="fas fa-desktop"></i> Desktop</button>
<button id="btn-mobile" onclick="setMode('mobile')"><i class="fas fa-mobile-alt"></i> Mobile</button>
<button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> Close</button>
</div>
<div class="preview-container"><iframe id="preview-frame"></iframe></div>
<script>
function setMode(m){var f=document.getElementById('preview-frame');document.getElementById('btn-desktop').classList.toggle('active',m==='desktop');document.getElementById('btn-mobile').classList.toggle('active',m==='mobile');if(m==='mobile')f.classList.add('mobile');else f.classList.remove('mobile');}
</script>
</body></html>`);
    win.document.close();
    win.onload = () => {
      const iframe = win.document.getElementById(
        "preview-frame"
      ) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
      }
    };
  }

  async function handleExport() {
    onSavePage();
    if (!headerRef.current || !footerRef.current) return;
    toast(dispatch, "Generating ZIP…", "info", 3000);
    try {
      const blob = await exportSiteZip(
        state,
        headerRef.current,
        footerRef.current
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "WebBuilderPro-Site.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(dispatch, "🎉 Site exported!", "success");
    } catch (err: unknown) {
      toast(
        dispatch,
        "Export failed: " + (err instanceof Error ? err.message : "Unknown"),
        "error"
      );
    }
  }

  function handleDeselect() {
    dispatch({ type: "DESELECT" });
  }

  const pageTitle =
    state.pages[state.currentPage]?.title || state.currentPage;

  return (
    <div className="wb-topbar">
      <div className="wb-topbar-brand">
        <div className="logo-icon">🌐</div>
        <span>Website Builder Pro</span>
        <span className="wb-breadcrumb">{pageTitle}</span>
      </div>

      <div className="wb-topbar-center">
        <button
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          style={{ opacity: canUndo ? 1 : 0.4 }}
        >
          <i className="fas fa-undo" />
        </button>
        <button
          onClick={handleRedo}
          title="Redo (Ctrl+Y)"
          style={{ opacity: canRedo ? 1 : 0.4 }}
        >
          <i className="fas fa-redo" />
        </button>
        <div className="wb-divider-v" />
        <button onClick={handleDeselect} title="Deselect (Esc)">
          <i className="fas fa-mouse-pointer" />
        </button>
      </div>

      <div className="wb-topbar-right">
        <button onClick={handlePreview} title="Preview site">
          <i className="fas fa-eye" /> Preview
        </button>
        <button className="btn-primary" onClick={handleExport}>
          <i className="fas fa-download" /> Export ZIP
        </button>
      </div>
    </div>
  );
}
