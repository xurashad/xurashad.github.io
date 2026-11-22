"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Eye, Folder, Presentation } from "lucide-react";
import "katex/dist/katex.min.css";
import { BottomDrawer } from "./components/BottomDrawer";
import { LeftSidebar } from "./components/LeftSidebar";
import { MarkdownEditor, type MarkdownEditorHandle } from "./components/MarkdownEditor";
import {
  CalloutBadgeModal,
  CommandPaletteModal,
  FrontmatterModal,
  HistoryDiffModal,
  HtmlImportModal,
  MathBuilderModal,
  MermaidBuilderModal,
  SettingsModal,
  ShortcutsGuideModal,
  type StudioCommandAction,
  TableWizardModal,
  TemplatesWorkspacesModal,
} from "./components/Modals";
import { PreviewPane } from "./components/PreviewPane";
import { TopBar } from "./components/TopBar";
import {
  copyRichHtmlToClipboard,
  exportActiveMarkdown,
  exportDocumentJson,
  exportPlainText,
  exportPrintPdf,
  exportStandaloneHtml,
  exportWorkspaceZip,
  importFilesIntoProject,
} from "./lib/exporter";
import { formatMarkdown } from "./lib/formatter";
import { analyzeAndLintMarkdown } from "./lib/linter";
import {
  deleteFileFromHandle,
  ensureFolderPermission,
  importFromWebkitDirectoryFiles,
  isFileSystemAccessSupported,
  loadFolderHandle,
  type MdStudioDirHandle,
  pickLocalFolder,
  pickWritableFolderHandle,
  readFilesFromDirectoryHandle,
  removeFolderHandle,
  saveFolderHandle,
  writeAllProjectFilesToHandle,
  writeProjectFileToHandle,
} from "./lib/localFolder";
import { compileMarkdown } from "./lib/markdownParser";
import {
  appendSnapshot,
  decodeProjectFromHash,
  DEFAULT_SETTINGS,
  encodeProjectToHash,
  loadInitialStudioState,
  loadSettings,
  saveActiveProjectId,
  saveProjects,
  saveSettings,
} from "./lib/persistence";
import { createProjectFromTemplate } from "./lib/templates";
import type {
  EditorSettings,
  LayoutMode,
  MarkdownFile,
  MarkdownProject,
  SaveStatus,
} from "./lib/types";
import { inferFileKind } from "./lib/utils";
import "./markdown-studio.css";

interface UndoEntry {
  past: string[];
  future: string[];
}

export function MarkdownStudio() {
  const [studioInit] = useState(() => {
    const base = loadInitialStudioState();
    if (typeof window === "undefined") return base;
    const params = new URLSearchParams(window.location.search);
    const reqProjId = params.get("project");
    if (reqProjId && base.projects.some((p) => p.id === reqProjId)) {
      return { projects: base.projects, activeProjectId: reqProjId };
    }
    const reqTpl = params.get("template");
    if (reqTpl) {
      const created = createProjectFromTemplate(reqTpl);
      return {
        projects: [created, ...base.projects],
        activeProjectId: created.id,
      };
    }
    return base;
  });

  const [projects, setProjects] = useState<MarkdownProject[]>(studioInit.projects);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    studioInit.activeProjectId,
  );
  const [settings, setSettings] = useState<EditorSettings>(() => loadSettings());

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const [activeFilePath, setActiveFilePath] = useState<string>(
    () => activeProject?.mainFilePath ?? "README.md",
  );
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const main = activeProject?.mainFilePath ?? "README.md";
    const others = activeProject.files
      .map((f) => f.path)
      .filter((p) => p !== main)
      .slice(0, 3);
    return [main, ...others];
  });

  const activeFile = useMemo(
    () =>
      activeProject.files.find((f) => f.path === activeFilePath) ??
      activeProject.files.find((f) => f.path === activeProject.mainFilePath) ??
      activeProject.files[0],
    [activeProject, activeFilePath],
  );

  // UI Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"files" | "outline" | "blocks" | "emoji">("files");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
  const [mobilePane, setMobilePane] = useState<"files" | "editor" | "preview">("editor");
  const [splitPct, setSplitPct] = useState(50);
  const [zenMode, setZenMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"problems" | "analytics" | "html">("problems");
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // Scroll sync ratio state
  const [previewTargetRatio, setPreviewTargetRatio] = useState<number | null>(null);

  // Modals
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tableWizardOpen, setTableWizardOpen] = useState(false);
  const [mermaidOpen, setMermaidOpen] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const [frontmatterOpen, setFrontmatterOpen] = useState(false);
  const [calloutOpen, setCalloutOpen] = useState(false);
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Persistence & Local disk
  const [fsAccessSupported] = useState<boolean>(() => isFileSystemAccessSupported());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [unsavedPaths, setUnsavedPaths] = useState<Set<string>>(() => new Set());
  const [connectedFolderProjectIds, setConnectedFolderProjectIds] = useState<Record<string, boolean>>({});
  const [reconnectableProjectIds, setReconnectableProjectIds] = useState<Record<string, boolean>>({});

  const [undoStacks, setUndoStacks] = useState<Record<string, UndoEntry>>({});
  const [toast, setToast] = useState<string | null>(null);

  const editorRef = useRef<MarkdownEditorHandle>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const globalUploadRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderHandlesRef = useRef<Map<string, MdStudioDirHandle>>(new Map());
  const dirtyPathsRef = useRef<Set<string>>(new Set());
  const hasMountedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // Compile & Lint current Markdown file cleanly via useMemo
  const renderResult = useMemo(() => {
    const src =
      activeFile.kind === "md"
        ? activeFile.content
        : `\`\`\`${activeFile.kind}\n${activeFile.content}\n\`\`\``;
    return compileMarkdown(src, {
      files: activeProject.files,
      gfmBreaks: settings.gfmBreaks,
      autoNumberHeadings: settings.autoNumberHeadings,
      enableEmoji: settings.enableEmoji,
      enableMath: settings.enableMath,
      enableMermaid: settings.enableMermaid,
      enableHtml: settings.enableHtml,
    });
  }, [
    activeFile.content,
    activeFile.kind,
    activeProject.files,
    settings.gfmBreaks,
    settings.autoNumberHeadings,
    settings.enableEmoji,
    settings.enableMath,
    settings.enableMermaid,
    settings.enableHtml,
  ]);

  const { diagnostics, analytics } = useMemo(() => {
    if (activeFile.kind !== "md") {
      return analyzeAndLintMarkdown("", renderResult, activeProject.files);
    }
    return analyzeAndLintMarkdown(
      activeFile.content,
      renderResult,
      activeProject.files,
    );
  }, [activeFile.content, activeFile.kind, renderResult, activeProject.files]);

  // Viewport lock + strip transient query params
  useEffect(() => {
    document.documentElement.classList.add("md-editor-active");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.hash}`,
      );
    }
    return () => {
      document.documentElement.classList.remove("md-editor-active");
    };
  }, []);

  // Decode shared #md= or #mdz= URL hash on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#md=") && !hash.startsWith("#mdz=")) return;
    decodeProjectFromHash(hash).then((sharedProj) => {
      if (!sharedProj) return;
      setProjects((prev) => [sharedProj, ...prev]);
      setActiveProjectId(sharedProj.id);
      setActiveFilePath(sharedProj.mainFilePath);
      setOpenTabs([sharedProj.mainFilePath]);
      window.history.replaceState(null, "", window.location.pathname);
      showToast(`Imported shared workspace "${sharedProj.name}"`);
    });
  }, [showToast]);

  // Check IndexedDB handles for local folder reconnect
  useEffect(() => {
    if (!fsAccessSupported) return;
    let cancelled = false;
    Promise.all(
      projects
        .filter((p) => p.storageMode === "local-folder")
        .map(async (p) => {
          const handle = await loadFolderHandle(p.id);
          return { id: p.id, handle };
        }),
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, boolean> = {};
      for (const e of entries) {
        if (e.handle) next[e.id] = true;
      }
      setReconnectableProjectIds(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fsAccessSupported, projects]);

  // Persist active project ID & settings
  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Debounced autosave
  const persistNow = useCallback(async () => {
    setSaveStatus("saving");
    const savedLocal = saveProjects(projects);
    const handle = folderHandlesRef.current.get(activeProject.id);
    if (handle && dirtyPathsRef.current.size > 0) {
      const granted = await ensureFolderPermission(handle, false);
      if (granted) {
        for (const dirtyPath of Array.from(dirtyPathsRef.current)) {
          const target = activeProject.files.find((f) => f.path === dirtyPath);
          if (target) {
            await writeProjectFileToHandle(handle, target);
          }
        }
        dirtyPathsRef.current.clear();
      }
    }
    setUnsavedPaths(new Set());
    setLastSavedAt(Date.now());
    setSaveStatus(savedLocal ? "saved" : "error");
  }, [projects, activeProject]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!settings.autoSave) return;
    const t = setTimeout(() => {
      void persistNow();
    }, settings.autoSaveDelayMs);
    return () => clearTimeout(t);
  }, [projects, settings.autoSave, settings.autoSaveDelayMs, persistNow]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const updateProject = useCallback(
    (updater: (proj: MarkdownProject) => MarkdownProject) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? updater(p) : p)),
      );
      setSaveStatus("unsaved");
    },
    [activeProject.id],
  );

  const selectFile = useCallback((path: string) => {
    setActiveFilePath(path);
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setMobilePane("editor");
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.indexOf(path);
        const nextTabs = prev.filter((p) => p !== path);
        if (activeFilePath === path) {
          setActiveFilePath(nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0]);
        }
        return nextTabs;
      });
    },
    [activeFilePath],
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      const targetPath = activeFile.path;
      const oldContent = activeFile.content;
      if (newContent === oldContent) return;

      setUndoStacks((prev) => {
        const cur = prev[targetPath] ?? { past: [], future: [] };
        return {
          ...prev,
          [targetPath]: {
            past: [...cur.past.slice(-60), oldContent],
            future: [],
          },
        };
      });

      dirtyPathsRef.current.add(targetPath);
      setUnsavedPaths((prev) => {
        const next = new Set(prev);
        next.add(targetPath);
        return next;
      });

      const now = Date.now();
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        files: proj.files.map((f) =>
          f.path === targetPath ? { ...f, content: newContent, updatedAt: now } : f,
        ),
      }));
    },
    [activeFile.path, activeFile.content, updateProject],
  );

  const handleUndo = useCallback(() => {
    const stack = undoStacks[activeFile.path];
    if (!stack || stack.past.length === 0) return;
    const prevVal = stack.past[stack.past.length - 1];
    setUndoStacks((prev) => ({
      ...prev,
      [activeFile.path]: {
        past: stack.past.slice(0, -1),
        future: [activeFile.content, ...stack.future],
      },
    }));
    const now = Date.now();
    updateProject((proj) => ({
      ...proj,
      updatedAt: now,
      files: proj.files.map((f) =>
        f.path === activeFile.path ? { ...f, content: prevVal, updatedAt: now } : f,
      ),
    }));
  }, [undoStacks, activeFile.path, activeFile.content, updateProject]);

  const handleRedo = useCallback(() => {
    const stack = undoStacks[activeFile.path];
    if (!stack || stack.future.length === 0) return;
    const nextVal = stack.future[0];
    setUndoStacks((prev) => ({
      ...prev,
      [activeFile.path]: {
        past: [...stack.past, activeFile.content],
        future: stack.future.slice(1),
      },
    }));
    const now = Date.now();
    updateProject((proj) => ({
      ...proj,
      updatedAt: now,
      files: proj.files.map((f) =>
        f.path === activeFile.path ? { ...f, content: nextVal, updatedAt: now } : f,
      ),
    }));
  }, [undoStacks, activeFile.path, activeFile.content, updateProject]);

  const handleFormat = useCallback(() => {
    if (activeFile.kind !== "md") {
      showToast("Formatter applies to Markdown (.md) files");
      return;
    }
    const formatted = formatMarkdown(activeFile.content);
    if (formatted !== activeFile.content) {
      handleContentChange(formatted);
      showToast("Formatted Markdown & aligned tables");
    } else {
      showToast("Document already cleanly formatted");
    }
  }, [activeFile.kind, activeFile.content, handleContentChange, showToast]);

  const handleToggleTaskLine = useCallback(
    (lineNum: number) => {
      const lines = activeFile.content.split("\n");
      const idx = lineNum - 1;
      if (idx < 0 || idx >= lines.length) return;
      const line = lines[idx];
      const nextLine = line.replace(
        /^(\s*[-*+]\s+\[)([ xX])(\]\s+.*)$/,
        (_m, pre: string, state: string, post: string) =>
          `${pre}${state === " " ? "x" : " "}${post}`,
      );
      if (nextLine !== line) {
        lines[idx] = nextLine;
        handleContentChange(lines.join("\n"));
      }
    },
    [activeFile.content, handleContentChange],
  );

  const handleOpenWikiTarget = useCallback(
    (target: string) => {
      const norm = target.trim().toLowerCase().replace(/\.md$/, "");
      const found = activeProject.files.find((f) => {
        const p = f.path.toLowerCase();
        const noExt = p.replace(/\.(md|markdown|mdx)$/, "");
        const base = noExt.split("/").pop() ?? noExt;
        return p === norm || noExt === norm || base === norm;
      });
      if (found) {
        selectFile(found.path);
        return;
      }
      const cleanPath = target.trim().endsWith(".md")
        ? target.trim()
        : `${target.trim()}.md`;
      const now = Date.now();
      const title = cleanPath.split("/").pop()?.replace(/\.md$/i, "") ?? "Note";
      const created: MarkdownFile = {
        id: `md-wiki-${now}`,
        path: cleanPath,
        kind: "md",
        content: `# ${title}\n\nLinked from [[${activeFile.path.replace(/\.md$/i, "")}]].\n`,
        updatedAt: now,
      };
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        files: [...proj.files, created],
      }));
      selectFile(cleanPath);
      showToast(`Created linked page "${cleanPath}"`);
    },
    [activeProject.files, activeFile.path, selectFile, updateProject, showToast],
  );

  const handleCreateFile = useCallback(
    (rawPath: string) => {
      const path = rawPath.trim().replace(/^\/+/, "");
      if (!path) return;
      if (activeProject.files.some((f) => f.path.toLowerCase() === path.toLowerCase())) {
        selectFile(path);
        return;
      }
      const now = Date.now();
      const kind = inferFileKind(path);
      const baseTitle = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled";
      const newFile: MarkdownFile = {
        id: `md-file-${now}-${Math.random().toString(36).slice(2, 5)}`,
        path,
        kind,
        content: kind === "md" ? `# ${baseTitle}\n\n` : "",
        updatedAt: now,
      };
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        files: [...proj.files, newFile],
      }));
      selectFile(path);
    },
    [activeProject.files, selectFile, updateProject],
  );

  const handleRenameFile = useCallback(
    (oldPath: string, newPath: string) => {
      if (
        !newPath ||
        newPath === oldPath ||
        activeProject.files.some((f) => f.path === newPath)
      ) {
        return;
      }
      const now = Date.now();
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        mainFilePath: proj.mainFilePath === oldPath ? newPath : proj.mainFilePath,
        files: proj.files.map((f) =>
          f.path === oldPath
            ? { ...f, path: newPath, kind: inferFileKind(newPath), updatedAt: now }
            : f,
        ),
      }));
      setOpenTabs((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
      if (activeFilePath === oldPath) setActiveFilePath(newPath);
    },
    [activeProject.files, activeFilePath, updateProject],
  );

  const handleDuplicateFile = useCallback(
    (path: string) => {
      const src = activeProject.files.find((f) => f.path === path);
      if (!src) return;
      const dot = path.lastIndexOf(".");
      const copyPath =
        dot !== -1
          ? `${path.slice(0, dot)}-copy${path.slice(dot)}`
          : `${path}-copy`;
      const now = Date.now();
      const copy: MarkdownFile = {
        ...src,
        id: `md-copy-${now}`,
        path: copyPath,
        updatedAt: now,
      };
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        files: [...proj.files, copy],
      }));
      selectFile(copyPath);
    },
    [activeProject.files, selectFile, updateProject],
  );

  const handleDeleteFile = useCallback(
    async (path: string) => {
      if (activeProject.files.length <= 1) return;
      const handle = folderHandlesRef.current.get(activeProject.id);
      if (handle) {
        await deleteFileFromHandle(handle, path);
      }
      const remaining = activeProject.files.filter((f) => f.path !== path);
      const fallback = remaining[0].path;
      updateProject((proj) => ({
        ...proj,
        updatedAt: Date.now(),
        mainFilePath: proj.mainFilePath === path ? fallback : proj.mainFilePath,
        files: remaining,
      }));
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p !== path);
        return next.length > 0 ? next : [fallback];
      });
      if (activeFilePath === path) setActiveFilePath(fallback);
    },
    [activeProject.files, activeProject.id, activeFilePath, updateProject],
  );

  const handleUploadFiles = useCallback(
    async (fileList: FileList) => {
      const imported = await importFilesIntoProject(fileList);
      if (imported.length === 0) return;
      const now = Date.now();
      updateProject((proj) => {
        const existingMap = new Map(proj.files.map((f) => [f.path, f]));
        for (const f of imported) {
          existingMap.set(f.path, f);
        }
        return {
          ...proj,
          updatedAt: now,
          files: Array.from(existingMap.values()),
        };
      });
      const firstDoc = imported.find((f) => f.kind === "md") ?? imported[0];
      if (firstDoc) selectFile(firstDoc.path);
      showToast(`Imported ${imported.length} file(s) into workspace`);
    },
    [selectFile, showToast, updateProject],
  );

  const handlePasteImage = useCallback(
    (filename: string, dataUrl: string): string => {
      const assetPath = `assets/${filename}`;
      const now = Date.now();
      const imgFile: MarkdownFile = {
        id: `md-img-${now}`,
        path: assetPath,
        kind: "image",
        content: dataUrl,
        updatedAt: now,
      };
      dirtyPathsRef.current.add(assetPath);
      updateProject((proj) => ({
        ...proj,
        updatedAt: now,
        files: [...proj.files, imgFile],
      }));
      showToast(`Saved pasted image to ${assetPath}`);
      return assetPath;
    },
    [showToast, updateProject],
  );

  // Local Folder handlers
  const handleOpenLocalFolder = useCallback(async () => {
    try {
      const picked = await pickLocalFolder();
      if (!picked || picked.files.length === 0) {
        if (picked) showToast("Selected folder has no supported Markdown/text/image files.");
        return;
      }
      const now = Date.now();
      const proj: MarkdownProject = {
        id: `md-disk-${now}`,
        name: picked.name,
        templateId: "local-folder",
        mainFilePath: picked.mainFilePath,
        files: picked.files,
        snapshots: [],
        createdAt: now,
        updatedAt: now,
        localFolderName: picked.name,
        storageMode: "local-folder",
      };
      folderHandlesRef.current.set(proj.id, picked.handle);
      await saveFolderHandle(proj.id, picked.handle);
      setConnectedFolderProjectIds((prev) => ({ ...prev, [proj.id]: true }));
      setProjects((prev) => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setActiveFilePath(proj.mainFilePath);
      setOpenTabs([proj.mainFilePath]);
      showToast(`Opened local folder "${picked.name}" (${picked.files.length} files)`);
    } catch {
      showToast("Unable to open local folder.");
    }
  }, [showToast]);

  const handleFallbackDirectoryFiles = useCallback(
    async (fileList: FileList) => {
      const imported = await importFromWebkitDirectoryFiles(fileList);
      if (imported.files.length === 0) {
        showToast("No Markdown/text/image files found in directory.");
        return;
      }
      const now = Date.now();
      const proj: MarkdownProject = {
        id: `md-dir-${now}`,
        name: imported.folderName,
        templateId: "local-folder",
        mainFilePath: imported.mainFilePath,
        files: imported.files,
        snapshots: [],
        createdAt: now,
        updatedAt: now,
        localFolderName: imported.folderName,
        storageMode: "browser",
      };
      setProjects((prev) => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setActiveFilePath(proj.mainFilePath);
      setOpenTabs([proj.mainFilePath]);
      showToast(`Imported folder "${imported.folderName}"`);
    },
    [showToast],
  );

  const handleBindSaveToLocalFolder = useCallback(async () => {
    try {
      const handle = await pickWritableFolderHandle();
      if (!handle) return;
      folderHandlesRef.current.set(activeProject.id, handle);
      await saveFolderHandle(activeProject.id, handle);
      const { written } = await writeAllProjectFilesToHandle(handle, activeProject.files);
      setConnectedFolderProjectIds((prev) => ({ ...prev, [activeProject.id]: true }));
      updateProject((proj) => ({
        ...proj,
        localFolderName: handle.name,
        storageMode: "local-folder",
      }));
      showToast(`Synced ${written} files to "${handle.name}"`);
    } catch {
      showToast("Failed binding workspace to folder.");
    }
  }, [activeProject.files, activeProject.id, showToast, updateProject]);

  const handleReconnectLocalFolder = useCallback(async () => {
    const handle = await loadFolderHandle(activeProject.id);
    if (!handle) return;
    const ok = await ensureFolderPermission(handle, true);
    if (!ok) {
      showToast("Permission denied for local folder.");
      return;
    }
    folderHandlesRef.current.set(activeProject.id, handle);
    setConnectedFolderProjectIds((prev) => ({ ...prev, [activeProject.id]: true }));
    showToast(`Reconnected "${handle.name}"`);
  }, [activeProject.id, showToast]);

  const handleReloadFromLocalFolder = useCallback(async () => {
    const handle = folderHandlesRef.current.get(activeProject.id);
    if (!handle) return;
    const ok = await ensureFolderPermission(handle, true);
    if (!ok) return;
    const { files, mainFilePath } = await readFilesFromDirectoryHandle(handle);
    if (files.length === 0) return;
    updateProject((proj) => ({
      ...proj,
      files,
      mainFilePath,
      updatedAt: Date.now(),
    }));
    setActiveFilePath(mainFilePath);
    setOpenTabs([mainFilePath]);
    showToast(`Reloaded ${files.length} files from disk`);
  }, [activeProject.id, showToast, updateProject]);

  const handleDisconnectLocalFolder = useCallback(async () => {
    folderHandlesRef.current.delete(activeProject.id);
    await removeFolderHandle(activeProject.id);
    setConnectedFolderProjectIds((prev) => ({ ...prev, [activeProject.id]: false }));
    setReconnectableProjectIds((prev) => ({ ...prev, [activeProject.id]: false }));
    updateProject((proj) => ({ ...proj, storageMode: "browser" }));
    showToast("Disconnected local folder sync");
  }, [activeProject.id, showToast, updateProject]);

  // Global Studio keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape" && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zenMode]);

  // Drag-resizable split divider
  const startResizeSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;
    const onMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(25, Math.min(75, Math.round(pct))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleApplyFrontmatter = (fmBlock: string, replaceExisting: boolean) => {
    if (replaceExisting && renderResult.frontmatter) {
      const lines = activeFile.content.split("\n");
      const rest = lines.slice(renderResult.frontmatter.endLine).join("\n").replace(/^\n+/, "");
      handleContentChange(`${fmBlock}${rest}`);
    } else {
      handleContentChange(`${fmBlock}${activeFile.content}`);
    }
    showToast("Updated document frontmatter");
  };

  const commandActions: StudioCommandAction[] = useMemo(
    () => [
      {
        id: "cmd-save",
        label: "Save Workspace Now",
        group: "File",
        shortcut: "Ctrl+S",
        run: () => void persistNow(),
      },
      {
        id: "cmd-format",
        label: "Prettify Markdown & Align Tables",
        group: "Edit",
        shortcut: "Alt+Shift+F",
        run: handleFormat,
      },
      {
        id: "cmd-find",
        label: "Find & Replace",
        group: "Edit",
        shortcut: "Ctrl+F",
        run: () => editorRef.current?.openFind(),
      },
      {
        id: "cmd-table",
        label: "Open Visual Table Builder",
        group: "Wizard",
        run: () => setTableWizardOpen(true),
      },
      {
        id: "cmd-mermaid",
        label: "Open Mermaid & Chart Studio",
        group: "Wizard",
        run: () => setMermaidOpen(true),
      },
      {
        id: "cmd-math",
        label: "Open KaTeX Equation Builder",
        group: "Wizard",
        run: () => setMathOpen(true),
      },
      {
        id: "cmd-fm",
        label: "Edit YAML/TOML Frontmatter",
        group: "Wizard",
        run: () => setFrontmatterOpen(true),
      },
      {
        id: "cmd-callout",
        label: "Open Callout & Badge Builder",
        group: "Wizard",
        run: () => setCalloutOpen(true),
      },
      {
        id: "cmd-html-imp",
        label: "Convert HTML to Markdown",
        group: "Import",
        run: () => setHtmlImportOpen(true),
      },
      {
        id: "cmd-templates",
        label: "Templates & Workspaces",
        group: "Workspace",
        run: () => setTemplatesOpen(true),
      },
      {
        id: "cmd-history",
        label: "Version History & Visual Diff",
        group: "Workspace",
        run: () => setHistoryOpen(true),
      },
      {
        id: "cmd-mode-split",
        label: "Switch to Split View",
        group: "View",
        run: () => setLayoutMode("split"),
      },
      {
        id: "cmd-mode-slides",
        label: "Switch to Slide Presentation Mode",
        group: "View",
        run: () => setLayoutMode("slides"),
      },
      {
        id: "cmd-zen",
        label: zenMode ? "Exit Zen Mode" : "Enter Zen Focus Mode",
        group: "View",
        run: () => setZenMode((v) => !v),
      },
      {
        id: "cmd-export-pdf",
        label: "Export / Print Vector PDF",
        group: "Export",
        run: () =>
          exportPrintPdf(renderResult, activeProject.name, {
            pageSize: settings.pageSize,
            slideMode: layoutMode === "slides",
          }),
      },
      {
        id: "cmd-export-html",
        label: "Export Standalone Styled HTML",
        group: "Export",
        run: () =>
          exportStandaloneHtml(
            renderResult,
            activeProject.name,
            settings.previewTheme,
            layoutMode === "slides",
          ),
      },
      {
        id: "cmd-export-zip",
        label: "Download Workspace ZIP Archive",
        group: "Export",
        run: () => void exportWorkspaceZip(activeProject),
      },
      {
        id: "cmd-settings",
        label: "Open Studio Settings",
        group: "Settings",
        run: () => setSettingsOpen(true),
      },
      {
        id: "cmd-shortcuts",
        label: "Keyboard Shortcuts & Syntax Guide",
        group: "Help",
        run: () => setShortcutsOpen(true),
      },
    ],
    [
      persistNow,
      handleFormat,
      zenMode,
      renderResult,
      activeProject,
      settings.pageSize,
      settings.previewTheme,
      layoutMode,
    ],
  );

  const curUndo = undoStacks[activeFile.path];
  const canUndo = Boolean(curUndo && curUndo.past.length > 0);
  const canRedo = Boolean(curUndo && curUndo.future.length > 0);
  const isFolderConnected = Boolean(connectedFolderProjectIds[activeProject.id]);

  return (
    <div
      className={`md-root ${isFullscreen ? "md-fullscreen-active" : ""}`}
    >
      {/* Hidden global file input for Workspace -> Import Files */}
      <input
        ref={globalUploadRef}
        type="file"
        multiple
        accept=".md,.markdown,.mdx,.txt,.html,.htm,.json,.yaml,.yml,.css,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleUploadFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {!zenMode && (
        <TopBar
          projectName={activeProject.name}
          onRenameProject={(name) =>
            updateProject((p) => ({ ...p, name, updatedAt: Date.now() }))
          }
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          layoutMode={layoutMode}
          onChangeLayout={setLayoutMode}
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode((v) => !v)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onFormat={handleFormat}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenTableWizard={() => setTableWizardOpen(true)}
          onOpenMermaidBuilder={() => setMermaidOpen(true)}
          onOpenMathBuilder={() => setMathOpen(true)}
          onOpenFrontmatter={() => setFrontmatterOpen(true)}
          onOpenCalloutBadge={() => setCalloutOpen(true)}
          onOpenHtmlImport={() => setHtmlImportOpen(true)}
          onInsertSnippet={(s, offset) => editorRef.current?.insertSnippet(s, offset)}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onDownloadMarkdown={() => exportActiveMarkdown(activeFile)}
          onExportHtml={() =>
            exportStandaloneHtml(
              renderResult,
              activeProject.name,
              settings.previewTheme,
              layoutMode === "slides",
            )
          }
          onPrintPdf={() =>
            exportPrintPdf(renderResult, activeProject.name, {
              pageSize: settings.pageSize,
              slideMode: layoutMode === "slides",
            })
          }
          onExportZip={() => void exportWorkspaceZip(activeProject)}
          onExportPlainText={() =>
            exportPlainText(activeFile.content, activeProject.name)
          }
          onExportJson={() =>
            exportDocumentJson(activeFile, renderResult, analytics)
          }
          onCopyRichHtml={() => {
            void copyRichHtmlToClipboard(renderResult.html, activeFile.content).then(
              (ok) => showToast(ok ? "Copied rich HTML to clipboard" : "Copy failed"),
            );
          }}
          onCopyMarkdown={() => {
            navigator.clipboard?.writeText(activeFile.content).then(
              () => showToast("Copied raw Markdown"),
              () => showToast("Copy failed"),
            );
          }}
          onShareUrl={() => {
            void encodeProjectToHash(activeProject).then((hash) => {
              const url = `${window.location.origin}/apps/markdown-studio/editor${hash}`;
              navigator.clipboard?.writeText(url).then(
                () => showToast("Copied compressed share link!"),
                () => showToast("Failed copying share URL"),
              );
            });
          }}
          onTriggerUpload={() => globalUploadRef.current?.click()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onSaveNow={() => void persistNow()}
          localFolderName={activeProject.localFolderName}
          localFolderConnected={isFolderConnected}
          onOpenLocalFolder={() => void handleOpenLocalFolder()}
          onBindSaveToLocalFolder={() => void handleBindSaveToLocalFolder()}
          onReloadFromLocalFolder={() => void handleReloadFromLocalFolder()}
          onDisconnectLocalFolder={() => void handleDisconnectLocalFolder()}
        />
      )}

      {/* Zen Mode Floating Exit Pill */}
      {zenMode && (
        <button
          type="button"
          onClick={() => setZenMode(false)}
          className="fixed top-3 right-4 z-50 px-3 py-1.5 rounded-full border border-cyan-400/40 bg-[#0b0d1f]/90 text-xs font-mono text-cyan-200 hover:bg-violet-500/25 shadow-lg cursor-pointer"
        >
          Exit Zen (Esc)
        </button>
      )}

      {/* Mobile Pane Switcher */}
      {!zenMode && (
        <div className="md:hidden grid grid-cols-4 border-b border-slate-800 bg-[#0a0c1c] text-xs">
          {(
            [
              { id: "files", label: "Sidebar", icon: Folder },
              { id: "editor", label: "Editor", icon: Code2 },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "slides", label: "Slides", icon: Presentation },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active =
              id === "slides"
                ? layoutMode === "slides" && mobilePane === "preview"
                : mobilePane === id && (id !== "preview" || layoutMode !== "slides");
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "slides") {
                    setLayoutMode("slides");
                    setMobilePane("preview");
                  } else {
                    if (id === "preview" && layoutMode === "slides") setLayoutMode("split");
                    setMobilePane(id);
                  }
                }}
                className={`py-2 flex items-center justify-center gap-1.5 ${
                  active ? "text-cyan-300 border-b-2 border-cyan-400" : "text-slate-400"
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main 3-Column IDE Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar */}
        {!zenMode && sidebarOpen && (
          <div
            className={`${
              mobilePane === "files" ? "flex w-full" : "hidden"
            } md:flex md:w-64 lg:w-72 shrink-0 h-full overflow-hidden`}
          >
            <LeftSidebar
              files={activeProject.files}
              activeFilePath={activeFile.path}
              mainFilePath={activeProject.mainFilePath}
              onSelectFile={selectFile}
              onSetMainFile={(path) =>
                updateProject((proj) => ({ ...proj, mainFilePath: path }))
              }
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDuplicateFile={handleDuplicateFile}
              onDeleteFile={(path) => void handleDeleteFile(path)}
              onUploadFiles={(files) => void handleUploadFiles(files)}
              outline={renderResult.outline}
              onJumpToLine={(line) => {
                editorRef.current?.jumpToLine(line);
                setMobilePane("editor");
              }}
              onInsertSnippet={(snippet, offset) =>
                editorRef.current?.insertSnippet(snippet, offset)
              }
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              wordCount={analytics.words}
              wordGoal={settings.wordGoal}
              tasksDone={analytics.tasksDone}
              tasksTotal={analytics.tasksTotal}
              localFolderName={activeProject.localFolderName}
              localFolderConnected={isFolderConnected}
              hasReconnectHandle={Boolean(reconnectableProjectIds[activeProject.id])}
              fsAccessSupported={fsAccessSupported}
              onOpenLocalFolder={() => void handleOpenLocalFolder()}
              onFallbackDirectoryFiles={(files) => void handleFallbackDirectoryFiles(files)}
              onBindSaveToLocalFolder={() => void handleBindSaveToLocalFolder()}
              onReconnectLocalFolder={() => void handleReconnectLocalFolder()}
              onReloadFromLocalFolder={() => void handleReloadFromLocalFolder()}
              onDisconnectLocalFolder={() => void handleDisconnectLocalFolder()}
            />
          </div>
        )}

        {/* Editor + Preview Split Area */}
        <div
          ref={splitContainerRef}
          className="flex-1 flex overflow-hidden min-w-0 h-full"
        >
          {/* Editor Pane */}
          {(layoutMode === "editor" || layoutMode === "split" || mobilePane === "editor") && (
            <div
              className={`${
                mobilePane === "editor" ? "flex w-full" : "hidden"
              } md:flex flex-col h-full min-w-0 ${
                layoutMode === "preview" || layoutMode === "slides" ? "md:hidden" : ""
              }`}
              style={{
                width:
                  layoutMode === "split" ? `${splitPct}%` : "100%",
              }}
            >
              <MarkdownEditor
                ref={editorRef}
                file={activeFile}
                openTabs={openTabs}
                unsavedPaths={unsavedPaths}
                onSelectTab={selectFile}
                onCloseTab={closeTab}
                settings={settings}
                diagnostics={diagnostics}
                projectFiles={activeProject.files}
                footnoteIds={renderResult.footnotes.map((f) => f.id)}
                onChangeContent={handleContentChange}
                onCursorChange={(ln, col) => {
                  setCursorLine(ln);
                  setCursorCol(col);
                }}
                onPasteImage={handlePasteImage}
                onInsertIntoMain={(snippet) => {
                  selectFile(activeProject.mainFilePath);
                  requestAnimationFrame(() => editorRef.current?.insertSnippet(snippet));
                }}
                onFormat={handleFormat}
                onSave={() => void persistNow()}
                onOpenTableWizard={() => setTableWizardOpen(true)}
                onOpenMermaidBuilder={() => setMermaidOpen(true)}
                onOpenMathBuilder={() => setMathOpen(true)}
                onOpenFrontmatter={() => setFrontmatterOpen(true)}
                onOpenCalloutBadge={() => setCalloutOpen(true)}
                onEditorScrollRatio={(r) => setPreviewTargetRatio(r)}
              />
            </div>
          )}

          {/* Resizable Divider */}
          {layoutMode === "split" && (
            <div
              onMouseDown={startResizeSplit}
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize panes"
              className="hidden md:block w-1.5 shrink-0 bg-slate-800/90 hover:bg-cyan-400/60 cursor-col-resize transition-colors"
            />
          )}

          {/* Preview / Slide Pane */}
          {(layoutMode === "preview" ||
            layoutMode === "split" ||
            layoutMode === "slides" ||
            mobilePane === "preview") && (
            <div
              className={`${
                mobilePane === "preview" ? "flex w-full" : "hidden"
              } md:flex flex-col h-full min-w-0 ${
                layoutMode === "editor" ? "md:hidden" : ""
              }`}
              style={{
                width:
                  layoutMode === "split" ? `${100 - splitPct}%` : "100%",
              }}
            >
              <PreviewPane
                result={renderResult}
                slideMode={layoutMode === "slides"}
                previewTheme={settings.previewTheme}
                onChangePreviewTheme={(previewTheme) =>
                  setSettings((prev) => ({ ...prev, previewTheme }))
                }
                previewWidth={settings.previewWidth}
                onChangePreviewWidth={(previewWidth) =>
                  setSettings((prev) => ({ ...prev, previewWidth }))
                }
                zoom={zoom}
                onChangeZoom={setZoom}
                scrollSync={settings.scrollSync}
                onToggleScrollSync={() =>
                  setSettings((prev) => ({ ...prev, scrollSync: !prev.scrollSync }))
                }
                autoNumberHeadings={settings.autoNumberHeadings}
                onToggleAutoNumber={() =>
                  setSettings((prev) => ({
                    ...prev,
                    autoNumberHeadings: !prev.autoNumberHeadings,
                  }))
                }
                onToggleTaskLine={handleToggleTaskLine}
                onOpenWikiTarget={handleOpenWikiTarget}
                onDoubleClickLine={(line) => {
                  editorRef.current?.jumpToLine(line);
                  setMobilePane("editor");
                }}
                onOpenFrontmatterModal={() => setFrontmatterOpen(true)}
                onCopyRichHtml={() => {
                  void copyRichHtmlToClipboard(renderResult.html, activeFile.content).then(
                    (ok) => showToast(ok ? "Copied rich HTML to clipboard" : "Copy failed"),
                  );
                }}
                externalScrollRatio={previewTargetRatio}
                onPreviewScrollRatio={(ratio) => editorRef.current?.scrollToRatio(ratio)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Inspector Drawer & Status Bar */}
      {!zenMode && (
        <BottomDrawer
          open={drawerOpen}
          onToggleOpen={() => setDrawerOpen((v) => !v)}
          activeTab={drawerTab}
          onChangeTab={setDrawerTab}
          diagnostics={diagnostics}
          analytics={analytics}
          compiledHtml={renderResult.html}
          wordGoal={settings.wordGoal}
          onUpdateWordGoal={(wordGoal) =>
            setSettings((prev) => ({ ...prev, wordGoal }))
          }
          cursorLine={cursorLine}
          cursorCol={cursorCol}
          editorTheme={settings.editorTheme}
          previewTheme={settings.previewTheme}
          renderTimeMs={renderResult.renderTimeMs}
          onJumpToLine={(line) => {
            editorRef.current?.jumpToLine(line);
            setMobilePane("editor");
          }}
          onDownloadHtml={() =>
            exportStandaloneHtml(
              renderResult,
              activeProject.name,
              settings.previewTheme,
              layoutMode === "slides",
            )
          }
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-5 z-[9700] px-4 py-2 rounded-xl border border-cyan-400/40 bg-[#0b0e23]/95 text-xs font-medium text-cyan-100 shadow-2xl">
          {toast}
        </div>
      )}

      {/* All 11 Modals */}
      {templatesOpen && (
        <TemplatesWorkspacesModal
          projects={projects}
          activeProjectId={activeProject.id}
          onSelectProject={(id) => {
            const target = projects.find((p) => p.id === id);
            if (!target) return;
            setActiveProjectId(id);
            setActiveFilePath(target.mainFilePath);
            setOpenTabs([target.mainFilePath]);
          }}
          onCreateFromTemplate={(tplId) => {
            const created = createProjectFromTemplate(tplId);
            setProjects((prev) => [created, ...prev]);
            setActiveProjectId(created.id);
            setActiveFilePath(created.mainFilePath);
            setOpenTabs([created.mainFilePath]);
            showToast(`Created workspace "${created.name}"`);
          }}
          onDuplicateProject={(id) => {
            const src = projects.find((p) => p.id === id);
            if (!src) return;
            const now = Date.now();
            const copy: MarkdownProject = {
              ...src,
              id: `md-dup-${now}`,
              name: `${src.name} (Copy)`,
              createdAt: now,
              updatedAt: now,
              storageMode: "browser",
            };
            setProjects((prev) => [copy, ...prev]);
            setActiveProjectId(copy.id);
            setActiveFilePath(copy.mainFilePath);
            setOpenTabs([copy.mainFilePath]);
          }}
          onDeleteProject={(id) => {
            if (projects.length <= 1) return;
            const remaining = projects.filter((p) => p.id !== id);
            setProjects(remaining);
            if (activeProject.id === id) {
              setActiveProjectId(remaining[0].id);
              setActiveFilePath(remaining[0].mainFilePath);
              setOpenTabs([remaining[0].mainFilePath]);
            }
          }}
          onClose={() => setTemplatesOpen(false)}
        />
      )}

      {tableWizardOpen && (
        <TableWizardModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onClose={() => setTableWizardOpen(false)}
        />
      )}

      {frontmatterOpen && (
        <FrontmatterModal
          current={renderResult.frontmatter}
          onApply={handleApplyFrontmatter}
          onClose={() => setFrontmatterOpen(false)}
        />
      )}

      {mermaidOpen && (
        <MermaidBuilderModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onClose={() => setMermaidOpen(false)}
        />
      )}

      {mathOpen && (
        <MathBuilderModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onClose={() => setMathOpen(false)}
        />
      )}

      {calloutOpen && (
        <CalloutBadgeModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onClose={() => setCalloutOpen(false)}
        />
      )}

      {htmlImportOpen && (
        <HtmlImportModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onCreateNewFile={(filename, content) => {
            const now = Date.now();
            const newFile: MarkdownFile = {
              id: `md-html-${now}`,
              path: filename,
              kind: "md",
              content,
              updatedAt: now,
            };
            updateProject((proj) => ({
              ...proj,
              updatedAt: now,
              files: [...proj.files, newFile],
            }));
            selectFile(filename);
          }}
          onClose={() => setHtmlImportOpen(false)}
        />
      )}

      {historyOpen && (
        <HistoryDiffModal
          project={activeProject}
          activeFilePath={activeFile.path}
          onCreateSnapshot={(label) => {
            updateProject((proj) => appendSnapshot(proj, label));
            showToast(`Saved checkpoint "${label}"`);
          }}
          onRestoreSnapshot={(snapId) => {
            const snap = activeProject.snapshots.find((s) => s.id === snapId);
            if (!snap) return;
            updateProject((proj) => ({
              ...proj,
              files: snap.files.map((f) => ({ ...f })),
              mainFilePath: snap.mainFilePath,
              updatedAt: Date.now(),
            }));
            setActiveFilePath(snap.mainFilePath);
            showToast(`Restored checkpoint "${snap.label}"`);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onReset={() => setSettings(DEFAULT_SETTINGS)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {paletteOpen && (
        <CommandPaletteModal
          actions={commandActions}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {shortcutsOpen && (
        <ShortcutsGuideModal
          onInsert={(md) => editorRef.current?.insertSnippet(md)}
          onClose={() => setShortcutsOpen(false)}
        />
      )}
    </div>
  );
}
