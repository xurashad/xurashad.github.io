"use client";

import React from "react";

interface ToolbarPos {
  top: number;
  left: number;
}

interface Props {
  /* RTE */
  rteVisible: boolean;
  rtePos: ToolbarPos;
  onFormat: (cmd: string) => void;
  onLink: () => void;

  /* Element hover bar */
  hoverBarVisible: boolean;
  hoverBarPos: ToolbarPos;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;

  /* Row/Section bar */
  rowBarVisible: boolean;
  rowBarPos: ToolbarPos;
  onAddColumn: () => void;
  onRemoveColumn: () => void;
  onToggleFullBleed: () => void;
  onDuplicateRow: () => void;
  onDeleteRow: () => void;
}

export function FloatingToolbar({
  rteVisible,
  rtePos,
  onFormat,
  onLink,
  hoverBarVisible,
  hoverBarPos,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  rowBarVisible,
  rowBarPos,
  onAddColumn,
  onRemoveColumn,
  onToggleFullBleed,
  onDuplicateRow,
  onDeleteRow,
}: Props) {
  return (
    <>
      {/* Rich Text Editing toolbar */}
      {rteVisible && (
        <div
          className="wb-floating-toolbar"
          style={{ top: rtePos.top, left: rtePos.left }}
        >
          <button onClick={() => onFormat("bold")} title="Bold">
            <i className="fas fa-bold" />
          </button>
          <button onClick={() => onFormat("italic")} title="Italic">
            <i className="fas fa-italic" />
          </button>
          <button onClick={() => onFormat("underline")} title="Underline">
            <i className="fas fa-underline" />
          </button>
          <button
            onClick={() => onFormat("strikeThrough")}
            title="Strikethrough"
          >
            <i className="fas fa-strikethrough" />
          </button>
          <div className="wb-toolbar-sep" />
          <button onClick={() => onFormat("justifyLeft")} title="Align Left">
            <i className="fas fa-align-left" />
          </button>
          <button
            onClick={() => onFormat("justifyCenter")}
            title="Align Center"
          >
            <i className="fas fa-align-center" />
          </button>
          <button
            onClick={() => onFormat("justifyRight")}
            title="Align Right"
          >
            <i className="fas fa-align-right" />
          </button>
          <div className="wb-toolbar-sep" />
          <button onClick={onLink} title="Insert Link">
            <i className="fas fa-link" />
          </button>
          <button
            onClick={() => onFormat("removeFormat")}
            title="Clear Formatting"
          >
            <i className="fas fa-eraser" />
          </button>
        </div>
      )}

      {/* Element toolbar */}
      {hoverBarVisible && (
        <div
          className="wb-floating-toolbar"
          style={{ top: hoverBarPos.top, left: hoverBarPos.left }}
        >
          <button onClick={onMoveUp} title="Move Up">
            <i className="fas fa-arrow-up" />
          </button>
          <button onClick={onMoveDown} title="Move Down">
            <i className="fas fa-arrow-down" />
          </button>
          <div className="wb-toolbar-sep" />
          <button onClick={onDuplicate} title="Duplicate (Ctrl+D)">
            <i className="fas fa-clone" />
          </button>
          <button
            onClick={onDelete}
            title="Delete (Del)"
            style={{ color: "var(--wb-danger)" }}
          >
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      )}

      {/* Row/Section toolbar */}
      {rowBarVisible && (
        <div
          className="wb-floating-toolbar wb-row-toolbar"
          style={{ top: rowBarPos.top, left: rowBarPos.left }}
        >
          <span className="wb-tb-label">Section</span>
          <button onClick={onAddColumn} title="Add Column">
            <i className="fas fa-plus" />
          </button>
          <button onClick={onRemoveColumn} title="Remove Column">
            <i className="fas fa-minus" />
          </button>
          <div className="wb-toolbar-sep" />
          <button onClick={onToggleFullBleed} title="Toggle Full Width">
            <i className="fas fa-expand-arrows-alt" />
          </button>
          <div className="wb-toolbar-sep" />
          <button onClick={onDuplicateRow} title="Duplicate">
            <i className="fas fa-clone" />
          </button>
          <button
            onClick={onDeleteRow}
            title="Delete"
            style={{ color: "var(--wb-danger)" }}
          >
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      )}
    </>
  );
}
