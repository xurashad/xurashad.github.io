'use client';
// ============================================================
// Website Builder Pro — Toast Notifications
// ============================================================

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ToastMessage, BuilderAction } from '../lib/types';

interface ToastProps {
  toasts: ToastMessage[];
  dispatch: React.Dispatch<BuilderAction>;
}

export default function Toast({ toasts, dispatch }: ToastProps) {
  return (
    <div className="wb-toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} dispatch={dispatch} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dispatch }: { toast: ToastMessage; dispatch: React.Dispatch<BuilderAction> }) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: { toastId: toast.id } });
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, dispatch]);

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className={`wb-toast wb-toast-${toast.type}`}>
      <span className="wb-toast-icon">{icons[toast.type]}</span>
      <span className="wb-toast-message">{toast.message}</span>
      {toast.action && (
        <button className="wb-toast-action" onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
      <button className="wb-toast-close" onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: { toastId: toast.id } })}>
        <X size={14} />
      </button>
      {toast.duration > 0 && (
        <div className="wb-toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
      )}
    </div>
  );
}
