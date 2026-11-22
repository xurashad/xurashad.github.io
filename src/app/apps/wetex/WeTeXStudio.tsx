"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Command, Eye, Folder } from "lucide-react";
import "katex/dist/katex.min.css";
import { CodeEditor, type CodeEditorHandle } from "./components/CodeEditor";
import { LeftSidebar } from "./components/LeftSidebar";
import {
  BibWizardModal,
  type CommandPaletteEntry,
  EquationBuilderModal,
  HistoryModal,
  SettingsModal,
  ShortcutsModal,
  STUDIO_SNIPPETS,
  StudioCommandPaletteModal,
  TableWizardModal,
  TemplatesProjectsModal,
} from "./components/Modals";
import { PreviewPane } from "./components/PreviewPane";
import { TopBar } from "./components/TopBar";
import { submitTeXLiveNetForm, TEXLIVE_IFRAME_NAME } from "./lib/cloudCompiler";
import {
  deleteFileFromHandle,
  ensureFolderPermission,
  importFromWebkitDirectoryFiles,
  isFileSystemAccessSupported,
  loadFolderHandle,
  pickLocalFolder,
  pickWritableFolderHandle,
  readFilesFromDirectoryHandle,
  removeFolderHandle,
  saveFolderHandle,
  type WeTeXDirHandle,
  writeAllProjectFilesToHandle,
  writeProjectFileToHandle,
} from "./lib/localFolder";
import {
  compileWithTeXLiveCloud,
  exportProjectZip,
  exportSingleFile,
  exportStandaloneHtml,
  exportVectorPdf,
  importFilesIntoProject,
  inferFileKind,
} from "./lib/exporter";
import { formatLaTeX } from "./lib/formatter";
import { compileLaTeXProject } from "./lib/latexCompiler";
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
  CloudCompileState,
  CloudEngine,
  CompileResult,
  EditorSettings,
  PdfViewerMode,
  ProjectFile,
  SaveStatus,
  WeTeXProject,
} from "./lib/types";
import "./wetex.css";

interface UndoEntry {
  past: string[];
  future: string[];
}

export function WeTeXStudio() {
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
  const [projects, setProjects] = useState<WeTeXProject[]>(studioInit.projects);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    studioInit.activeProjectId,
  );
  const [settings, setSettings] = useState<EditorSettings>(() => loadSettings());

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  const [activeFilePath, setActiveFilePath] = useState<string>(
    () => activeProject?.mainFilePath ?? "main.tex",
  );
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const main = activeProject?.mainFilePath ?? "main.tex";
    const others = activeProject.files
      .map((f) => f.path)
      .filter((p) => p !== main)
      .slice(0, 2);
    return [main, ...others];
  });

  const activeFile = useMemo(
    () =>
      activeProject.files.find((f) => f.path === activeFilePath) ??
      activeProject.files.find((f) => f.path === activeProject.mainFilePath) ??
      activeProject.files[0],
    [activeProject, activeFilePath],
  );

  const [compileResult, setCompileResult] = useState<CompileResult>(() =>
    compileLaTeXProject(activeProject, {
      defaultBibStyle: settings.bibliographyStyle,
    }),
  );

  const [cloudState, setCloudState] = useState<CloudCompileState>(() => ({
    status: "idle",
    pdfUrl: null,
    pdfBlob: null,
    pdfSizeBytes: 0,
    engine: settings.cloudEngine,
    compileTimeMs: 0,
    diagnostics: [],
    logLines: [],
  }));
  const [compiledSig, setCompiledSig] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  // Layout & UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"files" | "outline" | "symbols">("files");
  const [layoutMode, setLayoutMode] = useState<"code" | "split" | "preview">("split");
  const [mobilePane, setMobilePane] = useState<"files" | "editor" | "preview">("editor");
  const [splitPct, setSplitPct] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsTab, setLogsTab] = useState<"problems" | "log" | "stats">("problems");

  // Modals
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tableWizardOpen, setTableWizardOpen] = useState(false);
  const [eqBuilderOpen, setEqBuilderOpen] = useState(false);
  const [bibWizardOpen, setBibWizardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [fsAccessSupported] = useState<boolean>(() => isFileSystemAccessSupported());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => Date.now());
  const [connectedFolderProjectIds, setConnectedFolderProjectIds] = useState<Record<string, boolean>>({});
  const [reconnectableProjectIds, setReconnectableProjectIds] = useState<Record<string, boolean>>({});

  const [undoStacks, setUndoStacks] = useState<Record<string, UndoEntry>>({});
  const [syncTarget, setSyncTarget] = useState<{
    file: string;
    line: number;
    token: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const editorRef = useRef<CodeEditorHandle>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const globalUploadRef = useRef<HTMLInputElement>(null);
  const globalDirInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compileStartRef = useRef<number>(0);
  const awaitingFrameRef = useRef<boolean>(false);
  const pendingSigRef = useRef<string>("");
  const compileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCompiledSigRef = useRef<string>("");
  const attemptedSigRef = useRef<string>("");
  const folderHandlesRef = useRef<Map<string, WeTeXDirHandle>>(new Map());
  const dirtyPathsRef = useRef<Set<string>>(new Set());
  const lastAutoSnapshotAtRef = useRef<number>(0);
  const hasMountedProjectsRef = useRef<boolean>(false);

  const projectSignature = useMemo(
    () =>
      `${activeProject.id}|${activeProject.mainFilePath}|${settings.cloudEngine}|${settings.pdfViewerMode}|` +
      activeProject.files.map((f) => `${f.path}:${f.updatedAt}:${f.content.length}`).join(","),
    [activeProject, settings.cloudEngine, settings.pdfViewerMode],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const selectFile = useCallback((path: string) => {
    setActiveFilePath(path);
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.indexOf(path);
        const nextTabs = prev.filter((p) => p !== path);
        if (activeFilePath === path) {
          const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
          setActiveFilePath(fallback);
        }
        return nextTabs;
      });
    },
    [activeFilePath],
  );

  // Clean up pending cloud compile timer on unmount
  useEffect(() => {
    return () => {
      if (compileTimeoutRef.current) clearTimeout(compileTimeoutRef.current);
    };
  }, []);

  // Lock outer viewport cleanly in Focus Mode & strip transient URL query params
  useEffect(() => {
    document.documentElement.classList.add("wt-editor-active");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.hash}`,
      );
    }
    return () => {
      document.documentElement.classList.remove("wt-editor-active");
    };
  }, []);

  // Track online / offline connectivity smoothly
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      setIsOnline(true);
      attemptedSigRef.current = "";
      if (settings.previewEngine === "real-pdf") {
        setCloudState((prev) => ({
          ...prev,
          status: prev.frameReady ? "success" : "idle",
          errorMessage: undefined,
        }));
      }
      showToast("Back online — Real TeX Live 2026 PDF ready");
    };
    const handleOffline = () => {
      setIsOnline(false);
      awaitingFrameRef.current = false;
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
        compileTimeoutRef.current = null;
      }
      setIsCompiling(false);
      setCloudState((prev) => ({
        ...prev,
        status: "offline",
        errorMessage: "Offline mode — local KaTeX & TikZ preview + local folder workspace active.",
      }));
      showToast("Offline mode active — edits continue autosaving locally");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [settings.previewEngine, showToast]);

  // Restore persisted File System folder handle for active project
  useEffect(() => {
    let cancelled = false;
    const pid = activeProject.id;
    if (folderHandlesRef.current.has(pid)) return;
    loadFolderHandle(pid).then(async (handle) => {
      if (cancelled || !handle) return;
      const granted = await ensureFolderPermission(handle, false);
      if (cancelled) return;
      if (granted) {
        folderHandlesRef.current.set(pid, handle);
        setConnectedFolderProjectIds((prev) => ({ ...prev, [pid]: true }));
        setReconnectableProjectIds((prev) => {
          if (!prev[pid]) return prev;
          const next = { ...prev };
          delete next[pid];
          return next;
        });
      } else {
        setReconnectableProjectIds((prev) => ({ ...prev, [pid]: true }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeProject.id]);

  // Warn before closing tab with unsaved manual-mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveStatus !== "unsaved" && saveStatus !== "saving") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveStatus]);

  const performSave = useCallback(
    async (
      targetProjects: WeTeXProject[],
      targetActive: WeTeXProject,
      opts?: {
        saveAllToDisk?: boolean;
        createCheckpoint?: boolean;
        autoCheckpointIfDue?: boolean;
        label?: string;
      },
    ): Promise<boolean> => {
      setSaveStatus("saving");
      const now = Date.now();
      let listToSave = targetProjects;
      const shouldSnap =
        Boolean(opts?.createCheckpoint) ||
        (Boolean(opts?.autoCheckpointIfDue) &&
          now - lastAutoSnapshotAtRef.current > 180_000);

      if (shouldSnap) {
        lastAutoSnapshotAtRef.current = now;
        const lbl = opts?.label || `Auto-save ${new Date(now).toLocaleTimeString()}`;
        const snapped = appendSnapshot(targetActive, lbl);
        listToSave = targetProjects.map((p) => (p.id === snapped.id ? snapped : p));
        setProjects(listToSave);
      }

      const localOk = saveProjects(listToSave);
      let diskOk = true;
      const dirHandle = folderHandlesRef.current.get(targetActive.id);
      if (dirHandle) {
        const granted = await ensureFolderPermission(dirHandle, false);
        if (granted) {
          if (opts?.saveAllToDisk) {
            const res = await writeAllProjectFilesToHandle(dirHandle, targetActive.files);
            diskOk = res.failed === 0;
          } else {
            const dirtyList = Array.from(dirtyPathsRef.current);
            const filesToWrite =
              dirtyList.length > 0
                ? targetActive.files.filter((f) => dirtyList.includes(f.path))
                : [];
            for (const f of filesToWrite) {
              const wOk = await writeProjectFileToHandle(dirHandle, f);
              if (!wOk) diskOk = false;
            }
          }
          if (diskOk) dirtyPathsRef.current.clear();
        }
      } else if (localOk) {
        dirtyPathsRef.current.clear();
      }

      if (localOk && diskOk) {
        setSaveStatus("saved");
        setLastSavedAt(Date.now());
        return true;
      }
      setSaveStatus("error");
      return false;
    },
    [],
  );

  // Debounced automatic workspace + local-folder saving
  useEffect(() => {
    if (!hasMountedProjectsRef.current) {
      hasMountedProjectsRef.current = true;
      saveProjects(projects);
      return;
    }
    if (!settings.autoSave) return;

    const timer = setTimeout(() => {
      void performSave(projects, activeProject, { autoCheckpointIfDue: true });
    }, settings.autoSaveDelayMs);
    return () => clearTimeout(timer);
  }, [projects, activeProject, settings.autoSave, settings.autoSaveDelayMs, performSave]);

  useEffect(() => {
    if (activeProjectId) saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const runCloudCompile = useCallback(
    async (
      proj: WeTeXProject,
      engine: CloudEngine,
      sig: string,
      viewerMode: PdfViewerMode = "pdfjs",
    ): Promise<boolean> => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setCloudState((prev) => ({
          ...prev,
          status: "offline",
          provider: "texlive.net",
          engine,
          errorMessage: "Browser is offline — showing Instant Offline Preview.",
        }));
        return false;
      }

      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
        compileTimeoutRef.current = null;
      }

      attemptedSigRef.current = sig;
      pendingSigRef.current = sig;
      compileStartRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      awaitingFrameRef.current = true;

      setCloudState((prev) => ({
        ...prev,
        status: "compiling",
        provider: "texlive.net",
        engine,
        errorMessage: undefined,
      }));

      const res = await submitTeXLiveNetForm(proj, engine, {
        target: TEXLIVE_IFRAME_NAME,
        returnFormat: viewerMode === "native" ? "pdf" : "pdfjs",
      });

      if (!res.ok) {
        awaitingFrameRef.current = false;
        if (res.errorMessage && !res.errorMessage.includes("hidden")) {
          setCloudState((prev) => ({
            ...prev,
            status: "offline",
            provider: "texlive.net",
            engine,
            errorMessage: res.errorMessage,
          }));
        }
        return false;
      }

      compileTimeoutRef.current = setTimeout(() => {
        if (!awaitingFrameRef.current) return;
        awaitingFrameRef.current = false;
        setIsCompiling(false);
        setCloudState((prev) => ({
          ...prev,
          status: "offline",
          provider: "texlive.net",
          engine,
          errorMessage:
            "TeXLive.net did not respond in time — showing Instant Offline Preview.",
          logLines: [
            ...prev.logLines,
            "TeXLive.net request timed out after 45s.",
          ],
        }));
      }, 45_000);

      return true;
    },
    [],
  );

  const handleCloudFrameLoad = useCallback(() => {
    if (!awaitingFrameRef.current) return;
    awaitingFrameRef.current = false;
    if (compileTimeoutRef.current) {
      clearTimeout(compileTimeoutRef.current);
      compileTimeoutRef.current = null;
    }

    const elapsed = Math.max(
      1,
      Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
          compileStartRef.current,
      ),
    );
    const sig = pendingSigRef.current;
    lastCompiledSigRef.current = sig;
    setCompiledSig(sig);
    setIsCompiling(false);

    setCloudState((prev) => ({
      ...prev,
      status: "success",
      frameReady: true,
      provider: "texlive.net",
      compileTimeMs: elapsed,
      compiledAt: Date.now(),
      diagnostics: [],
      errorMessage: undefined,
      logLines: [
        `TeX Live 2026 via TeXLive.net (${prev.engine}) compiled in ${elapsed} ms.`,
        "Rendered inside TeXLive.net PDF.js viewer (use viewer Download button or top Download PDF for exact 1:1 .pdf).",
      ],
    }));
  }, []);

  // Load shared project from URL hash if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#wt=") && !hash.startsWith("#wtz=")) return;
    let cancelled = false;
    decodeProjectFromHash(hash).then((shared) => {
      if (cancelled || !shared) return;
      setProjects((prev) => [shared, ...prev]);
      setActiveProjectId(shared.id);
      setActiveFilePath(shared.mainFilePath);
      setOpenTabs([shared.mainFilePath]);
      setCompileResult(
        compileLaTeXProject(shared, {
          defaultBibStyle: settings.bibliographyStyle,
        }),
      );
      window.history.replaceState(null, "", window.location.pathname);
      showToast(`Imported shared project: ${shared.name}`);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.bibliographyStyle, showToast]);

  // Fast local instant compilation (powers Instant Preview, Outline, Autocomplete, Stats)
  useEffect(() => {
    if (!settings.autoCompile) return;
    const timer = setTimeout(() => {
      setCompileResult(
        compileLaTeXProject(activeProject, {
          defaultBibStyle: settings.bibliographyStyle,
        }),
      );
    }, settings.compileDelayMs);
    return () => clearTimeout(timer);
  }, [activeProject, settings.autoCompile, settings.compileDelayMs, settings.bibliographyStyle]);

  // Real TeX Live 2026 PDF compilation via CORS-free embedded TeXLive.net form navigation
  useEffect(() => {
    if (settings.previewEngine !== "real-pdf") return;
    if (layoutMode === "code") return;
    if (attemptedSigRef.current === projectSignature) return;
    const isInitial = !attemptedSigRef.current;
    if (!isInitial && !settings.autoCompile) return;

    const delay = isInitial ? 120 : 1600;
    const timer = setTimeout(() => {
      void runCloudCompile(
        activeProject,
        settings.cloudEngine,
        projectSignature,
        settings.pdfViewerMode,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [
    activeProject,
    layoutMode,
    projectSignature,
    settings.previewEngine,
    settings.autoCompile,
    settings.cloudEngine,
    settings.pdfViewerMode,
    runCloudCompile,
  ]);

  const updateActiveProject = useCallback(
    (updater: (prev: WeTeXProject) => WeTeXProject) => {
      setProjects((prevList) =>
        prevList.map((p) =>
          p.id === activeProject.id ? { ...updater(p), updatedAt: Date.now() } : p,
        ),
      );
    },
    [activeProject.id],
  );

  const recompileNow = useCallback(
    (saveManualCheckpoint = false) => {
      setIsCompiling(true);
      const targetProj = saveManualCheckpoint
        ? appendSnapshot(activeProject, `Manual compile ${new Date().toLocaleTimeString()}`)
        : activeProject;
      if (saveManualCheckpoint) {
        updateActiveProject(() => targetProj);
      }
      const next = compileLaTeXProject(targetProj, {
        defaultBibStyle: settings.bibliographyStyle,
      });
      setCompileResult(next);

      if (settings.previewEngine === "real-pdf" && layoutMode !== "code") {
        void runCloudCompile(
          targetProj,
          settings.cloudEngine,
          projectSignature,
          settings.pdfViewerMode,
        ).then((started) => {
          if (!started) setIsCompiling(false);
        });
      } else {
        setTimeout(() => setIsCompiling(false), 180);
      }
    },
    [
      activeProject,
      layoutMode,
      projectSignature,
      runCloudCompile,
      settings.bibliographyStyle,
      settings.cloudEngine,
      settings.pdfViewerMode,
      settings.previewEngine,
      updateActiveProject,
    ],
  );

  const handleDownloadRealPdf = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      showToast("Offline — opening Print dialog fallback");
      exportVectorPdf(compileResult, activeProject.name, settings.pageSize);
      return;
    }

    setIsDownloadingPdf(true);
    const res = await submitTeXLiveNetForm(activeProject, settings.cloudEngine, {
      target: "_blank",
      returnFormat: "pdf",
    });
    setIsDownloadingPdf(false);

    if (res.ok) {
      showToast("Opened compiled TeX Live 2026 PDF in new tab — click Save or use the preview toolbar Download icon");
    } else {
      showToast("Cloud PDF unavailable — opening Print dialog fallback");
      exportVectorPdf(compileResult, activeProject.name, settings.pageSize);
    }
  }, [
    activeProject,
    compileResult,
    settings.cloudEngine,
    settings.pageSize,
    showToast,
  ]);

  const updateSettings = useCallback((patch: Partial<EditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const undoKey = `${activeProject.id}:${activeFile.path}`;
  const currentUndo = undoStacks[undoKey];

  const markDirty = useCallback((paths: string[] = []) => {
    for (const p of paths) dirtyPathsRef.current.add(p);
    setSaveStatus("unsaved");
  }, []);

  const handleSaveNow = useCallback(async () => {
    const label = `Manual save ${new Date().toLocaleTimeString()}`;
    const ok = await performSave(projects, activeProject, {
      createCheckpoint: true,
      label,
    });
    if (ok) {
      showToast(
        connectedFolderProjectIds[activeProject.id]
          ? `Saved & synced to "${activeProject.localFolderName || "local folder"}"`
          : "Saved project snapshot",
      );
    } else {
      showToast("Save encountered an error — check folder permissions or storage");
    }
    recompileNow(false);
  }, [
    activeProject,
    connectedFolderProjectIds,
    performSave,
    projects,
    recompileNow,
    showToast,
  ]);

  const handleOpenLocalFolder = useCallback(async () => {
    if (!isFileSystemAccessSupported()) {
      globalDirInputRef.current?.click();
      return;
    }
    try {
      const picked = await pickLocalFolder();
      if (!picked) return;
      if (picked.files.length === 0) {
        showToast("Selected folder contains no supported LaTeX or asset files");
        return;
      }
      const now = Date.now();
      const nextProj: WeTeXProject = {
        id: `local-${now}`,
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
      folderHandlesRef.current.set(nextProj.id, picked.handle);
      await saveFolderHandle(nextProj.id, picked.handle);
      setConnectedFolderProjectIds((prev) => ({ ...prev, [nextProj.id]: true }));
      dirtyPathsRef.current.clear();

      awaitingFrameRef.current = false;
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
        compileTimeoutRef.current = null;
      }
      lastCompiledSigRef.current = "";
      attemptedSigRef.current = "";
      setCompiledSig("");
      setCloudState({
        status: "idle",
        frameReady: false,
        pdfUrl: null,
        pdfBlob: null,
        pdfSizeBytes: 0,
        engine: settings.cloudEngine,
        compileTimeMs: 0,
        diagnostics: [],
        logLines: [],
      });
      setProjects((prev) => [nextProj, ...prev]);
      setActiveProjectId(nextProj.id);
      setActiveFilePath(nextProj.mainFilePath);
      setOpenTabs([nextProj.mainFilePath]);
      setCompileResult(
        compileLaTeXProject(nextProj, { defaultBibStyle: settings.bibliographyStyle }),
      );
      setSaveStatus("saved");
      setLastSavedAt(now);
      showToast(`Opened local folder "${picked.name}" (${picked.files.length} files)`);
    } catch {
      showToast("Could not open local folder — check permissions");
    }
  }, [settings.bibliographyStyle, settings.cloudEngine, showToast]);

  const handleFallbackDirectoryImport = useCallback(
    async (fileList: FileList) => {
      try {
        const { folderName, files, mainFilePath } =
          await importFromWebkitDirectoryFiles(fileList);
        if (files.length === 0) {
          showToast("No supported LaTeX or asset files found in folder");
          return;
        }
        const now = Date.now();
        const nextProj: WeTeXProject = {
          id: `local-${now}`,
          name: folderName,
          templateId: "local-folder",
          mainFilePath,
          files,
          snapshots: [],
          createdAt: now,
          updatedAt: now,
          localFolderName: folderName,
          storageMode: "browser",
        };
        setProjects((prev) => [nextProj, ...prev]);
        setActiveProjectId(nextProj.id);
        setActiveFilePath(mainFilePath);
        setOpenTabs([mainFilePath]);
        setCompileResult(
          compileLaTeXProject(nextProj, { defaultBibStyle: settings.bibliographyStyle }),
        );
        lastCompiledSigRef.current = "";
        attemptedSigRef.current = "";
        setCompiledSig("");
        showToast(
          `Imported folder "${folderName}" (${files.length} files). Use ZIP export to save back to disk.`,
        );
      } catch {
        showToast("Failed to import local folder");
      }
    },
    [settings.bibliographyStyle, showToast],
  );

  const handleBindSaveToLocalFolder = useCallback(async () => {
    if (!isFileSystemAccessSupported()) {
      void exportProjectZip(activeProject);
      showToast("Direct folder write requires Chrome/Edge — exported ZIP instead");
      return;
    }
    try {
      const handle = await pickWritableFolderHandle();
      if (!handle) return;
      folderHandlesRef.current.set(activeProject.id, handle);
      await saveFolderHandle(activeProject.id, handle);
      const updatedProj: WeTeXProject = {
        ...activeProject,
        localFolderName: handle.name,
        storageMode: "local-folder",
        updatedAt: Date.now(),
      };
      const nextList = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
      setProjects(nextList);
      setConnectedFolderProjectIds((prev) => ({ ...prev, [activeProject.id]: true }));
      setReconnectableProjectIds((prev) => {
        const next = { ...prev };
        delete next[activeProject.id];
        return next;
      });
      await performSave(nextList, updatedProj, { saveAllToDisk: true });
      showToast(`Project synced to local folder "${handle.name}"`);
    } catch {
      showToast("Failed linking project to local folder");
    }
  }, [activeProject, performSave, projects, showToast]);

  const handleReconnectLocalFolder = useCallback(async () => {
    const pid = activeProject.id;
    const handle = folderHandlesRef.current.get(pid) ?? (await loadFolderHandle(pid));
    if (!handle) {
      await handleBindSaveToLocalFolder();
      return;
    }
    const granted = await ensureFolderPermission(handle, true);
    if (!granted) {
      showToast("Folder permission was denied");
      return;
    }
    folderHandlesRef.current.set(pid, handle);
    setConnectedFolderProjectIds((prev) => ({ ...prev, [pid]: true }));
    setReconnectableProjectIds((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
    showToast(`Reconnected local folder "${handle.name}"`);
  }, [activeProject.id, handleBindSaveToLocalFolder, showToast]);

  const handleReloadFromLocalFolder = useCallback(async () => {
    const handle = folderHandlesRef.current.get(activeProject.id);
    if (!handle) return;
    const granted = await ensureFolderPermission(handle, true);
    if (!granted) {
      showToast("Read permission denied");
      return;
    }
    const { files, mainFilePath } = await readFilesFromDirectoryHandle(handle);
    if (files.length === 0) return;
    const nextMain = files.some((f) => f.path === activeProject.mainFilePath)
      ? activeProject.mainFilePath
      : mainFilePath;
    updateActiveProject((proj) => ({
      ...proj,
      mainFilePath: nextMain,
      files,
    }));
    dirtyPathsRef.current.clear();
    if (!files.some((f) => f.path === activeFilePath)) {
      setActiveFilePath(nextMain);
    }
    showToast(`Reloaded ${files.length} files from "${handle.name}"`);
  }, [activeFilePath, activeProject.id, activeProject.mainFilePath, showToast, updateActiveProject]);

  const handleDisconnectLocalFolder = useCallback(async () => {
    const pid = activeProject.id;
    folderHandlesRef.current.delete(pid);
    await removeFolderHandle(pid);
    setConnectedFolderProjectIds((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
    setReconnectableProjectIds((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
    updateActiveProject((proj) => ({
      ...proj,
      storageMode: "browser",
      localFolderName: undefined,
    }));
    showToast("Disconnected local folder sync (workspace kept in browser)");
  }, [activeProject.id, showToast, updateActiveProject]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      const oldContent = activeFile.content;
      if (newContent === oldContent) return;
      markDirty([activeFile.path]);
      setUndoStacks((prev) => {
        const cur = prev[undoKey] ?? { past: [], future: [] };
        return {
          ...prev,
          [undoKey]: {
            past: [...cur.past.slice(-60), oldContent],
            future: [],
          },
        };
      });
      updateActiveProject((proj) => ({
        ...proj,
        files: proj.files.map((f) =>
          f.path === activeFile.path
            ? { ...f, content: newContent, updatedAt: Date.now() }
            : f,
        ),
      }));
    },
    [activeFile.content, activeFile.path, markDirty, undoKey, updateActiveProject],
  );

  const handleUndo = useCallback(() => {
    if (!currentUndo?.past.length) return;
    const prevText = currentUndo.past[currentUndo.past.length - 1];
    setUndoStacks((prev) => {
      const cur = prev[undoKey] ?? { past: [], future: [] };
      return {
        ...prev,
        [undoKey]: {
          past: cur.past.slice(0, -1),
          future: [activeFile.content, ...cur.future],
        },
      };
    });
    updateActiveProject((proj) => ({
      ...proj,
      files: proj.files.map((f) =>
        f.path === activeFile.path ? { ...f, content: prevText, updatedAt: Date.now() } : f,
      ),
    }));
  }, [activeFile.content, activeFile.path, currentUndo, undoKey, updateActiveProject]);

  const handleRedo = useCallback(() => {
    if (!currentUndo?.future.length) return;
    const nextText = currentUndo.future[0];
    setUndoStacks((prev) => {
      const cur = prev[undoKey] ?? { past: [], future: [] };
      return {
        ...prev,
        [undoKey]: {
          past: [...cur.past, activeFile.content],
          future: cur.future.slice(1),
        },
      };
    });
    updateActiveProject((proj) => ({
      ...proj,
      files: proj.files.map((f) =>
        f.path === activeFile.path ? { ...f, content: nextText, updatedAt: Date.now() } : f,
      ),
    }));
  }, [activeFile.content, activeFile.path, currentUndo, undoKey, updateActiveProject]);

  const handleFormatActiveFile = useCallback(() => {
    if (activeFile.kind !== "tex") {
      showToast("Formatting applies to .tex files");
      return;
    }
    const formatted = formatLaTeX(activeFile.content, settings.tabSize);
    handleContentChange(formatted);
    showToast("Formatted LaTeX indentation");
  }, [activeFile.content, activeFile.kind, handleContentChange, settings.tabSize, showToast]);

  const handleCreateFile = (path: string) => {
    if (activeProject.files.some((f) => f.path === path)) {
      selectFile(path);
      showToast(`Switched to existing ${path}`);
      return;
    }
    const kind = inferFileKind(path);
    const starter =
      kind === "bib"
        ? `% Bibliography file\n`
        : kind === "tex"
          ? `% ${path}\n\\section{New Section}\n\n`
          : "";
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      path,
      kind,
      content: starter,
      updatedAt: Date.now(),
    };
    updateActiveProject((proj) => ({ ...proj, files: [...proj.files, newFile] }));
    markDirty([path]);
    selectFile(path);
    showToast(`Created ${path}`);
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    if (activeProject.files.some((f) => f.path === newPath)) {
      showToast(`File "${newPath}" already exists`);
      return;
    }
    const dirHandle = folderHandlesRef.current.get(activeProject.id);
    if (dirHandle && settings.autoSave) {
      void deleteFileFromHandle(dirHandle, oldPath);
    }
    updateActiveProject((proj) => ({
      ...proj,
      mainFilePath: proj.mainFilePath === oldPath ? newPath : proj.mainFilePath,
      files: proj.files.map((f) =>
        f.path === oldPath
          ? { ...f, path: newPath, kind: inferFileKind(newPath), updatedAt: Date.now() }
          : f,
      ),
    }));
    markDirty([newPath]);
    setOpenTabs((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
    if (activeFilePath === oldPath) setActiveFilePath(newPath);
    showToast(`Renamed to ${newPath}`);
  };

  const handleDuplicateFile = (path: string) => {
    const src = activeProject.files.find((f) => f.path === path);
    if (!src) return;
    const dot = path.lastIndexOf(".");
    const copyPath =
      dot > 0 ? `${path.slice(0, dot)}_copy${path.slice(dot)}` : `${path}_copy`;
    const copy: ProjectFile = {
      ...src,
      id: `file-${Date.now()}`,
      path: copyPath,
      updatedAt: Date.now(),
    };
    updateActiveProject((proj) => ({ ...proj, files: [...proj.files, copy] }));
    markDirty([copyPath]);
    selectFile(copyPath);
  };

  const handleDeleteFile = (path: string) => {
    if (activeProject.files.length <= 1) return;
    const dirHandle = folderHandlesRef.current.get(activeProject.id);
    if (dirHandle && settings.autoSave) {
      void deleteFileFromHandle(dirHandle, path);
    }
    const remaining = activeProject.files.filter((f) => f.path !== path);
    const nextMain =
      activeProject.mainFilePath === path
        ? (remaining.find((f) => f.kind === "tex")?.path ?? remaining[0].path)
        : activeProject.mainFilePath;
    updateActiveProject((proj) => ({
      ...proj,
      mainFilePath: nextMain,
      files: remaining,
    }));
    markDirty([]);
    setOpenTabs((prev) => {
      const next = prev.filter((p) => p !== path);
      return next.length ? next : [nextMain];
    });
    if (activeFilePath === path) setActiveFilePath(nextMain);
    showToast(`Deleted ${path}`);
  };

  const handleUploadFiles = async (fileList: FileList) => {
    try {
      const { files: imported, detectedMain } = await importFilesIntoProject(fileList);
      if (imported.length === 0) return;

      const now = Date.now();
      updateActiveProject((proj) => {
        const merged = [...proj.files];
        for (const item of imported) {
          const idx = merged.findIndex((f) => f.path === item.path);
          const nextObj: ProjectFile = {
            id: `file-${now}-${Math.random().toString(36).slice(2, 6)}`,
            path: item.path,
            kind: item.kind,
            content: item.content,
            updatedAt: now,
          };
          if (idx >= 0) merged[idx] = nextObj;
          else merged.push(nextObj);
        }
        return {
          ...proj,
          mainFilePath: detectedMain ?? proj.mainFilePath,
          files: merged,
        };
      });
      markDirty(imported.map((item) => item.path));
      selectFile(detectedMain ?? imported[0].path);
      showToast(`Imported ${imported.length} file${imported.length > 1 ? "s" : ""}`);
    } catch {
      showToast("Failed to import files");
    }
  };

  const handleJumpToLocation = useCallback(
    (file: string, line: number, targetId?: string) => {
      selectFile(file);
      setMobilePane("editor");
      if (layoutMode === "preview") setLayoutMode("split");
      requestAnimationFrame(() => {
        editorRef.current?.jumpToLine(line);
      });
      setSyncTarget({ file, line, token: Date.now() });
      if (targetId && typeof document !== "undefined") {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.remove("wt-synctex-flash");
          void el.offsetWidth;
          el.classList.add("wt-synctex-flash");
        }
      }
    },
    [layoutMode, selectFile],
  );

  const handleInsertIntoMain = useCallback(
    (snippet: string) => {
      selectFile(activeProject.mainFilePath);
      setMobilePane("editor");
      requestAnimationFrame(() => {
        editorRef.current?.insertSnippet(snippet);
      });
      showToast(`Inserted figure snippet into ${activeProject.mainFilePath}`);
    },
    [activeProject.mainFilePath, selectFile, showToast],
  );

  const handleAddBibAndCite = (bibEntryRaw: string, citeKey: string) => {
    const bibFile = activeProject.files.find((f) => f.kind === "bib");
    if (bibFile) {
      updateActiveProject((proj) => ({
        ...proj,
        files: proj.files.map((f) =>
          f.path === bibFile.path
            ? {
                ...f,
                content: `${f.content.trimEnd()}\n\n${bibEntryRaw}\n`,
                updatedAt: Date.now(),
              }
            : f,
        ),
      }));
    } else {
      const newBib: ProjectFile = {
        id: `file-${Date.now()}`,
        path: "references.bib",
        kind: "bib",
        content: `${bibEntryRaw}\n`,
        updatedAt: Date.now(),
      };
      updateActiveProject((proj) => ({ ...proj, files: [...proj.files, newBib] }));
    }
    markDirty([bibFile ? bibFile.path : "references.bib"]);
    editorRef.current?.insertSnippet(`\\cite{${citeKey}}`);
    showToast(`Added @${citeKey} to bibliography`);
  };

  const handleShareUrl = async () => {
    try {
      const hash = await encodeProjectToHash(activeProject);
      const url = `${window.location.origin}/apps/wetex/editor${hash}`;
      await navigator.clipboard.writeText(url);
      showToast("Shareable project URL copied to clipboard!");
    } catch {
      showToast("Could not copy URL");
    }
  };

  const startSplitDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;
    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      setSplitPct(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "?") setShortcutsOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeDiagnostics =
    settings.previewEngine === "real-pdf" &&
    (cloudState.status === "error" || cloudState.diagnostics.length > 0)
      ? cloudState.diagnostics
      : compileResult.diagnostics;

  const errorCount = activeDiagnostics.filter((d) => d.severity === "error").length;
  const warningCount = activeDiagnostics.filter((d) => d.severity === "warning").length;
  const labelKeys = useMemo(() => Object.keys(compileResult.labels), [compileResult.labels]);
  const bibKeys = useMemo(() => Object.keys(compileResult.bibEntries), [compileResult.bibEntries]);
  const filePaths = useMemo(() => activeProject.files.map((f) => f.path), [activeProject.files]);

  const switchProject = (proj: WeTeXProject) => {
    awaitingFrameRef.current = false;
    if (compileTimeoutRef.current) {
      clearTimeout(compileTimeoutRef.current);
      compileTimeoutRef.current = null;
    }
    lastCompiledSigRef.current = "";
    attemptedSigRef.current = "";
    setCompiledSig("");
    setCloudState({
      status: "idle",
      frameReady: false,
      pdfUrl: null,
      pdfBlob: null,
      pdfSizeBytes: 0,
      engine: settings.cloudEngine,
      compileTimeMs: 0,
      diagnostics: [],
      logLines: [],
    });
    setActiveProjectId(proj.id);
    setActiveFilePath(proj.mainFilePath);
    setOpenTabs([proj.mainFilePath]);
    setCompileResult(
      compileLaTeXProject(proj, { defaultBibStyle: settings.bibliographyStyle }),
    );
  };

  const isPdfStale =
    settings.previewEngine === "real-pdf" &&
    cloudState.status === "success" &&
    compiledSig !== "" &&
    compiledSig !== projectSignature;

  const paletteItems: CommandPaletteEntry[] = commandPaletteOpen
    ? [
        {
          id: "act-recompile",
          group: "Action",
          label: "Recompile Document",
          detail: `Compile with ${settings.cloudEngine}`,
          shortcut: "Ctrl+Enter",
          run: () => recompileNow(false),
        },
        {
          id: "act-download-pdf",
          group: "Action",
          label: "Download Real PDF (.pdf)",
          detail: "Open authentic compiled TeX Live 2026 PDF",
          run: () => {
            void handleDownloadRealPdf();
          },
        },
        {
          id: "act-tex-log",
          group: "Action",
          label: "Open Raw TeX Live 2026 Build Log",
          detail: "Inspect full pdflatex / xelatex / lualatex transcript",
          run: () => {
            void submitTeXLiveNetForm(activeProject, settings.cloudEngine, {
              target: "_blank",
              returnFormat: "log",
            });
          },
        },
        {
          id: "act-toggle-preview",
          group: "Action",
          label:
            settings.previewEngine === "real-pdf"
              ? "Switch Preview to Instant (Offline KaTeX)"
              : "Switch Preview to Real PDF (TeX Live 2026)",
          run: () =>
            updateSettings({
              previewEngine:
                settings.previewEngine === "real-pdf" ? "instant" : "real-pdf",
            }),
        },
        {
          id: "act-viewer-mode",
          group: "Action",
          label:
            settings.pdfViewerMode === "pdfjs"
              ? "Switch Real PDF Viewer to Native Browser PDF"
              : "Switch Real PDF Viewer to PDF.js",
          run: () =>
            updateSettings({
              pdfViewerMode: settings.pdfViewerMode === "pdfjs" ? "native" : "pdfjs",
            }),
        },
        ...(["pdflatex", "xelatex", "lualatex"] as const).map((eng) => ({
          id: `act-engine-${eng}`,
          group: "Action" as const,
          label: `Use Compiler Engine: ${eng}`,
          detail: settings.cloudEngine === eng ? "Currently active" : undefined,
          run: () => updateSettings({ cloudEngine: eng }),
        })),
        {
          id: "act-format",
          group: "Action",
          label: "Format LaTeX Active File",
          shortcut: "Alt+F",
          run: handleFormatActiveFile,
        },
        {
          id: "act-save-now",
          group: "Action",
          label: "Save Workspace Now",
          detail: connectedFolderProjectIds[activeProject.id]
            ? `Sync to local folder "${activeProject.localFolderName || "Disk"}"`
            : "Save to browser storage & create snapshot",
          shortcut: "Ctrl+S",
          run: () => {
            void handleSaveNow();
          },
        },
        {
          id: "act-open-local-folder",
          group: "Action",
          label: "Open Offline Local Folder…",
          detail: "Edit & sync LaTeX files directly from disk",
          run: () => {
            void handleOpenLocalFolder();
          },
        },
        {
          id: "act-bind-local-folder",
          group: "Action",
          label: "Save Project to Local Folder…",
          detail: "Write current project files onto local disk",
          run: () => {
            void handleBindSaveToLocalFolder();
          },
        },
        {
          id: "act-toggle-autosave",
          group: "Action",
          label: settings.autoSave ? "Disable Auto-Save" : "Enable Auto-Save",
          run: () => updateSettings({ autoSave: !settings.autoSave }),
        },
        {
          id: "act-templates",
          group: "Action",
          label: "Projects & 9 Starter Templates Gallery",
          run: () => setTemplatesOpen(true),
        },
        {
          id: "act-history",
          group: "Action",
          label: "Version History & Diff",
          run: () => setHistoryOpen(true),
        },
        {
          id: "act-table-wiz",
          group: "Action",
          label: "Insert Booktabs Table (Visual Generator)",
          run: () => setTableWizardOpen(true),
        },
        {
          id: "act-eq-wiz",
          group: "Action",
          label: "Insert Equation / Matrix (Visual Builder)",
          run: () => setEqBuilderOpen(true),
        },
        {
          id: "act-bib-wiz",
          group: "Action",
          label: "Insert BibTeX / DOI Citation",
          run: () => setBibWizardOpen(true),
        },
        {
          id: "act-zip",
          group: "Action",
          label: "Export Full Project Archive (.zip)",
          run: () => {
            void exportProjectZip(activeProject);
          },
        },
        {
          id: "act-share",
          group: "Action",
          label: "Copy Shareable Project URL",
          run: () => {
            void handleShareUrl();
          },
        },
        {
          id: "act-sidebar",
          group: "Action",
          label: sidebarOpen ? "Collapse Left Sidebar" : "Expand Left Sidebar",
          run: () => setSidebarOpen((v) => !v),
        },
        ...activeProject.files.map((f) => ({
          id: `file-${f.path}`,
          group: "File" as const,
          label: f.path,
          detail: `${f.kind.toUpperCase()} project file`,
          run: () => {
            selectFile(f.path);
            setMobilePane("editor");
          },
        })),
        ...compileResult.outline.slice(0, 24).map((o) => ({
          id: `out-${o.id}`,
          group: "Outline" as const,
          label: o.title,
          detail: `${o.file}:${o.line} (${o.kind})`,
          run: () => handleJumpToLocation(o.file, o.line, o.targetId),
        })),
        ...STUDIO_SNIPPETS.map((s) => ({
          id: s.id,
          group: "Snippet" as const,
          label: `Insert ${s.label}`,
          detail: s.detail,
          run: () => editorRef.current?.insertSnippet(s.snippet, s.cursorOffset),
        })),
      ]
    : [];

  return (
    <div className={`wt-root ${isFullscreen ? "wt-fullscreen-active" : ""}`}>
      <input
        ref={globalUploadRef}
        type="file"
        multiple
        accept=".tex,.bib,.cls,.sty,.txt,.zip,.png,.jpg,.jpeg,.webp,.svg,.gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleUploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        ref={globalDirInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFallbackDirectoryImport(e.target.files);
          e.target.value = "";
        }}
      />

      <TopBar
        projectName={activeProject.name}
        onRenameProject={(name) => {
          updateActiveProject((p) => ({ ...p, name }));
          markDirty([]);
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        autoCompile={settings.autoCompile}
        onToggleAutoCompile={() => updateSettings({ autoCompile: !settings.autoCompile })}
        isCompiling={isCompiling || cloudState.status === "compiling"}
        onRecompile={() => recompileNow(false)}
        previewEngine={settings.previewEngine}
        onChangePreviewEngine={(previewEngine) => updateSettings({ previewEngine })}
        cloudEngine={settings.cloudEngine}
        onChangeCloudEngine={(engine) => updateSettings({ cloudEngine: engine })}
        onOpenTeXLiveNet={() => {
          compileWithTeXLiveCloud(activeProject, settings.cloudEngine);
          showToast(`Submitted project to TeXLive.net (${settings.cloudEngine})`);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={Boolean(currentUndo?.past.length)}
        canRedo={Boolean(currentUndo?.future.length)}
        onFormat={handleFormatActiveFile}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenTableWizard={() => setTableWizardOpen(true)}
        onOpenEquationBuilder={() => setEqBuilderOpen(true)}
        onOpenBibWizard={() => setBibWizardOpen(true)}
        onInsertSnippet={(snippet, offset) =>
          editorRef.current?.insertSnippet(snippet, offset)
        }
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onDownloadPdf={handleDownloadRealPdf}
        onPrintInstant={() =>
          exportVectorPdf(compileResult, activeProject.name, settings.pageSize)
        }
        onExportHtml={() => exportStandaloneHtml(compileResult, activeProject.name)}
        onExportZip={() => exportProjectZip(activeProject)}
        onExportActiveFile={() => exportSingleFile(activeFile)}
        onTriggerUpload={() => globalUploadRef.current?.click()}
        onShareUrl={handleShareUrl}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        errorCount={errorCount}
        warningCount={warningCount}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        autoSave={settings.autoSave}
        onToggleAutoSave={() => updateSettings({ autoSave: !settings.autoSave })}
        onSaveNow={() => {
          void handleSaveNow();
        }}
        localFolderName={activeProject.localFolderName}
        localFolderConnected={Boolean(connectedFolderProjectIds[activeProject.id])}
        onOpenLocalFolder={() => {
          void handleOpenLocalFolder();
        }}
        onBindSaveToLocalFolder={() => {
          void handleBindSaveToLocalFolder();
        }}
        onReloadFromLocalFolder={() => {
          void handleReloadFromLocalFolder();
        }}
        onDisconnectLocalFolder={() => {
          void handleDisconnectLocalFolder();
        }}
      />

      {/* Mobile Pane Switcher */}
      <div className="lg:hidden grid grid-cols-3 border-b border-slate-800 bg-[#080a18] text-xs font-medium">
        {(
          [
            { id: "files", label: "Files & Symbols", icon: Folder },
            { id: "editor", label: "LaTeX Editor", icon: Code2 },
            { id: "preview", label: "Compiled PDF", icon: Eye },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobilePane(id)}
            className={`py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              mobilePane === id
                ? "border-cyan-400 text-white bg-indigo-500/15"
                : "border-transparent text-slate-400"
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main 3-Pane IDE Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          className={`${
            mobilePane === "files" ? "block w-full lg:w-[250px]" : "hidden"
          } ${sidebarOpen ? "lg:block lg:w-[250px]" : "lg:hidden"} shrink-0 h-full overflow-hidden`}
        >
          <LeftSidebar
            files={activeProject.files}
            activeFilePath={activeFile.path}
            mainFilePath={activeProject.mainFilePath}
            onSelectFile={(path) => {
              selectFile(path);
              setMobilePane("editor");
            }}
            onSetMainFile={(path) => {
              updateActiveProject((p) => ({ ...p, mainFilePath: path }));
              showToast(`Main entry set to ${path}`);
            }}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDuplicateFile={handleDuplicateFile}
            onDeleteFile={handleDeleteFile}
            onUploadFiles={handleUploadFiles}
            outline={compileResult.outline}
            onJumpToLocation={handleJumpToLocation}
            onInsertSymbol={(ins, offset) => {
              setMobilePane("editor");
              requestAnimationFrame(() => editorRef.current?.insertSnippet(ins, offset));
            }}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            localFolderName={activeProject.localFolderName}
            localFolderConnected={Boolean(connectedFolderProjectIds[activeProject.id])}
            hasReconnectHandle={Boolean(reconnectableProjectIds[activeProject.id])}
            fsAccessSupported={fsAccessSupported}
            onOpenLocalFolder={() => {
              void handleOpenLocalFolder();
            }}
            onFallbackDirectoryFiles={(fl) => {
              void handleFallbackDirectoryImport(fl);
            }}
            onBindSaveToLocalFolder={() => {
              void handleBindSaveToLocalFolder();
            }}
            onReconnectLocalFolder={() => {
              void handleReconnectLocalFolder();
            }}
            onReloadFromLocalFolder={() => {
              void handleReloadFromLocalFolder();
            }}
            onDisconnectLocalFolder={() => {
              void handleDisconnectLocalFolder();
            }}
          />
        </div>

        <div
          ref={splitContainerRef}
          className={`flex-1 flex min-w-0 min-h-0 overflow-hidden ${
            mobilePane === "files" ? "hidden lg:flex" : "flex"
          }`}
        >
          {layoutMode !== "preview" && (
            <div
              style={
                layoutMode === "split"
                  ? { width: `${splitPct}%` }
                  : { width: "100%" }
              }
              className={`${
                mobilePane === "editor" ? "flex w-full" : "hidden lg:flex"
              } ${layoutMode === "code" ? "lg:!w-full" : ""} flex-col min-w-0 h-full`}
            >
              <CodeEditor
                key={activeFile.path}
                ref={editorRef}
                file={activeFile}
                openTabs={openTabs.filter((p) =>
                  activeProject.files.some((f) => f.path === p),
                )}
                onSelectTab={selectFile}
                onCloseTab={closeTab}
                settings={settings}
                diagnostics={activeDiagnostics}
                labels={labelKeys}
                bibKeys={bibKeys}
                projectFiles={filePaths}
                onChangeContent={handleContentChange}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onFormat={handleFormatActiveFile}
                onOpenTableWizard={() => setTableWizardOpen(true)}
                onOpenEquationBuilder={() => setEqBuilderOpen(true)}
                onOpenBibWizard={() => setBibWizardOpen(true)}
                onInsertIntoMain={handleInsertIntoMain}
                onRecompile={() => recompileNow(true)}
                onSave={() => {
                  void handleSaveNow();
                }}
                onSyncToPreview={(file, line) => {
                  updateSettings({ previewEngine: "instant" });
                  setSyncTarget({ file, line, token: Date.now() });
                  setMobilePane("preview");
                  if (layoutMode === "code") setLayoutMode("split");
                }}
              />
            </div>
          )}

          {layoutMode === "split" && (
            <div
              onPointerDown={startSplitDrag}
              title="Drag to resize Editor & Preview"
              className="hidden lg:flex w-1.5 shrink-0 cursor-col-resize bg-slate-800/80 hover:bg-cyan-400/70 transition-colors items-center justify-center group"
            >
              <div className="w-0.5 h-10 rounded-full bg-slate-600 group-hover:bg-white" />
            </div>
          )}

          {layoutMode !== "code" && (
            <div
              style={
                layoutMode === "split"
                  ? { width: `${100 - splitPct}%` }
                  : { width: "100%" }
              }
              className={`${
                mobilePane === "preview" ? "flex w-full" : "hidden lg:flex"
              } ${layoutMode === "preview" ? "lg:!w-full" : ""} flex-col min-w-0 h-full`}
            >
              <PreviewPane
                result={compileResult}
                cloudState={cloudState}
                settings={settings}
                onUpdateSettings={updateSettings}
                onSwitchPreviewEngine={(previewEngine) => {
                  updateSettings({ previewEngine });
                  if (previewEngine === "real-pdf" && lastCompiledSigRef.current !== projectSignature) {
                    void runCloudCompile(
                      activeProject,
                      settings.cloudEngine,
                      projectSignature,
                      settings.pdfViewerMode,
                    );
                  }
                }}
                onRetryCloud={() =>
                  void runCloudCompile(
                    activeProject,
                    settings.cloudEngine,
                    projectSignature,
                    settings.pdfViewerMode,
                  )
                }
                onCloudFrameLoad={handleCloudFrameLoad}
                isPdfStale={isPdfStale}
                zoom={zoom}
                onZoomChange={setZoom}
                syncTarget={syncTarget}
                onJumpToSource={(file, line) => handleJumpToLocation(file, line)}
                onDownloadPdf={handleDownloadRealPdf}
                onPrintInstant={() =>
                  exportVectorPdf(compileResult, activeProject.name, settings.pageSize)
                }
                onOpenPdfTab={() => {
                  void submitTeXLiveNetForm(activeProject, settings.cloudEngine, {
                    target: "_blank",
                    returnFormat: "pdf",
                  });
                }}
                onOpenTeXLog={() => {
                  void submitTeXLiveNetForm(activeProject, settings.cloudEngine, {
                    target: "_blank",
                    returnFormat: "log",
                  });
                  showToast("Opened raw TeX Live 2026 log in new tab");
                }}
                onExportHtml={() => exportStandaloneHtml(compileResult, activeProject.name)}
                onOpenTeXLiveNet={() => {
                  void compileWithTeXLiveCloud(activeProject, settings.cloudEngine);
                  showToast(`Submitted project to TeXLive.net (${settings.cloudEngine})`);
                }}
                logsOpen={logsOpen}
                onToggleLogs={() => setLogsOpen((v) => !v)}
                logsTab={logsTab}
                onLogsTabChange={setLogsTab}
                isDownloadingPdf={isDownloadingPdf}
              />
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[9500] px-4 py-2 rounded-xl bg-[#0d1229]/95 border border-cyan-400/45 text-xs font-medium text-cyan-100 shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}

      {templatesOpen && (
        <TemplatesProjectsModal
          projects={projects}
          activeProjectId={activeProject.id}
          onSelectProject={(id) => {
            const found = projects.find((p) => p.id === id);
            if (found) switchProject(found);
          }}
          onDeleteProject={(id) => {
            if (projects.length <= 1) return;
            const rest = projects.filter((p) => p.id !== id);
            setProjects(rest);
            if (activeProjectId === id) {
              switchProject(rest[0]);
            }
          }}
          onCreateFromTemplate={(tplId, customName) => {
            const nextProj = createProjectFromTemplate(tplId, customName);
            setProjects((prev) => [nextProj, ...prev]);
            switchProject(nextProj);
            showToast(`Created "${nextProj.name}"`);
          }}
          onClose={() => setTemplatesOpen(false)}
        />
      )}

      {tableWizardOpen && (
        <TableWizardModal
          onInsert={(tex) => editorRef.current?.insertSnippet(tex)}
          onClose={() => setTableWizardOpen(false)}
        />
      )}

      {eqBuilderOpen && (
        <EquationBuilderModal
          onInsert={(tex) => editorRef.current?.insertSnippet(tex)}
          onClose={() => setEqBuilderOpen(false)}
        />
      )}

      {bibWizardOpen && (
        <BibWizardModal
          existingKeys={bibKeys}
          onAddBibAndCite={handleAddBibAndCite}
          onInsertCiteOnly={(k) => editorRef.current?.insertSnippet(`\\cite{${k}}`)}
          onClose={() => setBibWizardOpen(false)}
        />
      )}

      {historyOpen && (
        <HistoryModal
          project={activeProject}
          onSaveSnapshot={(lbl) => {
            updateActiveProject((p) => appendSnapshot(p, lbl));
            showToast(`Saved snapshot: ${lbl}`);
          }}
          onRestoreSnapshot={(snapId) => {
            const snap = activeProject.snapshots.find((s) => s.id === snapId);
            if (!snap) return;
            updateActiveProject((p) => ({
              ...appendSnapshot(p, `Auto-backup before restoring "${snap.label}"`),
              mainFilePath: snap.mainFilePath,
              files: snap.files.map((f) => ({ ...f })),
            }));
            selectFile(snap.mainFilePath);
            showToast(`Restored snapshot: ${snap.label}`);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onReset={() => setSettings(DEFAULT_SETTINGS)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Bottom Studio Status Bar */}
      <footer className="h-6 px-3 border-t border-slate-800/80 bg-[#070918] text-[10.5px] font-mono text-slate-400 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 shrink-0 ${
              isOnline ? "text-emerald-300" : "text-amber-300"
            }`}
            title={
              isOnline
                ? "Online: Real TeX Live 2026 PDF & Instant KaTeX available"
                : "Offline: Local folder editing, autosave & Instant KaTeX/TikZ available"
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span
            className="hidden md:inline truncate max-w-[140px] text-slate-300"
            title={
              connectedFolderProjectIds[activeProject.id]
                ? `Local folder: ${activeProject.localFolderName || "Disk"}`
                : "Stored in browser workspace"
            }
          >
            {connectedFolderProjectIds[activeProject.id]
              ? `Disk: ${activeProject.localFolderName || "Folder"}`
              : "Browser"}
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="text-slate-300 truncate">{activeFile.path}</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden lg:inline">{compileResult.stats.wordCount} words</span>
          <span className="hidden lg:inline">{compileResult.stats.equationCount} eqs</span>
          <span className="hidden xl:inline">{compileResult.stats.citationCount} cites</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              void handleSaveNow();
            }}
            className="hidden sm:inline-flex items-center gap-1 text-[10.5px] hover:text-white cursor-pointer"
            title="Click to save now (Ctrl+S)"
          >
            <span>Auto-Save: {settings.autoSave ? "ON" : "OFF"}</span>
            <span className="text-slate-600">·</span>
            <span
              className={
                saveStatus === "error"
                  ? "text-rose-300"
                  : saveStatus === "unsaved"
                    ? "text-amber-300"
                    : "text-emerald-300"
              }
            >
              {saveStatus === "saved" && lastSavedAt
                ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : saveStatus}
            </span>
          </button>
          <span className="hidden xl:inline text-cyan-300/80">
            {settings.previewEngine === "real-pdf" && isOnline
              ? `TeX Live 2026 · ${settings.cloudEngine} (${settings.pdfViewerMode})`
              : "Instant KaTeX · Offline"}
          </span>
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] border border-slate-700/60 text-slate-300 cursor-pointer transition-colors"
          >
            <Command size={10} className="text-cyan-300" />
            <span>Ctrl+K Commands</span>
          </button>
        </div>
      </footer>

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {commandPaletteOpen && (
        <StudioCommandPaletteModal
          items={paletteItems}
          onClose={() => setCommandPaletteOpen(false)}
        />
      )}
    </div>
  );
}
