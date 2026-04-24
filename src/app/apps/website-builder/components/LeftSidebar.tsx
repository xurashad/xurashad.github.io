"use client";

import { useState, useCallback } from "react";
import type {
  BuilderState,
  BuilderAction,
  SectionLayout,
  ElementType,
  ComponentType,
} from "../lib/types";
import { toast } from "../lib/reducer";
import { TEMPLATES } from "../lib/templates";

interface Props {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onAddSection: (layout: SectionLayout) => void;
  onAddRow: (layout: SectionLayout) => void;
  onAddElement: (type: ElementType) => void;
  onAddSpacer: () => void;
  onInsertComponent: (type: ComponentType) => void;
  onSavePage: () => void;
}

/* ─── Collapsible panel ─── */
function Panel({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-section">
      <div
        className={`panel-title ${open ? "" : "collapsed"}`}
        onClick={() => setOpen(!open)}
      >
        {title}
      </div>
      <div className={`collapsible-body ${open ? "" : "collapsed"}`}>
        {children}
      </div>
    </div>
  );
}

export function LeftSidebar({
  state,
  dispatch,
  onAddSection,
  onAddRow,
  onAddElement,
  onAddSpacer,
  onInsertComponent,
  onSavePage,
}: Props) {
  /* ── Theme colours ── */
  const [lightBg, setLightBg] = useState(state.theme.light.bg);
  const [lightTxt, setLightTxt] = useState(state.theme.light.txt);
  const [darkBg, setDarkBg] = useState(state.theme.dark.bg);
  const [darkTxt, setDarkTxt] = useState(state.theme.dark.txt);
  const [accent, setAccent] = useState(state.theme.accent);

  function applyTheme() {
    dispatch({
      type: "SET_THEME",
      theme: {
        light: { bg: lightBg, txt: lightTxt },
        dark: { bg: darkBg, txt: darkTxt },
        accent,
      },
    });
    toast(dispatch, "Theme applied!", "success", 1200);
  }

  function toggleDarkMode() {
    dispatch({ type: "TOGGLE_CANVAS_THEME" });
    toast(
      dispatch,
      `Preview: ${state.canvasThemeMode === "light" ? "dark" : "light"} mode`,
      "info",
      1200
    );
  }

  /* ── Pages ── */
  function addPage() {
    const title = prompt("New page title:");
    if (!title?.trim()) return;
    const id = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    if (state.pages[id]) {
      toast(dispatch, "Page already exists!", "error");
      return;
    }
    onSavePage();
    dispatch({
      type: "ADD_PAGE",
      id,
      title: title.trim(),
      html: TEMPLATES.defaultPage.replace("%%TITLE%%", title.trim()),
    });
    dispatch({ type: "SAVE_HISTORY" });
    toast(dispatch, `Page "${title.trim()}" created!`, "success");
  }

  function loadPage(id: string) {
    onSavePage();
    dispatch({ type: "LOAD_PAGE", id });
  }

  function deletePage(id: string) {
    if (id === "index") {
      toast(dispatch, "Cannot delete home page.", "warning");
      return;
    }
    if (confirm(`Delete page "${state.pages[id]?.title}"?`)) {
      dispatch({ type: "DELETE_PAGE", id });
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, "Page deleted", "info");
    }
  }

  /* ── Drag component ── */
  function handleDragStart(
    e: React.DragEvent,
    type: ComponentType
  ) {
    e.dataTransfer.setData("text/plain", `component:${type}`);
  }

  const pageIds = Object.keys(state.pages);

  /* component list */
  const COMPONENTS: { type: ComponentType; icon: string; label: string }[] = [
    { type: "hero", icon: "fa-bolt", label: "Hero Section" },
    { type: "features", icon: "fa-cubes", label: "Features Grid" },
    { type: "testimonial", icon: "fa-comment-dots", label: "Testimonial" },
    { type: "contact", icon: "fa-envelope", label: "Contact Form" },
    { type: "gallery", icon: "fa-images", label: "Image Gallery" },
    { type: "cta", icon: "fa-bullhorn", label: "CTA Banner" },
    { type: "pricing", icon: "fa-tag", label: "Pricing Cards" },
    { type: "stats", icon: "fa-chart-bar", label: "Stats Row" },
    { type: "team", icon: "fa-users", label: "Team Cards" },
    { type: "faq", icon: "fa-question-circle", label: "FAQ Section" },
  ];

  const ELEMENTS: { type: ElementType; icon: string; label: string }[] = [
    { type: "h1", icon: "fa-heading", label: "Heading 1" },
    { type: "h2", icon: "fa-h", label: "Heading 2" },
    { type: "h3", icon: "fa-h", label: "Heading 3" },
    { type: "p", icon: "fa-paragraph", label: "Paragraph" },
    { type: "btn", icon: "fa-hand-pointer", label: "Button" },
    { type: "img", icon: "fa-image", label: "Image" },
    { type: "video", icon: "fa-video", label: "Video/YouTube" },
    { type: "icon", icon: "fa-star", label: "Icon" },
    { type: "list", icon: "fa-list", label: "List" },
    { type: "blockquote", icon: "fa-quote-left", label: "Quote" },
    { type: "map", icon: "fa-map-marker-alt", label: "Map" },
    { type: "form", icon: "fa-envelope", label: "Form" },
  ];

  return (
    <div className="wb-sidebar">
      <div className="wb-sidebar-scroll">
        {/* ── Theme Colors ── */}
        <Panel title="🎨 Theme Colors" defaultOpen={false}>
          <div className="grid-2" style={{ marginBottom: 7 }}>
            <div className="color-row" title="Light BG">
              <input
                type="color"
                value={lightBg}
                onChange={(e) => setLightBg(e.target.value)}
              />
              <span>Light BG</span>
            </div>
            <div className="color-row" title="Light Text">
              <input
                type="color"
                value={lightTxt}
                onChange={(e) => setLightTxt(e.target.value)}
              />
              <span>Light Text</span>
            </div>
            <div className="color-row" title="Dark BG">
              <input
                type="color"
                value={darkBg}
                onChange={(e) => setDarkBg(e.target.value)}
              />
              <span>Dark BG</span>
            </div>
            <div className="color-row" title="Dark Text">
              <input
                type="color"
                value={darkTxt}
                onChange={(e) => setDarkTxt(e.target.value)}
              />
              <span>Dark Text</span>
            </div>
          </div>
          <label>Accent / Brand Color</label>
          <div className="color-row">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              style={{ width: "100%" }}
            />
            <span>{accent}</span>
          </div>
          <div className="grid-2" style={{ marginTop: 8 }}>
            <button className="btn-primary btn-sm" onClick={applyTheme}>
              <i className="fas fa-sync-alt" /> Apply
            </button>
            <button className="btn-sm" onClick={toggleDarkMode}>
              <i className="fas fa-adjust" /> Dark Mode
            </button>
          </div>
        </Panel>

        {/* ── Pages ── */}
        <div className="panel-section">
          <div className="section-header">
            <span className="section-label">📄 Pages</span>
            <button className="btn-sm btn-primary" onClick={addPage}>
              <i className="fas fa-plus" /> Add
            </button>
          </div>
          <div>
            {pageIds.map((id) => {
              const page = state.pages[id];
              const isChild = !!page.parentId;
              return (
                <div
                  key={id}
                  className={`page-item ${id === state.currentPage ? "active" : ""}`}
                  style={{
                    paddingLeft: isChild ? 24 : 10,
                    borderLeft: isChild
                      ? "2px solid var(--wb-border)"
                      : undefined,
                  }}
                  onClick={() => loadPage(id)}
                >
                  <i className="fas fa-file-code" />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: page.hidden
                        ? "line-through"
                        : undefined,
                      opacity: page.hidden ? 0.5 : 1,
                    }}
                  >
                    {page.title}
                  </span>
                  {id !== "index" && (
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <i
                        className={`fas ${page.hidden ? "fa-eye-slash" : "fa-eye"}`}
                        title="Toggle Visibility"
                        style={{
                          opacity: 0.5,
                          cursor: "pointer",
                          fontSize: "0.8em",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({
                            type: "TOGGLE_PAGE_VISIBILITY",
                            id,
                          });
                        }}
                      />
                      <i
                        className={`fas ${isChild ? "fa-outdent" : "fa-indent"}`}
                        title={isChild ? "Unnest" : "Make Subpage"}
                        style={{
                          opacity: 0.5,
                          cursor: "pointer",
                          fontSize: "0.8em",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({
                            type: isChild ? "OUTDENT_PAGE" : "INDENT_PAGE",
                            id,
                          });
                        }}
                      />
                      <i
                        className="fas fa-times"
                        style={{
                          opacity: 0.4,
                          cursor: "pointer",
                          marginLeft: 4,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(id);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Layout Sections & Rows ── */}
        <Panel title="🧱 Layout Sections & Rows">
          <div className="info-box">
            Sections wrap the page. Rows go inside Sections.
          </div>
          <label>Add New Section</label>
          <div className="el-btn-grid" style={{ marginBottom: 8 }}>
            {(["col-1", "col-2", "col-3", "col-4"] as SectionLayout[]).map(
              (layout) => {
                const n = layout.split("-")[1];
                const icons = ["fa-square-full", "fa-columns", "fa-table-columns", "fa-border-all"];
                return (
                  <button
                    key={layout}
                    className="el-btn"
                    onClick={() => onAddSection(layout)}
                  >
                    <i className={`fas ${icons[Number(n) - 1]}`} /> {n} Col
                  </button>
                );
              }
            )}
          </div>
          <label>Add Row (To Selected Section)</label>
          <div className="el-btn-grid" style={{ marginBottom: 8 }}>
            {(["col-1", "col-2", "col-3", "col-4"] as SectionLayout[]).map(
              (layout) => {
                const n = layout.split("-")[1];
                const icons = ["fa-square-full", "fa-columns", "fa-table-columns", "fa-border-all"];
                return (
                  <button
                    key={layout}
                    className="el-btn"
                    onClick={() => onAddRow(layout)}
                  >
                    <i className={`fas ${icons[Number(n) - 1]}`} /> {n} Col Row
                  </button>
                );
              }
            )}
          </div>
          <div className="el-btn-grid">
            <button className="el-btn" onClick={onAddSpacer}>
              <i className="fas fa-arrows-alt-v" /> Spacer
            </button>
            <button
              className="el-btn"
              onClick={() => onAddElement("divider")}
            >
              <i className="fas fa-minus" /> Divider
            </button>
          </div>
        </Panel>

        {/* ── Elements ── */}
        <Panel title="✨ Elements">
          <div className="el-btn-grid">
            {ELEMENTS.map((el) => (
              <button
                key={el.type}
                className="el-btn"
                onClick={() => onAddElement(el.type)}
              >
                <i className={`fas ${el.icon}`} /> {el.label}
              </button>
            ))}
          </div>
        </Panel>

        {/* ── Pre-built Sections ── */}
        <Panel title="📦 Pre-built Sections" defaultOpen={false}>
          {COMPONENTS.map((c) => (
            <div
              key={c.type}
              className="component-item"
              draggable
              onDragStart={(e) => handleDragStart(e, c.type)}
              onClick={() => onInsertComponent(c.type)}
            >
              <i className={`fas ${c.icon}`} /> {c.label}
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
