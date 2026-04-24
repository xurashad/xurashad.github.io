"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type {
  BuilderState,
  BuilderAction,
  SectionLayout,
  ElementType,
  ComponentType,
} from "../lib/types";
import { toast } from "../lib/reducer";
import { TEMPLATES } from "../lib/templates";
import { getPageExportPath } from "../lib/reducer";

/* ─── The Canvas renders the visual website inside the builder ───────────── */

export interface CanvasHandle {
  savePage: () => void;
  addSection: (layout: SectionLayout) => void;
  addRow: (layout: SectionLayout) => void;
  addElement: (type: ElementType) => void;
  addSpacer: () => void;
  insertComponent: (type: ComponentType) => void;
  getSelectedEl: () => HTMLElement | null;
  moveEl: (dir: "up" | "down") => void;
  duplicateEl: () => void;
  deleteEl: () => void;
  addColumn: () => void;
  removeColumn: () => void;
  toggleFullBleed: () => void;
  formatText: (cmd: string) => void;
  linkText: () => void;
  headerRef: React.RefObject<HTMLElement | null>;
  footerRef: React.RefObject<HTMLElement | null>;
  mainRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

interface Props {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onToolbarUpdate: (toolbars: {
    rteVisible: boolean;
    rtePos: { top: number; left: number };
    hoverBarVisible: boolean;
    hoverBarPos: { top: number; left: number };
    rowBarVisible: boolean;
    rowBarPos: { top: number; left: number };
  }) => void;
}

export const Canvas = forwardRef<CanvasHandle, Props>(
  function Canvas({ state, dispatch, onToolbarUpdate }, ref) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const footerRef = useRef<HTMLElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const selElRef = useRef<HTMLElement | null>(null);

    /* ── SAVE PAGE: serialize canvas → state ── */
    const savePage = useCallback(() => {
      if (!mainRef.current) return;
      const clone = mainRef.current.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll(".active-el")
        .forEach((e) => e.classList.remove("active-el"));
      dispatch({ type: "SAVE_PAGE_HTML", html: clone.innerHTML });
    }, [dispatch]);

    /* ── LOAD PAGE: restore canvas from state ── */
    useEffect(() => {
      if (!mainRef.current) return;
      const page = state.pages[state.currentPage];
      if (!page) return;
      mainRef.current.innerHTML = page.html;
      selElRef.current = null;
      bindElementEvents();
      updateNav();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.currentPage, state.pages[state.currentPage]?.html]);

    /* ── Apply theme CSS variables to canvas ── */
    useEffect(() => {
      if (!canvasRef.current) return;
      const t = state.theme;
      const mode = state.canvasThemeMode;
      const bg = mode === "dark" ? t.dark.bg : t.light.bg;
      const txt = mode === "dark" ? t.dark.txt : t.light.txt;
      canvasRef.current.style.setProperty("--site-bg", bg);
      canvasRef.current.style.setProperty("--site-text", txt);
      canvasRef.current.style.setProperty("--site-accent", t.accent);
      canvasRef.current.style.background = bg;
      canvasRef.current.style.color = txt;
    }, [state.theme, state.canvasThemeMode]);

    /* ── BIND EVENTS on all builder elements ── */
    function bindElementEvents() {
      if (!canvasRef.current) return;
      const targets = canvasRef.current.querySelectorAll(
        ".b-section, .b-row, .b-col, .b-el, #global-header, #global-footer"
      );
      targets.forEach((el) => {
        const htmlEl = el as HTMLElement;
        /* ensure data-id */
        if (!htmlEl.dataset.id) {
          htmlEl.dataset.id =
            "el_" + Math.random().toString(36).substring(2, 10);
        }
        /* click to select */
        htmlEl.onclick = (e) => {
          e.stopPropagation();
          selectEl(htmlEl);
          if (htmlEl.tagName === "A") e.preventDefault();
        };
        /* contenteditable events */
        if (htmlEl.getAttribute("contenteditable") === "true") {
          htmlEl.onmouseup = () => checkSelection();
          htmlEl.onkeyup = () => checkSelection();
          htmlEl.onblur = () => {
            savePage();
            dispatch({ type: "SAVE_HISTORY" });
          };
        }
      });
    }

    /* ── SELECT element ── */
    function selectEl(el: HTMLElement) {
      if (!el) return;
      /* deselect prev */
      document
        .querySelectorAll(".active-el")
        .forEach((e) => e.classList.remove("active-el"));
      selElRef.current = el;
      el.classList.add("active-el");
      dispatch({ type: "SELECT_ELEMENT", dataId: el.dataset.id ?? null });
      showToolbar(el);
    }

    /* ── DESELECT ── */
    function deselectAll() {
      document
        .querySelectorAll(".active-el")
        .forEach((e) => e.classList.remove("active-el"));
      selElRef.current = null;
      dispatch({ type: "DESELECT" });
      onToolbarUpdate({
        rteVisible: false,
        rtePos: { top: 0, left: 0 },
        hoverBarVisible: false,
        hoverBarPos: { top: 0, left: 0 },
        rowBarVisible: false,
        rowBarPos: { top: 0, left: 0 },
      });
    }

    /* ── SHOW TOOLBAR ── */
    function showToolbar(el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const isStructural =
        el.classList.contains("b-row") ||
        el.classList.contains("b-col") ||
        el.classList.contains("b-section") ||
        el.id === "global-header" ||
        el.id === "global-footer";

      if (isStructural) {
        onToolbarUpdate({
          rteVisible: false,
          rtePos: { top: 0, left: 0 },
          hoverBarVisible: false,
          hoverBarPos: { top: 0, left: 0 },
          rowBarVisible: true,
          rowBarPos: {
            top: Math.max(10, rect.top - 46),
            left: Math.min(window.innerWidth - 420, Math.max(10, rect.left)),
          },
        });
      } else {
        onToolbarUpdate({
          rteVisible: false,
          rtePos: { top: 0, left: 0 },
          hoverBarVisible: true,
          hoverBarPos: {
            top: Math.max(10, rect.top - 46),
            left: Math.min(window.innerWidth - 200, Math.max(10, rect.left)),
          },
          rowBarVisible: false,
          rowBarPos: { top: 0, left: 0 },
        });
      }
    }

    /* ── RTE selection check ── */
    function checkSelection() {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0 && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const sel = selElRef.current;
        const selRect = sel?.getBoundingClientRect();
        const isStructural = sel ? (
          sel.classList.contains("b-row") ||
          sel.classList.contains("b-col") ||
          sel.classList.contains("b-section") ||
          sel.id === "global-header" ||
          sel.id === "global-footer"
        ) : false;
        onToolbarUpdate({
          rteVisible: true,
          rtePos: {
            top: Math.max(10, rect.top - 48),
            left: Math.min(window.innerWidth - 340, Math.max(10, rect.left)),
          },
          hoverBarVisible: !isStructural && !!selRect,
          hoverBarPos: selRect ? {
            top: Math.max(10, selRect.top - 46),
            left: Math.min(window.innerWidth - 200, Math.max(10, selRect.left)),
          } : { top: 0, left: 0 },
          rowBarVisible: isStructural && !!selRect,
          rowBarPos: selRect ? {
            top: Math.max(10, selRect.top - 46),
            left: Math.min(window.innerWidth - 420, Math.max(10, selRect.left)),
          } : { top: 0, left: 0 },
        });
      }
    }

    /* ── UPDATE NAV ── */
    function updateNav() {
      if (!headerRef.current) return;
      const nav = headerRef.current.querySelector(".site-nav");
      if (!nav) return;
      nav.innerHTML = "";
      Object.keys(state.pages).forEach((id) => {
        const page = state.pages[id];
        if (page.hidden) return;
        const a = document.createElement("a");
        a.href = "#";
        a.dataset.pageId = id;
        a.textContent = page.title;
        if (id === state.currentPage) a.classList.add("active-link");
        a.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          savePage();
          dispatch({ type: "LOAD_PAGE", id });
        };
        nav.appendChild(a);
      });
    }

    /* ── HELPERS ── */
    function getTargetColumn(): HTMLElement | null {
      const sel = selElRef.current;
      if (sel) {
        if (sel.classList.contains("b-col")) return sel;
        if (sel.classList.contains("b-row"))
          return sel.querySelector<HTMLElement>(".b-col");
        if (sel.classList.contains("b-section"))
          return sel.querySelector<HTMLElement>(".b-col");
        if (sel.closest(".b-col"))
          return sel.closest<HTMLElement>(".b-col");
      }
      if (!mainRef.current) return null;
      const cols = mainRef.current.querySelectorAll<HTMLElement>(".b-col");
      return cols.length ? cols[cols.length - 1] : null;
    }

    function getParentSection(): HTMLElement | null {
      const sel = selElRef.current;
      if (!sel) return null;
      if (sel.classList.contains("b-section")) return sel;
      return sel.closest<HTMLElement>(".b-section");
    }

    function getParentRow(): HTMLElement | null {
      const sel = selElRef.current;
      if (!sel) return null;
      if (sel.classList.contains("b-row")) return sel;
      return sel.closest<HTMLElement>(".b-row");
    }

    function updateRowColClass(row: HTMLElement) {
      const count = row.querySelectorAll(":scope > .b-col").length;
      row.className = row.className.replace(/col-\d+/, `col-${Math.min(count, 4)}`);
      if (count > 4)
        row.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
    }

    /* ── ADD SECTION ── */
    function addSection(layout: SectionLayout) {
      if (!mainRef.current) return;
      const section = document.createElement("div");
      section.className = "b-section";
      section.setAttribute("data-label", "Section");
      const inner = document.createElement("div");
      inner.className = "b-section-inner";
      const row = document.createElement("div");
      row.className = `b-row ${layout}`;
      row.setAttribute("data-label", "Row");
      const cols = parseInt(layout.split("-")[1]);
      for (let i = 0; i < cols; i++) {
        const col = document.createElement("div");
        col.className = "b-col";
        col.setAttribute("data-label", "Column");
        row.appendChild(col);
      }
      inner.appendChild(row);
      section.appendChild(inner);
      mainRef.current.appendChild(section);
      bindElementEvents();
      selectEl(section);
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, `${cols}-column section added`, "success", 1400);
    }

    /* ── ADD ROW ── */
    function addRow(layout: SectionLayout) {
      const section = getParentSection();
      if (!section) {
        toast(dispatch, "Select a section first to add a row inside it", "warning");
        return;
      }
      const inner = section.querySelector<HTMLElement>(".b-section-inner");
      if (!inner) return;
      const row = document.createElement("div");
      row.className = `b-row ${layout}`;
      row.setAttribute("data-label", "Row");
      const cols = parseInt(layout.split("-")[1]);
      for (let i = 0; i < cols; i++) {
        const col = document.createElement("div");
        col.className = "b-col";
        col.setAttribute("data-label", "Column");
        row.appendChild(col);
      }
      const currRow = getParentRow();
      if (currRow && currRow.parentNode === inner) {
        inner.insertBefore(row, currRow.nextSibling);
      } else {
        inner.appendChild(row);
      }
      bindElementEvents();
      selectEl(row);
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, `${cols}-column row added`, "success", 1200);
    }

    /* ── ADD ELEMENT ── */
    function addElement(type: ElementType) {
      const col = getTargetColumn();
      if (!col) {
        toast(dispatch, "Add a section first, then select it", "warning");
        return;
      }
      let el: HTMLElement;
      switch (type) {
        case "btn":
          el = document.createElement("a");
          el.setAttribute("href", "#");
          el.className = "b-el btn";
          el.textContent = "Click Here";
          el.setAttribute("data-label", "Button");
          break;
        case "img":
          el = document.createElement("img");
          el.className = "b-el";
          (el as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";
          (el as HTMLImageElement).alt = "Image";
          el.style.width = "100%";
          el.style.borderRadius = "8px";
          el.setAttribute("data-label", "Image");
          break;
        case "video": {
          el = document.createElement("div");
          el.className = "b-el video-wrapper";
          el.setAttribute("data-label", "Video");
          el.setAttribute(
            "data-video-url",
            "https://www.youtube.com/embed/dQw4w9WgXcQ"
          );
          el.innerHTML =
            '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>';
          break;
        }
        case "icon":
          el = document.createElement("i");
          el.className = "b-el icon fas fa-star";
          el.setAttribute("data-label", "Icon");
          break;
        case "divider":
          el = document.createElement("hr");
          el.className = "b-el divider";
          el.setAttribute("data-label", "Divider");
          break;
        case "spacer":
          el = document.createElement("div");
          el.className = "b-el spacer";
          el.setAttribute("data-label", "Spacer");
          el.style.height = "50px";
          break;
        case "blockquote":
          el = document.createElement("blockquote");
          el.className = "b-el";
          el.textContent =
            "An inspiring quote that resonates with your audience.";
          el.setAttribute("data-label", "Quote");
          el.setAttribute("contenteditable", "true");
          break;
        case "map":
          el = document.createElement("div");
          el.className = "b-el map";
          el.setAttribute("data-label", "Map");
          el.innerHTML =
            '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.3059445135!2d-74.25986548248684!3d40.69714941932609" allowfullscreen loading="lazy"></iframe>';
          break;
        case "form":
          el = document.createElement("div");
          el.className = "b-el form-group";
          el.setAttribute("data-label", "Form");
          el.innerHTML = `
            <div class="form-field"><label class="form-label" contenteditable="true">Full Name</label><input class="form-input" placeholder="Your name" type="text"></div>
            <div class="form-field"><label class="form-label" contenteditable="true">Email Address</label><input class="form-input" placeholder="your@email.com" type="email"></div>
            <div class="form-field"><label class="form-label" contenteditable="true">Message</label><textarea class="form-input" placeholder="Write your message..." rows="4"></textarea></div>
            <button class="form-btn" contenteditable="true">Send Message →</button>`;
          break;
        case "list":
          el = document.createElement("ul");
          el.className = "b-el";
          el.innerHTML =
            "<li>First item</li><li>Second item</li><li>Third item</li>";
          el.setAttribute("data-label", "List");
          el.setAttribute("contenteditable", "true");
          break;
        case "h3":
          el = document.createElement("h3");
          el.className = "b-el";
          el.textContent = "Sub-heading";
          el.setAttribute("data-label", "H3");
          el.setAttribute("contenteditable", "true");
          break;
        default:
          el = document.createElement(type);
          el.className = "b-el";
          el.setAttribute("contenteditable", "true");
          el.textContent =
            type === "p"
              ? "Write your text here. Click to start editing."
              : type === "h2"
                ? "Section Heading"
                : "Page Heading";
          el.setAttribute("data-label", type.toUpperCase());
      }
      col.appendChild(el);
      bindElementEvents();
      selectEl(el);
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(
        dispatch,
        `${el.getAttribute("data-label")} added`,
        "success",
        1200
      );
    }

    /* ── ADD SPACER ── */
    function addSpacer() {
      addElement("spacer");
    }

    /* ── INSERT COMPONENT ── */
    function insertComponent(type: ComponentType) {
      const html = TEMPLATES[type];
      if (!html || !mainRef.current) return;
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      Array.from(tmp.children).forEach((node) => {
        mainRef.current!.appendChild(node);
      });
      bindElementEvents();
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(
        dispatch,
        `${type.charAt(0).toUpperCase() + type.slice(1)} section added!`,
        "success"
      );
    }

    /* ── MOVE ELEMENT ── */
    function moveEl(direction: "up" | "down") {
      const el = selElRef.current;
      if (!el) return;
      if (el.id === "global-header" || el.id === "global-footer") return;
      const parent = el.parentNode!;
      if (direction === "up" && el.previousElementSibling) {
        parent.insertBefore(el, el.previousElementSibling);
      } else if (direction === "down" && el.nextElementSibling) {
        parent.insertBefore(el.nextElementSibling, el);
      }
      showToolbar(el);
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
    }

    /* ── DUPLICATE ── */
    function duplicateEl() {
      const el = selElRef.current;
      if (!el) {
        toast(dispatch, "Select an element first", "warning");
        return;
      }
      if (el.id === "global-header" || el.id === "global-footer") return;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.remove("active-el");
      clone.removeAttribute("id");
      delete clone.dataset.id;
      el.parentNode!.insertBefore(clone, el.nextSibling);
      bindElementEvents();
      selectEl(clone);
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, "Duplicated!", "success", 1200);
    }

    /* ── DELETE ── */
    function deleteEl() {
      const el = selElRef.current;
      if (!el) return;
      if (el.id === "global-header" || el.id === "global-footer") {
        toast(dispatch, "Cannot delete header or footer", "warning");
        return;
      }
      if (el.classList.contains("b-col")) {
        const row = el.closest(".b-row") as HTMLElement | null;
        el.remove();
        if (row) updateRowColClass(row);
      } else {
        el.remove();
      }
      deselectAll();
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
    }

    /* ── ADD/REMOVE COLUMN ── */
    function addColumn() {
      const row = getParentRow();
      if (!row) {
        toast(dispatch, "Select a row first", "warning");
        return;
      }
      const col = document.createElement("div");
      col.className = "b-col";
      col.setAttribute("data-label", "Column");
      row.appendChild(col);
      updateRowColClass(row);
      bindElementEvents();
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, "Column added", "success", 1200);
    }

    function removeColumn() {
      const row = getParentRow();
      if (!row) {
        toast(dispatch, "Select a row first", "warning");
        return;
      }
      const cols = row.querySelectorAll<HTMLElement>(":scope > .b-col");
      if (cols.length <= 1) {
        toast(dispatch, "Row must have at least 1 column", "warning");
        return;
      }
      const toRemove =
        selElRef.current?.classList.contains("b-col")
          ? selElRef.current
          : cols[cols.length - 1];
      toRemove.remove();
      updateRowColClass(row);
      deselectAll();
      savePage();
      dispatch({ type: "SAVE_HISTORY" });
      toast(dispatch, "Column removed", "info", 1200);
    }

    /* ── FULL BLEED ── */
    function toggleFullBleed() {
      const section = getParentSection();
      if (!section) {
        toast(dispatch, "Select a section first", "warning");
        return;
      }
      const isFull = section.classList.toggle("full-bleed");
      savePage();
      toast(dispatch, isFull ? "Full-width on" : "Full-width off", "info", 1200);
    }

    /* ── RTE FORMAT ── */
    function formatText(cmd: string) {
      document.execCommand(cmd, false);
      savePage();
    }

    function linkText() {
      const url = prompt("Enter link URL:");
      if (url) {
        document.execCommand("createLink", false, url);
        savePage();
        toast(dispatch, "Link inserted", "success", 1200);
      }
    }

    /* ── DRAG & DROP ── */
    function handleDragOver(e: React.DragEvent) {
      e.preventDefault();
      wrapRef.current?.classList.add("drag-over");
    }

    function handleDragLeave(e: React.DragEvent) {
      if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
        wrapRef.current?.classList.remove("drag-over");
      }
    }

    function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      wrapRef.current?.classList.remove("drag-over");
      const data = e.dataTransfer.getData("text/plain");
      if (!data) return;
      if (data.startsWith("component:")) {
        insertComponent(data.split(":")[1] as ComponentType);
      } else if (data.startsWith("asset:")) {
        const assetId = data.split(":")[1];
        const asset = state.assets[assetId];
        if (!asset) return;
        const col = getTargetColumn();
        if (!col) {
          toast(dispatch, "Select a column first!", "warning");
          return;
        }
        let el: HTMLElement;
        if (asset.type.startsWith("image")) {
          el = document.createElement("img");
          (el as HTMLImageElement).src = asset.url;
          el.className = "b-el";
          el.style.width = "100%";
          el.style.borderRadius = "8px";
          el.setAttribute("data-asset", assetId);
          el.setAttribute("data-label", "Image");
        } else if (asset.type.startsWith("video")) {
          el = document.createElement("div");
          el.className = "b-el video-wrapper";
          el.setAttribute("data-asset", assetId);
          el.setAttribute("data-label", "Video");
          el.innerHTML = `<video src="${asset.url}" controls style="position:absolute;top:0;left:0;width:100%;height:100%;"></video>`;
        } else return;
        col.appendChild(el);
        bindElementEvents();
        selectEl(el);
        savePage();
        dispatch({ type: "SAVE_HISTORY" });
        toast(dispatch, "Asset inserted!", "success", 1200);
      }
    }

    /* ── DESELECT on canvas background click ── */
    function handleCanvasBackgroundClick(e: React.MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        target === wrapRef.current ||
        target === canvasRef.current ||
        target.classList.contains("wb-canvas-wrap")
      ) {
        deselectAll();
      }
    }

    /* ── KEYBOARD SHORTCUTS ── */
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
          return;

        const isEditing =
          (e.target as HTMLElement)?.getAttribute?.("contenteditable") ===
          "true";

        if (e.key === "Delete" && !isEditing) {
          e.preventDefault();
          deleteEl();
        } else if (e.key === "Escape") {
          deselectAll();
        } else if (e.ctrlKey && e.key === "z") {
          /* handled by Topbar */
        } else if (e.ctrlKey && e.key === "y") {
          /* handled by Topbar */
        } else if (e.ctrlKey && e.key === "d" && !isEditing) {
          e.preventDefault();
          duplicateEl();
        } else if (e.key === "ArrowUp" && !isEditing) {
          e.preventDefault();
          moveEl("up");
        } else if (e.key === "ArrowDown" && !isEditing) {
          e.preventDefault();
          moveEl("down");
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Expose imperative API ── */
    useImperativeHandle(ref, () => ({
      savePage,
      addSection,
      addRow,
      addElement,
      addSpacer,
      insertComponent,
      getSelectedEl: () => selElRef.current,
      moveEl,
      duplicateEl,
      deleteEl,
      addColumn,
      removeColumn,
      toggleFullBleed,
      formatText,
      linkText,
      headerRef,
      footerRef,
      mainRef,
      canvasRef,
    }));

    /* ── Default header/footer HTML ── */
    const defaultHeaderHTML = `
      <div style="font-weight:700;font-size:1.1rem;letter-spacing:-0.3px;" contenteditable="true">✨ MySite</div>
      <nav class="site-nav" id="site-nav"></nav>
    `;
    const defaultFooterHTML = `
      <p contenteditable="true" style="font-size:0.85rem;opacity:0.6;margin:0;">© ${new Date().getFullYear()} MySite. Built with Website Builder Pro.</p>
    `;

    return (
      <div className="wb-workspace">
        <div
          ref={wrapRef}
          className="wb-canvas-wrap"
          onClick={handleCanvasBackgroundClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div ref={canvasRef} className="wb-canvas">
            <header
              id="global-header"
              className="site-header"
              ref={headerRef as React.RefObject<HTMLElement>}
              dangerouslySetInnerHTML={{ __html: defaultHeaderHTML }}
              onClick={(e) => {
                e.stopPropagation();
                if (headerRef.current) selectEl(headerRef.current);
              }}
            />
            <main
              id="page-content"
              ref={mainRef as React.RefObject<HTMLElement>}
            />
            <footer
              id="global-footer"
              className="site-footer"
              ref={footerRef as React.RefObject<HTMLElement>}
              dangerouslySetInnerHTML={{ __html: defaultFooterHTML }}
              onClick={(e) => {
                e.stopPropagation();
                if (footerRef.current) selectEl(footerRef.current);
              }}
            />
          </div>
        </div>
        <div className="wb-statusbar">
          <span className="wb-status-dot" />
          <span>
            {state.selectedElDataId ? `Selected element` : "No selection"}
          </span>
          <span style={{ marginLeft: "auto" }}>
            {Object.keys(state.pages).length} page
            {Object.keys(state.pages).length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    );
  }
);
