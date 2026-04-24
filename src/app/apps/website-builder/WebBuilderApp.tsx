"use client";

import { useReducer, useRef, useState, useCallback, useEffect } from "react";
import { builderReducer, createInitialState } from "./lib/reducer";
import type {
  SectionLayout,
  ElementType,
  ComponentType,
} from "./lib/types";

import { Topbar } from "./components/Topbar";
import { LeftSidebar } from "./components/LeftSidebar";
import { Canvas, type CanvasHandle } from "./components/Canvas";
import { RightSidebar } from "./components/RightSidebar";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { Toast } from "./components/Toast";

import "./builder.css";

/* ── toolbar state type ── */
interface ToolbarState {
  rteVisible: boolean;
  rtePos: { top: number; left: number };
  hoverBarVisible: boolean;
  hoverBarPos: { top: number; left: number };
  rowBarVisible: boolean;
  rowBarPos: { top: number; left: number };
}

const defaultToolbarState: ToolbarState = {
  rteVisible: false,
  rtePos: { top: 0, left: 0 },
  hoverBarVisible: false,
  hoverBarPos: { top: 0, left: 0 },
  rowBarVisible: false,
  rowBarPos: { top: 0, left: 0 },
};

export default function WebBuilderApp() {
  const [state, dispatch] = useReducer(builderReducer, undefined, createInitialState);
  const canvasHandleRef = useRef<CanvasHandle>(null);
  const [toolbars, setToolbars] = useState<ToolbarState>(defaultToolbarState);

  /* ── Force right sidebar re-render on selection change ── */
  const [rightKey, setRightKey] = useState(0);
  useEffect(() => {
    setRightKey((k) => k + 1);
  }, [state.selectedElDataId]);

  /* ── Toolbar update callback ── */
  const handleToolbarUpdate = useCallback(
    (update: ToolbarState | ((prev: ToolbarState) => ToolbarState)) => {
      if (typeof update === "function") {
        setToolbars(update);
      } else {
        setToolbars(update);
      }
    },
    []
  );

  /* ── Delegated callbacks to canvas imperative handle ── */
  const savePage = useCallback(() => {
    canvasHandleRef.current?.savePage();
  }, []);

  const addSection = useCallback(
    (layout: SectionLayout) => canvasHandleRef.current?.addSection(layout),
    []
  );
  const addRow = useCallback(
    (layout: SectionLayout) => canvasHandleRef.current?.addRow(layout),
    []
  );
  const addElement = useCallback(
    (type: ElementType) => canvasHandleRef.current?.addElement(type),
    []
  );
  const addSpacer = useCallback(
    () => canvasHandleRef.current?.addSpacer(),
    []
  );
  const insertComponent = useCallback(
    (type: ComponentType) => canvasHandleRef.current?.insertComponent(type),
    []
  );

  const getSelectedEl = useCallback(
    () => canvasHandleRef.current?.getSelectedEl() ?? null,
    []
  );

  return (
    <div className="wb" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* FontAwesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {/* Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap"
      />

      <Topbar
        state={state}
        dispatch={dispatch}
        canvasRef={canvasHandleRef.current?.canvasRef ?? { current: null }}
        headerRef={canvasHandleRef.current?.headerRef ?? { current: null }}
        footerRef={canvasHandleRef.current?.footerRef ?? { current: null }}
        mainRef={canvasHandleRef.current?.mainRef ?? { current: null }}
        onSavePage={savePage}
      />

      <div className="wb-shell">
        <LeftSidebar
          state={state}
          dispatch={dispatch}
          onAddSection={addSection}
          onAddRow={addRow}
          onAddElement={addElement}
          onAddSpacer={addSpacer}
          onInsertComponent={insertComponent}
          onSavePage={savePage}
        />

        <Canvas
          ref={canvasHandleRef}
          state={state}
          dispatch={dispatch}
          onToolbarUpdate={handleToolbarUpdate}
        />

        <RightSidebar
          key={rightKey}
          state={state}
          dispatch={dispatch}
          getSelectedEl={getSelectedEl}
          onSavePage={savePage}
        />
      </div>

      <FloatingToolbar
        rteVisible={toolbars.rteVisible}
        rtePos={toolbars.rtePos}
        onFormat={(cmd) => canvasHandleRef.current?.formatText(cmd)}
        onLink={() => canvasHandleRef.current?.linkText()}
        hoverBarVisible={toolbars.hoverBarVisible}
        hoverBarPos={toolbars.hoverBarPos}
        onMoveUp={() => canvasHandleRef.current?.moveEl("up")}
        onMoveDown={() => canvasHandleRef.current?.moveEl("down")}
        onDuplicate={() => canvasHandleRef.current?.duplicateEl()}
        onDelete={() => canvasHandleRef.current?.deleteEl()}
        rowBarVisible={toolbars.rowBarVisible}
        rowBarPos={toolbars.rowBarPos}
        onAddColumn={() => canvasHandleRef.current?.addColumn()}
        onRemoveColumn={() => canvasHandleRef.current?.removeColumn()}
        onToggleFullBleed={() => canvasHandleRef.current?.toggleFullBleed()}
        onDuplicateRow={() => canvasHandleRef.current?.duplicateEl()}
        onDeleteRow={() => canvasHandleRef.current?.deleteEl()}
      />

      <Toast toasts={state.toasts} />
    </div>
  );
}
