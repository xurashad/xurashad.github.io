"use client";

import katex from "katex";
import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  FileCode2,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  ListTree,
  RefreshCw,
  Search,
  Sigma,
  Star,
  Trash2,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import { SYMBOL_CATEGORIES } from "../lib/symbols";
import type { OutlineNode, ProjectFile } from "../lib/types";

export interface LeftSidebarProps {
  files: ProjectFile[];
  activeFilePath: string;
  mainFilePath: string;
  onSelectFile: (path: string) => void;
  onSetMainFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDuplicateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onUploadFiles: (files: FileList) => void;
  outline: OutlineNode[];
  onJumpToLocation: (file: string, line: number, targetId?: string) => void;
  onInsertSymbol: (insert: string, cursorOffset?: number) => void;
  activeTab: "files" | "outline" | "symbols";
  onTabChange: (tab: "files" | "outline" | "symbols") => void;
  localFolderName?: string;
  localFolderConnected?: boolean;
  hasReconnectHandle?: boolean;
  fsAccessSupported?: boolean;
  onOpenLocalFolder: () => void;
  onFallbackDirectoryFiles: (files: FileList) => void;
  onBindSaveToLocalFolder: () => void;
  onReconnectLocalFolder: () => void;
  onReloadFromLocalFolder: () => void;
  onDisconnectLocalFolder: () => void;
}

interface FolderTreeNode {
  name: string;
  fullPath: string;
  folders: FolderTreeNode[];
  files: ProjectFile[];
}

function buildFileTree(files: ProjectFile[]): FolderTreeNode {
  const root: FolderTreeNode = { name: "", fullPath: "", folders: [], files: [] };
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const f of sorted) {
    const parts = f.path.split("/").filter(Boolean);
    if (parts.length <= 1) {
      root.files.push(f);
      continue;
    }
    let node = root;
    let accum = "";
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      accum = accum ? `${accum}/${seg}` : seg;
      let child = node.folders.find((c) => c.name === seg);
      if (!child) {
        child = { name: seg, fullPath: accum, folders: [], files: [] };
        node.folders.push(child);
      }
      node = child;
    }
    node.files.push(f);
  }
  return root;
}

function FileIcon({ file }: { file: ProjectFile }) {
  if (file.kind === "image") return <ImageIcon size={13} className="text-pink-400 shrink-0" />;
  if (file.kind === "bib") return <BookOpen size={13} className="text-emerald-400 shrink-0" />;
  if (file.kind === "tex") return <FileCode2 size={13} className="text-cyan-400 shrink-0" />;
  return <FileText size={13} className="text-slate-400 shrink-0" />;
}

export function LeftSidebar(props: LeftSidebarProps) {
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [outlineFilter, setOutlineFilter] = useState<"all" | "sections" | "floats" | "labels">("all");
  const [symbolCat, setSymbolCat] = useState<string>(SYMBOL_CATEGORIES[0].id);
  const [symbolSearch, setSymbolSearch] = useState("");

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const dirUploadInputRef = useRef<HTMLInputElement>(null);

  const fileTree = useMemo(() => buildFileTree(props.files), [props.files]);

  const filteredOutline = useMemo(() => {
    return props.outline.filter((item) => {
      if (outlineFilter === "sections") {
        return ["part", "chapter", "section", "subsection", "subsubsection", "frame"].includes(item.kind);
      }
      if (outlineFilter === "floats") {
        return item.kind === "figure" || item.kind === "table";
      }
      if (outlineFilter === "labels") {
        return item.kind === "label";
      }
      return true;
    });
  }, [props.outline, outlineFilter]);

  const filteredSymbols = useMemo(() => {
    const q = symbolSearch.trim().toLowerCase();
    if (q) {
      return SYMBOL_CATEGORIES.flatMap((c) => c.items).filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q),
      );
    }
    return SYMBOL_CATEGORIES.find((c) => c.id === symbolCat)?.items ?? [];
  }, [symbolCat, symbolSearch]);

  const submitNewFile = () => {
    const cleaned = newFilePath.trim().replace(/^\/+/, "");
    if (!cleaned) return;
    const finalPath = cleaned.includes(".") ? cleaned : `${cleaned}.tex`;
    props.onCreateFile(finalPath);
    setNewFilePath("");
    setNewFileOpen(false);
  };

  const commitRename = (oldPath: string) => {
    const cleaned = renameDraft.trim().replace(/^\/+/, "");
    setRenamingPath(null);
    if (cleaned && cleaned !== oldPath) {
      props.onRenameFile(oldPath, cleaned);
    }
  };

  const renderFileRow = (file: ProjectFile, depth = 0) => {
    const isActive = file.path === props.activeFilePath;
    const isMain = file.path === props.mainFilePath;
    const displayName = file.path.includes("/")
      ? file.path.slice(file.path.lastIndexOf("/") + 1)
      : file.path;

    if (renamingPath === file.path) {
      return (
        <div
          key={file.id}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="flex items-center gap-1 pr-2 py-1"
        >
          <input
            type="text"
            autoFocus
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={() => commitRename(file.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename(file.path);
              if (e.key === "Escape") setRenamingPath(null);
            }}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs rounded bg-slate-900 border border-cyan-400 text-white outline-none"
          />
          <button
            type="button"
            onClick={() => commitRename(file.path)}
            className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
          >
            <Check size={12} />
          </button>
        </div>
      );
    }

    return (
      <div
        key={file.id}
        onClick={() => props.onSelectFile(file.path)}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        className={`group flex items-center gap-2 pr-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
          isActive
            ? "bg-gradient-to-r from-violet-600/30 to-indigo-500/20 text-white border border-violet-400/35 shadow-sm"
            : "text-slate-300/85 hover:bg-white/[0.05] border border-transparent"
        }`}
      >
        <FileIcon file={file} />
        <span className="truncate flex-1 font-mono text-[11.5px]">{displayName}</span>
        {isMain && (
          <span
            title="Main Entry Document"
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0"
          >
            main
          </span>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {file.kind === "tex" && !isMain && (
            <button
              type="button"
              onClick={() => props.onSetMainFile(file.path)}
              title="Set as Main Entry File"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 cursor-pointer"
            >
              <Star size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRenamingPath(file.path);
              setRenameDraft(file.path);
            }}
            title="Rename"
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <Edit3 size={11} />
          </button>
          <button
            type="button"
            onClick={() => props.onDuplicateFile(file.path)}
            title="Duplicate"
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 cursor-pointer"
          >
            <Copy size={11} />
          </button>
          {props.files.length > 1 && (
            <button
              type="button"
              onClick={() => props.onDeleteFile(file.path)}
              title="Delete File"
              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFolderNode = (folder: FolderTreeNode, depth = 0) => {
    const isCollapsed = Boolean(collapsedFolders[folder.fullPath]);
    return (
      <div key={folder.fullPath} className="pt-0.5">
        <button
          type="button"
          onClick={() =>
            setCollapsedFolders((prev) => ({
              ...prev,
              [folder.fullPath]: !prev[folder.fullPath],
            }))
          }
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="w-full flex items-center gap-1.5 pr-2 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/[0.05] cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={12} className="text-slate-500 shrink-0" />
          ) : (
            <ChevronDown size={12} className="text-slate-500 shrink-0" />
          )}
          {isCollapsed ? (
            <Folder size={13} className="text-amber-300/80 shrink-0" />
          ) : (
            <FolderOpen size={13} className="text-amber-300/90 shrink-0" />
          )}
          <span className="font-mono text-[11.5px] truncate">{folder.name}/</span>
        </button>
        {!isCollapsed && (
          <div className="space-y-0.5 mt-0.5">
            {folder.folders.map((sub) => renderFolderNode(sub, depth + 1))}
            {folder.files.map((f) => renderFileRow(f, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="wt-sidebar h-full flex flex-col select-none">
      {/* Sidebar Mode Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-700/50 p-1 gap-1 bg-black/20">
        {(
          [
            { id: "files", label: "Files", icon: Folder },
            { id: "outline", label: "Outline", icon: ListTree },
            { id: "symbols", label: "Symbols", icon: Sigma },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onTabChange(id)}
            className={`py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              props.activeTab === id
                ? "bg-indigo-500/25 text-white border border-indigo-400/35"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: FILES */}
      {props.activeTab === "files" && (
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            isDraggingOver ? "ring-2 ring-inset ring-cyan-400 bg-cyan-500/10" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer.files?.length) {
              props.onUploadFiles(e.dataTransfer.files);
            }
          }}
        >
          {/* Local Folder Link Status Banner */}
          {props.localFolderConnected && props.localFolderName ? (
            <div className="px-2.5 py-1.5 border-b border-emerald-500/25 bg-emerald-500/10 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 text-emerald-200 font-mono">
                <HardDrive size={12} className="text-emerald-300 shrink-0" />
                <span className="truncate" title={`Synced to local folder "${props.localFolderName}"`}>
                  {props.localFolderName}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={props.onReloadFromLocalFolder}
                  title="Reload files from local folder"
                  className="p-1 rounded hover:bg-white/10 text-emerald-200 cursor-pointer"
                >
                  <RefreshCw size={11} />
                </button>
                <button
                  type="button"
                  onClick={props.onDisconnectLocalFolder}
                  title="Disconnect local folder sync"
                  className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-rose-300 cursor-pointer"
                >
                  <Unlink size={11} />
                </button>
              </div>
            </div>
          ) : props.hasReconnectHandle && props.localFolderName ? (
            <div className="px-2.5 py-1.5 border-b border-amber-500/25 bg-amber-500/10 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-amber-200 font-mono">{props.localFolderName}</span>
              <button
                type="button"
                onClick={props.onReconnectLocalFolder}
                className="px-2 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-100 text-[10px] font-medium shrink-0 cursor-pointer"
              >
                Reconnect
              </button>
            </div>
          ) : null}

          {/* File toolbar */}
          <div className="px-2.5 py-2 flex items-center justify-between border-b border-slate-800/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Files ({props.files.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (props.fsAccessSupported) props.onOpenLocalFolder();
                  else dirUploadInputRef.current?.click();
                }}
                title="Open Offline Local Folder…"
                className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <HardDrive size={14} />
              </button>
              <button
                type="button"
                onClick={() => setNewFileOpen((v) => !v)}
                title="New File (supports folders e.g. sections/ch1.tex)"
                className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <FilePlus size={14} />
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                title="Upload .tex, .bib, images, or .zip"
                className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-violet-300 transition-colors cursor-pointer"
              >
                <Upload size={14} />
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                accept=".tex,.bib,.cls,.sty,.txt,.zip,.png,.jpg,.jpeg,.webp,.svg,.gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) props.onUploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={dirUploadInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) props.onFallbackDirectoryFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Inline new file form */}
          {newFileOpen && (
            <div className="p-2 border-b border-slate-800/70 bg-indigo-950/30 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="e.g. appendix.tex or sections/intro.tex"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewFile();
                  if (e.key === "Escape") setNewFileOpen(false);
                }}
                className="flex-1 min-w-0 px-2 py-1 text-xs rounded bg-slate-900 border border-indigo-400/50 text-white placeholder:text-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={submitNewFile}
                className="p-1 rounded bg-indigo-500 text-white hover:bg-indigo-400 cursor-pointer"
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Recursive Multi-Level File Tree */}
          <div className="flex-1 overflow-y-auto wt-scroll p-2 space-y-0.5">
            {fileTree.files.map((f) => renderFileRow(f, 0))}
            {fileTree.folders.map((folder) => renderFolderNode(folder, 0))}
          </div>

          <div className="p-2 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
            <span className="truncate">Drop files or folders</span>
            {!props.localFolderConnected && (
              <button
                type="button"
                onClick={props.onBindSaveToLocalFolder}
                className="text-cyan-300/80 hover:text-cyan-200 underline shrink-0 cursor-pointer"
              >
                Save to Disk
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OUTLINE */}
      {props.activeTab === "outline" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-2 border-b border-slate-800/70 flex flex-wrap gap-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "sections", label: "Sections" },
                { id: "floats", label: "Figs/Tabs" },
                { id: "labels", label: "Labels" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOutlineFilter(f.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                  outlineFilter === f.id
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                    : "border-slate-700/60 text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto wt-scroll p-2 space-y-1">
            {filteredOutline.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8 font-mono">
                No outline items yet.
              </div>
            ) : (
              filteredOutline.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() =>
                    props.onJumpToLocation(node.file, node.line, node.targetId)
                  }
                  style={{ paddingLeft: `${Math.min(node.level, 4) * 10 + 8}px` }}
                  className="w-full text-left py-1.5 pr-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="truncate">
                    {node.number && (
                      <span className="text-cyan-300 font-mono mr-1.5">
                        {node.number}
                      </span>
                    )}
                    {node.title || "(Untitled)"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    :{node.line}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SYMBOLS */}
      {props.activeTab === "symbols" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-2 border-b border-slate-800/70 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search symbols & snippets…"
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </div>

            {!symbolSearch && (
              <div className="flex flex-wrap gap-1">
                {SYMBOL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSymbolCat(cat.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                      symbolCat === cat.id
                        ? "bg-violet-500/25 border-violet-400/50 text-violet-200"
                        : "border-slate-700/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto wt-scroll p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {filteredSymbols.map((item) => {
                const renderedHtml = item.previewTex
                  ? katex.renderToString(item.previewTex, {
                      displayMode: false,
                      throwOnError: false,
                    })
                  : null;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => props.onInsertSymbol(item.insert, item.cursorOffset)}
                    title={`${item.description} — Click to insert ${item.label}`}
                    className={`p-2 rounded-lg bg-white/[0.03] hover:bg-indigo-500/20 border border-slate-700/50 hover:border-cyan-400/40 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      renderedHtml ? "min-h-[54px]" : "col-span-3 items-start px-2.5 min-h-[40px]"
                    }`}
                  >
                    {renderedHtml ? (
                      <>
                        <span
                          className="text-sm text-slate-100"
                          dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                        <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                          {item.label}
                        </span>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between text-left">
                        <span className="text-xs font-medium text-cyan-300">{item.label}</span>
                        <span className="text-[10px] text-slate-400 truncate ml-2">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
