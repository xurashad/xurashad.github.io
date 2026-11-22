"use client";

import { useMemo, useRef, useState } from "react";
import {
  Blocks,
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
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  ListTree,
  RefreshCw,
  Search,
  Smile,
  Star,
  Trash2,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import { EMOJI_LIST, UNICODE_SYMBOL_GROUPS } from "../lib/emojis";
import { MARKDOWN_SNIPPETS } from "../lib/snippets";
import type { MarkdownFile, OutlineItem } from "../lib/types";

export interface LeftSidebarProps {
  files: MarkdownFile[];
  activeFilePath: string;
  mainFilePath: string;
  onSelectFile: (path: string) => void;
  onSetMainFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDuplicateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onUploadFiles: (files: FileList) => void;
  outline: OutlineItem[];
  onJumpToLine: (line: number) => void;
  onInsertSnippet: (snippet: string, cursorOffset?: number) => void;
  activeTab: "files" | "outline" | "blocks" | "emoji";
  onTabChange: (tab: "files" | "outline" | "blocks" | "emoji") => void;
  wordCount: number;
  wordGoal: number;
  tasksDone: number;
  tasksTotal: number;
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

interface FolderNode {
  name: string;
  fullPath: string;
  folders: FolderNode[];
  files: MarkdownFile[];
}

function buildFileTree(files: MarkdownFile[]): FolderNode {
  const root: FolderNode = { name: "", fullPath: "", folders: [], files: [] };
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

function FileIcon({ file }: { file: MarkdownFile }) {
  if (file.kind === "image") return <ImageIcon size={13} className="text-pink-400 shrink-0" />;
  if (file.kind === "md") return <FileText size={13} className="text-cyan-400 shrink-0" />;
  if (file.kind === "json" || file.kind === "yaml" || file.kind === "css") {
    return <FileCode2 size={13} className="text-violet-400 shrink-0" />;
  }
  return <FileText size={13} className="text-slate-400 shrink-0" />;
}

export function LeftSidebar(props: LeftSidebarProps) {
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileDraft, setNewFileDraft] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderDraft, setNewFolderDraft] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [outlineSearch, setOutlineSearch] = useState("");
  const [blockSearch, setBlockSearch] = useState("");
  const [blockCategory, setBlockCategory] = useState<string>("All");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [emojiCat, setEmojiCat] = useState<string>("All");
  const [insertUnicodeEmoji, setInsertUnicodeEmoji] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const dirUploadRef = useRef<HTMLInputElement>(null);

  const fileTree = useMemo(() => buildFileTree(props.files), [props.files]);

  const filteredOutline = useMemo(() => {
    const q = outlineSearch.trim().toLowerCase();
    if (!q) return props.outline;
    return props.outline.filter((h) => h.text.toLowerCase().includes(q));
  }, [props.outline, outlineSearch]);

  const blockCategories = useMemo(
    () => ["All", ...Array.from(new Set(MARKDOWN_SNIPPETS.map((s) => s.category)))],
    [],
  );

  const filteredBlocks = useMemo(() => {
    const q = blockSearch.trim().toLowerCase();
    return MARKDOWN_SNIPPETS.filter((s) => {
      if (blockCategory !== "All" && s.category !== blockCategory) return false;
      if (!q) return true;
      return `${s.title} ${s.desc} ${s.category}`.toLowerCase().includes(q);
    });
  }, [blockSearch, blockCategory]);

  const emojiCategories = useMemo(
    () => ["All", ...Array.from(new Set(EMOJI_LIST.map((e) => e.category)))],
    [],
  );

  const filteredEmojis = useMemo(() => {
    const q = emojiSearch.trim().toLowerCase();
    return EMOJI_LIST.filter((e) => {
      if (emojiCat !== "All" && e.category !== emojiCat) return false;
      if (!q) return true;
      return `${e.shortcode} ${e.keywords}`.toLowerCase().includes(q);
    });
  }, [emojiSearch, emojiCat]);

  const handleCreateFile = () => {
    const cleaned = newFileDraft.trim().replace(/^\/+/, "");
    if (!cleaned) return;
    const finalPath = cleaned.includes(".") ? cleaned : `${cleaned}.md`;
    props.onCreateFile(finalPath);
    setNewFileDraft("");
    setNewFileOpen(false);
  };

  const handleCreateFolder = () => {
    const cleaned = newFolderDraft.trim().replace(/^\/+|\/+$/g, "");
    if (!cleaned) return;
    props.onCreateFile(`${cleaned}/README.md`);
    setNewFolderDraft("");
    setNewFolderOpen(false);
  };

  const commitRename = (oldPath: string) => {
    const next = renameDraft.trim().replace(/^\/+/, "");
    setRenamingPath(null);
    if (next && next !== oldPath) {
      props.onRenameFile(oldPath, next);
    }
  };

  const renderFolder = (node: FolderNode, depth: number) => (
    <div key={node.fullPath || "root"}>
      {node.folders.map((folder) => {
        const collapsed = Boolean(collapsedFolders[folder.fullPath]);
        return (
          <div key={folder.fullPath}>
            <button
              type="button"
              onClick={() =>
                setCollapsedFolders((prev) => ({
                  ...prev,
                  [folder.fullPath]: !prev[folder.fullPath],
                }))
              }
              style={{ paddingLeft: `${8 + depth * 12}px` }}
              className="w-full flex items-center gap-1.5 py-1.5 pr-2 text-xs text-slate-300 hover:bg-white/[0.05] rounded-md cursor-pointer"
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <Folder size={13} className="text-amber-300/80 shrink-0" />
              <span className="truncate font-mono text-[11px]">{folder.name}</span>
            </button>
            {!collapsed && renderFolder(folder, depth + 1)}
          </div>
        );
      })}

      {node.files.map((file) => {
        const isActive = file.path === props.activeFilePath;
        const isMain = file.path === props.mainFilePath;
        const leaf = file.path.split("/").pop() ?? file.path;

        if (renamingPath === file.path) {
          return (
            <div
              key={file.id}
              style={{ paddingLeft: `${10 + depth * 12}px` }}
              className="py-1 pr-2 flex items-center gap-1"
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
                className="flex-1 px-1.5 py-0.5 text-xs font-mono rounded bg-slate-900 border border-cyan-400/60 text-white focus:outline-none"
              />
            </div>
          );
        }

        return (
          <div
            key={file.id}
            style={{ paddingLeft: `${10 + depth * 12}px` }}
            className={`group flex items-center justify-between gap-1 py-1.5 pr-1.5 rounded-lg text-xs transition-colors ${
              isActive
                ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/15 text-white border border-cyan-400/30"
                : "text-slate-300 hover:bg-white/[0.05] border border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => props.onSelectFile(file.path)}
              className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer"
            >
              <FileIcon file={file} />
              <span className="truncate font-mono text-[11.5px]">{leaf}</span>
              {isMain && (
                <Star
                  size={10}
                  className="text-amber-300 fill-amber-300 shrink-0"
                  aria-label="Primary file"
                />
              )}
            </button>

            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              {!isMain && file.kind === "md" && (
                <button
                  type="button"
                  onClick={() => props.onSetMainFile(file.path)}
                  title="Set as primary file"
                  className="p-1 text-slate-400 hover:text-amber-300 cursor-pointer"
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
                className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
              >
                <Edit3 size={11} />
              </button>
              <button
                type="button"
                onClick={() => props.onDuplicateFile(file.path)}
                title="Duplicate"
                className="p-1 text-slate-400 hover:text-violet-300 cursor-pointer"
              >
                <Copy size={11} />
              </button>
              {props.files.length > 1 && (
                <button
                  type="button"
                  onClick={() => props.onDeleteFile(file.path)}
                  title="Delete file"
                  className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const goalPct =
    props.wordGoal > 0 ? Math.min(100, Math.round((props.wordCount / props.wordGoal) * 100)) : 0;

  return (
    <aside className="md-sidebar w-full h-full flex flex-col overflow-hidden select-none">
      {/* Tabs */}
      <div className="grid grid-cols-4 gap-0.5 p-1.5 border-b border-slate-700/60 bg-black/25">
        {(
          [
            { id: "files", label: "Files", icon: Folder },
            { id: "outline", label: "Outline", icon: ListTree },
            { id: "blocks", label: "Blocks", icon: Blocks },
            { id: "emoji", label: "Emoji", icon: Smile },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = props.activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => props.onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-violet-500/20 text-cyan-200 border border-cyan-400/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* FILES TAB */}
      {props.activeTab === "files" && (
        <div
          className={`flex-1 flex flex-col overflow-hidden ${isDraggingOver ? "ring-2 ring-cyan-400/60 ring-inset" : ""}`}
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
          {/* Toolbar */}
          <div className="px-2.5 py-2 border-b border-slate-800/80 flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Workspace ({props.files.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setNewFileOpen((v) => !v);
                  setNewFolderOpen(false);
                }}
                title="New File"
                className="p-1 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-cyan-300 cursor-pointer"
              >
                <FilePlus size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewFolderOpen((v) => !v);
                  setNewFileOpen(false);
                }}
                title="New Folder"
                className="p-1 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-amber-300 cursor-pointer"
              >
                <FolderPlus size={13} />
              </button>
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                title="Upload Markdown, HTML, or Image Files"
                className="p-1 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-violet-300 cursor-pointer"
              >
                <Upload size={13} />
              </button>
              <input
                ref={uploadRef}
                type="file"
                multiple
                accept=".md,.markdown,.mdx,.txt,.html,.htm,.json,.yaml,.yml,.css,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    props.onUploadFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>

          {newFileOpen && (
            <div className="p-2 border-b border-slate-800 bg-slate-900/70 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="docs/guide.md"
                value={newFileDraft}
                onChange={(e) => setNewFileDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                  if (e.key === "Escape") setNewFileOpen(false);
                }}
                className="flex-1 px-2 py-1 text-xs font-mono rounded bg-black/50 border border-cyan-400/50 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateFile}
                className="p-1 rounded bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/35 cursor-pointer"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {newFolderOpen && (
            <div className="p-2 border-b border-slate-800 bg-slate-900/70 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="folder-name"
                value={newFolderDraft}
                onChange={(e) => setNewFolderDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setNewFolderOpen(false);
                }}
                className="flex-1 px-2 py-1 text-xs font-mono rounded bg-black/50 border border-amber-400/50 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                className="p-1 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 cursor-pointer"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto md-scroll p-1.5 space-y-0.5">
            {renderFolder(fileTree, 0)}
          </div>

          {/* Local Disk Sync Panel */}
          <div className="p-2.5 border-t border-slate-800/80 bg-black/25 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <HardDrive size={11} className="text-emerald-400" />
                Local Folder
              </span>
              {props.localFolderConnected && (
                <span className="text-emerald-400">Live Sync</span>
              )}
            </div>

            {props.localFolderConnected ? (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-emerald-200 truncate">
                  {props.localFolderName}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={props.onReloadFromLocalFolder}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Reload
                  </button>
                  <button
                    type="button"
                    onClick={props.onDisconnectLocalFolder}
                    className="p-1 rounded-md text-amber-300 hover:bg-amber-500/15 cursor-pointer"
                    title="Disconnect Folder"
                  >
                    <Unlink size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {props.hasReconnectHandle && (
                  <button
                    type="button"
                    onClick={props.onReconnectLocalFolder}
                    className="w-full py-1 px-2 rounded-md text-[11px] bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    Reconnect &ldquo;{props.localFolderName}&rdquo;
                  </button>
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (props.fsAccessSupported) props.onOpenLocalFolder();
                      else dirUploadRef.current?.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                  >
                    <FolderOpen size={11} /> Open
                  </button>
                  {props.fsAccessSupported && (
                    <button
                      type="button"
                      onClick={props.onBindSaveToLocalFolder}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 cursor-pointer"
                    >
                      Save Here
                    </button>
                  )}
                </div>
                <input
                  ref={dirUploadRef}
                  type="file"
                  multiple
                  {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      props.onFallbackDirectoryFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            )}

            <p className="text-[10px] text-slate-500 text-center">
              Drop files or images anywhere above
            </p>
          </div>
        </div>
      )}

      {/* OUTLINE TAB */}
      {props.activeTab === "outline" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter headings…"
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-black/40 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <button
              type="button"
              onClick={() => props.onInsertSnippet("[[TOC]]\n\n")}
              className="w-full py-1 px-2 rounded-lg text-[11px] font-medium bg-cyan-500/12 border border-cyan-400/25 text-cyan-200 hover:bg-cyan-500/22 cursor-pointer"
            >
              + Insert [[TOC]] Block
            </button>
          </div>

          <div className="flex-1 overflow-y-auto md-scroll p-2 space-y-0.5">
            {filteredOutline.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No headings found. Add <code className="text-cyan-300"># Title</code> in the editor.
              </div>
            ) : (
              filteredOutline.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => props.onJumpToLine(item.line)}
                  style={{ paddingLeft: `${8 + (item.level - 1) * 10}px` }}
                  className="w-full flex items-center justify-between gap-2 py-1.5 pr-2 rounded-lg text-left text-xs text-slate-300 hover:bg-white/[0.06] hover:text-cyan-200 cursor-pointer"
                >
                  <span className="truncate">
                    <span className="text-[10px] font-mono text-violet-400/80 mr-1.5">
                      H{item.level}
                    </span>
                    {item.text}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    :{item.line}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Goal & Task Mini Meters */}
          <div className="p-2.5 border-t border-slate-800/80 bg-black/25 space-y-2 text-[11px]">
            {props.wordGoal > 0 && (
              <div>
                <div className="flex justify-between text-slate-400 font-mono mb-1">
                  <span>Word Goal</span>
                  <span>
                    {props.wordCount} / {props.wordGoal} ({goalPct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
              </div>
            )}
            {props.tasksTotal > 0 && (
              <div className="flex justify-between text-slate-400 font-mono">
                <span>Tasks</span>
                <span className="text-emerald-300">
                  {props.tasksDone} / {props.tasksTotal} done
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOCKS TAB */}
      {props.activeTab === "blocks" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search blocks…"
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-black/40 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <select
              value={blockCategory}
              onChange={(e) => setBlockCategory(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded-lg bg-black/40 border border-slate-700/70 text-slate-200 focus:outline-none"
            >
              {blockCategories.map((c) => (
                <option key={c} value={c} className="bg-[#0b0d1f]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto md-scroll p-2 space-y-1.5">
            {filteredBlocks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => props.onInsertSnippet(b.snippet, b.cursorOffset)}
                className="w-full text-left p-2 rounded-xl border border-slate-700/50 bg-white/[0.03] hover:bg-violet-500/15 hover:border-cyan-400/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-slate-100">{b.title}</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300">
                    {b.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{b.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EMOJI & SYMBOLS TAB */}
      {props.activeTab === "emoji" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search emoji (:rocket:)…"
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-black/40 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={emojiCat}
                onChange={(e) => setEmojiCat(e.target.value)}
                className="flex-1 px-2 py-1 text-[11px] rounded-lg bg-black/40 border border-slate-700/70 text-slate-200 focus:outline-none"
              >
                {emojiCategories.map((c) => (
                  <option key={c} value={c} className="bg-[#0b0d1f]">
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setInsertUnicodeEmoji((v) => !v)}
                title="Toggle inserting :shortcode: vs Unicode emoji"
                className="px-2 py-1 text-[10px] font-mono rounded-lg border border-slate-700/70 bg-white/[0.04] text-cyan-300 hover:bg-white/[0.08] cursor-pointer shrink-0"
              >
                {insertUnicodeEmoji ? "Char" : ":code:"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto md-scroll p-2 space-y-3">
            <div className="grid grid-cols-5 gap-1">
              {filteredEmojis.map((em) => (
                <button
                  key={em.shortcode}
                  type="button"
                  title={`:${em.shortcode}:`}
                  onClick={() =>
                    props.onInsertSnippet(
                      insertUnicodeEmoji ? `${em.emoji} ` : `:${em.shortcode}: `,
                    )
                  }
                  className="h-9 rounded-lg border border-transparent hover:border-cyan-400/40 hover:bg-white/[0.08] flex items-center justify-center text-lg cursor-pointer transition-colors"
                >
                  {em.emoji}
                </button>
              ))}
            </div>

            {!emojiSearch && emojiCat === "All" && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {UNICODE_SYMBOL_GROUPS.map((grp) => (
                  <div key={grp.id}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      {grp.label}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {grp.items.map((sym) => (
                        <button
                          key={sym.char}
                          type="button"
                          title={sym.label}
                          onClick={() => props.onInsertSnippet(sym.char)}
                          className="h-8 rounded-lg border border-slate-800 bg-white/[0.03] hover:border-violet-400/45 hover:bg-violet-500/15 text-sm text-slate-200 flex items-center justify-center cursor-pointer"
                        >
                          {sym.char}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
