"use client";

import { useState, useCallback, useEffect } from "react";
import type { BuilderState, BuilderAction } from "../lib/types";
import { toast } from "../lib/reducer";

interface Props {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  getSelectedEl: () => HTMLElement | null;
  onSavePage: () => void;
}

const TABS = ["Layout", "Style", "Hover", "Settings", "Assets", "Layers"];

export function RightSidebar({
  state,
  dispatch,
  getSelectedEl,
  onSavePage,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const sel = getSelectedEl();

  /* ── helpers ── */
  function setStyle(prop: string, val: string) {
    const el = getSelectedEl();
    if (!el) return;
    el.style.setProperty(
      prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
      val
    );
    onSavePage();
  }

  function setAttr(attr: string, val: string) {
    const el = getSelectedEl();
    if (!el) return;
    if (val === "") el.removeAttribute(attr);
    else el.setAttribute(attr, val);
    onSavePage();
  }

  function rgb2hex(rgb: string): string {
    if (!rgb || rgb === "rgba(0, 0, 0, 0)" || rgb === "transparent")
      return "#000000";
    const m = rgb.match(/\d+/g);
    return m
      ? "#" +
          m
            .slice(0, 3)
            .map((x) => parseInt(x).toString(16).padStart(2, "0"))
            .join("")
      : "#000000";
  }

  /* no selection */
  if (!sel) {
    return (
      <div className="wb-sidebar right">
        <div className="wb-empty">
          <span className="empty-icon">🖱️</span>
          <p>
            <strong>Click any element</strong> to edit its properties.
          </p>
          <div className="shortcut">
            <div style={{ marginBottom: 6, fontWeight: 600, fontSize: "0.72rem" }}>
              Keyboard Shortcuts
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--wb-muted)" }}>
              <div><span className="kbd">Del</span> Delete selected</div>
              <div><span className="kbd">Ctrl+Z</span> Undo / <span className="kbd">Ctrl+Y</span> Redo</div>
              <div><span className="kbd">Ctrl+D</span> Duplicate</div>
              <div><span className="kbd">↑ ↓</span> Move element</div>
              <div><span className="kbd">Esc</span> Deselect</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* get computed values */
  const s = window.getComputedStyle(sel);
  const label = sel.getAttribute("data-label") || sel.tagName;
  const tagInfo =
    sel.tagName.toLowerCase() +
    (sel.className
      ? " · " +
        Array.from(sel.classList)
          .filter(
            (c) =>
              !["active-el", "b-el", "b-row", "b-col", "b-section"].includes(c)
          )
          .slice(0, 2)
          .join(" ")
      : "");

  const isSection =
    sel.classList.contains("b-section") ||
    sel.classList.contains("b-row") ||
    sel.classList.contains("b-col");

  return (
    <div className="wb-sidebar right">
      {/* badge */}
      <div className="wb-badge">
        <div className="wb-badge-icon">
          <i className="fas fa-cube" />
        </div>
        <div>
          <div className="wb-badge-label">{label}</div>
          <div className="wb-badge-tag">{tagInfo}</div>
        </div>
      </div>

      {/* tabs */}
      <div className="tabs">
        {TABS.map((t, i) => (
          <div
            key={t}
            className={`tab ${activeTab === i ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {t}
          </div>
        ))}
      </div>

      {/* tab content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* ── LAYOUT TAB ── */}
        {activeTab === 0 && (
          <div className="panel-section">
            <label>Padding</label>
            <div className="grid-4">
              {(["Top", "Right", "Bottom", "Left"] as const).map((side) => {
                const prop = `padding${side}` as keyof CSSStyleDeclaration;
                return (
                  <div key={side}>
                    <input
                      type="number"
                      defaultValue={parseInt(sel.style[prop] as string) || 0}
                      onBlur={(e) =>
                        setStyle(`padding${side}`, e.target.value + "px")
                      }
                    />
                    <span className="input-label">{side}</span>
                  </div>
                );
              })}
            </div>
            <label style={{ marginTop: 9 }}>Margin</label>
            <div className="grid-4">
              {(["Top", "Right", "Bottom", "Left"] as const).map((side) => {
                const prop = `margin${side}` as keyof CSSStyleDeclaration;
                return (
                  <div key={side}>
                    <input
                      type="number"
                      defaultValue={parseInt(sel.style[prop] as string) || 0}
                      onBlur={(e) =>
                        setStyle(`margin${side}`, e.target.value + "px")
                      }
                    />
                    <span className="input-label">{side}</span>
                  </div>
                );
              })}
            </div>
            <hr />
            <label>Sizing</label>
            <div className="grid-2">
              <div>
                <label style={{ marginTop: 0 }}>Width</label>
                <input
                  type="text"
                  defaultValue={sel.style.width || ""}
                  placeholder="auto"
                  onBlur={(e) => setStyle("width", e.target.value)}
                />
              </div>
              <div>
                <label style={{ marginTop: 0 }}>Height</label>
                <input
                  type="text"
                  defaultValue={sel.style.height || ""}
                  placeholder="auto"
                  onBlur={(e) => setStyle("height", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STYLE TAB ── */}
        {activeTab === 1 && (
          <div className="panel-section">
            <div className="info-box">
              Styles apply to the <strong>selected element</strong> only.
            </div>
            <label>Font Family</label>
            <select
              defaultValue={sel.style.fontFamily || "'DM Sans', sans-serif"}
              onChange={(e) => setStyle("fontFamily", e.target.value)}
            >
              <option value="'DM Sans', sans-serif">DM Sans</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="system-ui, sans-serif">System UI</option>
            </select>
            <div className="grid-2" style={{ marginTop: 7 }}>
              <div>
                <label style={{ marginTop: 0 }}>Font Size</label>
                <input
                  type="text"
                  defaultValue={sel.style.fontSize || s.fontSize}
                  placeholder="16px"
                  onBlur={(e) => setStyle("fontSize", e.target.value)}
                />
              </div>
              <div>
                <label style={{ marginTop: 0 }}>Weight</label>
                <select
                  defaultValue={sel.style.fontWeight || s.fontWeight}
                  onChange={(e) => setStyle("fontWeight", e.target.value)}
                >
                  <option value="300">Light 300</option>
                  <option value="400">Normal 400</option>
                  <option value="500">Medium 500</option>
                  <option value="600">Semibold 600</option>
                  <option value="700">Bold 700</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
            </div>
            <label>Text Alignment</label>
            <div className="grid-4">
              {(["left", "center", "right", "justify"] as const).map((a) => (
                <button key={a} onClick={() => setStyle("textAlign", a)}>
                  <i className={`fas fa-align-${a}`} />
                </button>
              ))}
            </div>
            <hr />
            <label>Text & Background Colors</label>
            <div style={{ display: "flex", gap: 5 }}>
              <div className="color-row" style={{ flex: 1 }}>
                <input
                  type="color"
                  defaultValue={rgb2hex(sel.style.color || s.color)}
                  onChange={(e) => setStyle("color", e.target.value)}
                />
                <span>Text</span>
              </div>
              <div className="color-row" style={{ flex: 1 }}>
                <input
                  type="color"
                  defaultValue={rgb2hex(sel.style.backgroundColor)}
                  onChange={(e) =>
                    setStyle("backgroundColor", e.target.value)
                  }
                />
                <span>BG</span>
              </div>
            </div>
            <hr />
            <label>Border Radius</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue={parseInt(sel.style.borderRadius) || 0}
              onInput={(e) =>
                setStyle(
                  "borderRadius",
                  (e.target as HTMLInputElement).value + "px"
                )
              }
            />
            <label>Box Shadow</label>
            <select
              onChange={(e) => setStyle("boxShadow", e.target.value)}
            >
              <option value="none">None</option>
              <option value="0 1px 3px rgba(0,0,0,0.12)">Subtle</option>
              <option value="0 4px 12px rgba(0,0,0,0.15)">Light</option>
              <option value="0 10px 30px rgba(0,0,0,0.25)">Medium</option>
              <option value="0 25px 50px -12px rgba(0,0,0,0.45)">Heavy</option>
            </select>
            <label>Gradient Presets</label>
            <select
              onChange={(e) => {
                if (e.target.value) setStyle("backgroundImage", e.target.value);
              }}
            >
              <option value="">— None —</option>
              <option value="linear-gradient(135deg, #5b6af0, #818cf8)">Indigo</option>
              <option value="linear-gradient(135deg, #ef4444, #f97316)">Sunset</option>
              <option value="linear-gradient(135deg, #10b981, #059669)">Emerald</option>
              <option value="linear-gradient(135deg, #f43f5e, #8b5cf6)">Rose-Purple</option>
              <option value="linear-gradient(135deg, #0f172a, #1e293b)">Dark Slate</option>
            </select>
          </div>
        )}

        {/* ── HOVER TAB ── */}
        {activeTab === 2 && (
          <div className="panel-section">
            <div className="info-box">
              Hover styles. Element auto-gets a unique ID.
            </div>
            <label>Hover Background</label>
            <div className="color-row">
              <input
                type="color"
                onChange={(e) => {
                  const el = getSelectedEl();
                  if (!el) return;
                  if (!el.id) el.id = "el-" + Math.random().toString(36).substring(2, 10);
                  let hover: Record<string, string> = {};
                  try {
                    hover = JSON.parse(el.getAttribute("data-hover") || "{}");
                  } catch {}
                  hover.backgroundColor = e.target.value;
                  el.setAttribute("data-hover", JSON.stringify(hover));
                  onSavePage();
                }}
              />
              <span>Background Color</span>
            </div>
            <label>Hover Text Color</label>
            <div className="color-row">
              <input
                type="color"
                onChange={(e) => {
                  const el = getSelectedEl();
                  if (!el) return;
                  if (!el.id) el.id = "el-" + Math.random().toString(36).substring(2, 10);
                  let hover: Record<string, string> = {};
                  try {
                    hover = JSON.parse(el.getAttribute("data-hover") || "{}");
                  } catch {}
                  hover.color = e.target.value;
                  el.setAttribute("data-hover", JSON.stringify(hover));
                  onSavePage();
                }}
              />
              <span>Text Color</span>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 3 && (
          <div className="panel-section">
            <label>Element ID</label>
            <input
              type="text"
              defaultValue={sel.id || ""}
              placeholder="e.g. hero-section"
              onBlur={(e) => setAttr("id", e.target.value)}
            />
            <label>Custom CSS Classes</label>
            <input
              type="text"
              placeholder="my-class animate"
              onBlur={(e) => {
                const el = getSelectedEl();
                if (!el) return;
                const keep = Array.from(el.classList).filter(
                  (c) =>
                    [
                      "b-el", "b-row", "b-col", "b-section",
                      "full-bleed", "col-1", "col-2", "col-3", "col-4",
                      "active-el", "icon", "btn", "divider", "spacer",
                      "map", "form-group", "video-wrapper",
                    ].includes(c) || c.startsWith("fa")
                );
                el.className = [
                  ...keep,
                  ...e.target.value.split(" ").filter(Boolean),
                ].join(" ");
                onSavePage();
              }}
            />
            <hr />
            <label>Site-Wide Custom CSS</label>
            <textarea
              rows={7}
              defaultValue={state.customCSS}
              placeholder="/* Global CSS */&#10;body { ... }"
              onBlur={(e) =>
                dispatch({ type: "SET_CUSTOM_CSS", css: e.target.value })
              }
            />
          </div>
        )}

        {/* ── ASSETS TAB ── */}
        {activeTab === 4 && (
          <div className="panel-section">
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = "image/*,video/*";
                input.onchange = (e) => {
                  const files = Array.from(
                    (e.target as HTMLInputElement).files || []
                  );
                  files.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const id =
                        "asset_" +
                        Date.now() +
                        "_" +
                        Math.random().toString(36).substring(2, 8);
                      dispatch({
                        type: "ADD_ASSET",
                        id,
                        asset: {
                          name: file.name.replace(/[^a-zA-Z0-9.]/g, "_"),
                          url: ev.target!.result as string,
                          type: file.type,
                          base64: (ev.target!.result as string).split(",")[1],
                        },
                      });
                    };
                    reader.readAsDataURL(file);
                  });
                  toast(dispatch, `${files.length} file(s) uploaded!`, "success");
                };
                input.click();
              }}
            >
              <i className="fas fa-cloud-upload-alt" /> Upload Images / Videos
            </button>
            <p
              style={{
                fontSize: "0.71rem",
                color: "var(--wb-muted)",
                margin: "7px 0 0",
              }}
            >
              Double-click to insert. Assets are embedded in export.
            </p>
            <div className="asset-grid">
              {Object.entries(state.assets).map(([id, asset]) => (
                <div
                  key={id}
                  className="asset-item"
                  title={asset.name}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", `asset:${id}`)
                  }
                >
                  {asset.type.startsWith("image") ? (
                    <img src={asset.url} alt={asset.name} />
                  ) : (
                    <i
                      className="fas fa-film"
                      style={{
                        fontSize: "1.6rem",
                        color: "var(--wb-muted)",
                        margin: "8px 0",
                        display: "block",
                      }}
                    />
                  )}
                  <span>{asset.name}</span>
                </div>
              ))}
            </div>
            {Object.keys(state.assets).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 22,
                  color: "var(--wb-muted)",
                  fontSize: "0.76rem",
                }}
              >
                <i
                  className="fas fa-photo-video"
                  style={{
                    fontSize: "1.8rem",
                    opacity: 0.3,
                    display: "block",
                    marginBottom: 7,
                  }}
                />
                No assets yet.
              </div>
            )}
          </div>
        )}

        {/* ── LAYERS TAB ── */}
        {activeTab === 5 && (
          <div className="panel-section" style={{ padding: 10 }}>
            <LayersTree
              state={state}
              dispatch={dispatch}
              getSelectedEl={getSelectedEl}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Layers Tree sub-component ── */
function LayersTree({
  state,
  dispatch,
  getSelectedEl,
}: {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  getSelectedEl: () => HTMLElement | null;
}) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    /* re-render on selection change */
    forceUpdate((n) => n + 1);
  }, [state.selectedElDataId]);

  const canvas = document.querySelector(".wb-canvas");
  if (!canvas) return <div style={{ color: "var(--wb-muted)", fontSize: "0.76rem" }}>Canvas not loaded</div>;

  function getIcon(el: HTMLElement): string {
    if (el.id === "global-header") return "fa-window-maximize";
    if (el.id === "global-footer") return "fa-window-minimize";
    if (el.classList.contains("b-section")) return "fa-layer-group";
    if (el.classList.contains("b-row")) return "fa-grip-horizontal";
    if (el.classList.contains("b-col")) return "fa-grip-vertical";
    if (el.tagName === "H1") return "fa-heading";
    if (el.tagName === "H2" || el.tagName === "H3") return "fa-h";
    if (el.tagName === "P") return "fa-align-left";
    if (el.tagName === "A") return "fa-hand-pointer";
    if (el.tagName === "IMG") return "fa-image";
    if (el.classList.contains("video-wrapper")) return "fa-video";
    if (el.classList.contains("icon")) return "fa-star";
    if (el.tagName === "HR") return "fa-minus";
    if (el.classList.contains("map")) return "fa-map-marker-alt";
    if (el.classList.contains("form-group")) return "fa-envelope";
    if (el.tagName === "BLOCKQUOTE") return "fa-quote-left";
    if (el.classList.contains("spacer")) return "fa-arrows-alt-v";
    return "fa-cube";
  }

  function buildTree(parent: Element, depth: number): React.ReactNode[] {
    const items: React.ReactNode[] = [];
    Array.from(parent.children).forEach((child) => {
      const el = child as HTMLElement;
      const isTarget =
        el.classList.contains("site-header") ||
        el.classList.contains("site-footer") ||
        el.classList.contains("b-section") ||
        el.classList.contains("b-row") ||
        el.classList.contains("b-col") ||
        el.classList.contains("b-el");
      if (!isTarget) return;
      if (!el.dataset.id) el.dataset.id = "el_" + Math.random().toString(36).substring(2, 10);
      const lbl = el.getAttribute("data-label") || el.tagName.toLowerCase();
      const active = el.dataset.id === state.selectedElDataId;
      items.push(
        <div
          key={el.dataset.id}
          className={`layer-item ${active ? "active" : ""}`}
          style={{ paddingLeft: 10 + depth * 10 }}
          onClick={() =>
            dispatch({ type: "SELECT_ELEMENT", dataId: el.dataset.id! })
          }
        >
          <i className={`fas ${getIcon(el)}`} />
          {lbl}
        </div>
      );
      if (el.children.length && !el.classList.contains("b-el")) {
        items.push(...buildTree(el, depth + 1));
      }
    });
    return items;
  }

  return <>{buildTree(canvas, 0)}</>;
}
