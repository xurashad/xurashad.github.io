'use client';
// ============================================================
// Website Builder Pro — Site Audit Modal (SEO & Accessibility)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import { auditProject, type AuditCategory, type AuditIssue } from '../lib/audit';

interface SiteAuditModalProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onScrollToTarget: (targetId: string) => void;
}

export default function SiteAuditModal({ state, dispatch, onScrollToTarget }: SiteAuditModalProps) {
  if (!state.showAuditModal) return null;
  return <SiteAuditInner state={state} dispatch={dispatch} onScrollToTarget={onScrollToTarget} />;
}

function SiteAuditInner({ state, dispatch, onScrollToTarget }: SiteAuditModalProps) {
  const [filter, setFilter] = useState<'all' | AuditCategory>('all');
  const report = useMemo(() => auditProject(state.project), [state.project]);

  const close = () => dispatch({ type: 'SHOW_AUDIT_MODAL', payload: { show: false } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredIssues = useMemo(
    () => (filter === 'all' ? report.issues : report.issues.filter(i => i.category === filter)),
    [report.issues, filter],
  );

  const handleJump = (issue: AuditIssue) => {
    if (issue.pageId && issue.pageId !== state.currentPageId) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: issue.pageId } });
    }
    if (issue.targetId && issue.targetType) {
      const tid = issue.targetId;
      const ttype = issue.targetType;
      setTimeout(() => {
        dispatch({ type: 'SELECT', payload: { id: tid, target: ttype } });
        onScrollToTarget(tid);
      }, 60);
    } else if (issue.pageId) {
      dispatch({ type: 'SET_LEFT_TAB', payload: { tab: 'pages' } });
    }
    close();
  };

  const scoreColor = report.score >= 85 ? '#22c55e' : report.score >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 34;
  const strokeOffset = circumference - (report.score / 100) * circumference;

  return (
    <div className="wb-modal-overlay" onClick={close}>
      <div className="wb-modal wb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: scoreColor }} />
            <h2>Site Audit — SEO & Accessibility</h2>
          </div>
          <button type="button" className="wb-modal-close" onClick={close}><X size={18} /></button>
        </div>

        <div className="wb-modal-body">
          <div className="wb-audit-summary">
            <div className="wb-audit-ring-wrap">
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="34" fill="none" stroke="var(--wb-border)" strokeWidth="7" />
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 42 42)"
                />
              </svg>
              <span className="wb-audit-score" style={{ color: scoreColor }}>{report.score}</span>
            </div>

            <div className="wb-audit-stats">
              <h3>{report.score >= 90 ? 'Ready to Ship!' : report.score >= 70 ? 'Good Foundation' : 'Needs Attention'}</h3>
              <p>Scanned {state.project.pageOrder.length} page(s) across SEO, accessibility, structure, and asset weight.</p>
              <div className="wb-audit-chips">
                <span className="wb-chip err">{report.counts.error} Errors</span>
                <span className="wb-chip warn">{report.counts.warning} Warnings</span>
                <span className="wb-chip info">{report.counts.info} Tips</span>
              </div>
            </div>
          </div>

          <div className="wb-audit-filters">
            {(['all', 'seo', 'accessibility', 'structure', 'performance'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                className={filter === cat ? 'active' : ''}
                onClick={() => setFilter(cat)}
              >
                {cat === 'all' ? `All (${report.issues.length})` : cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="wb-audit-list">
            {filteredIssues.map(issue => (
              <div
                key={issue.id}
                className={`wb-audit-item ${issue.severity} ${issue.targetId || issue.pageId ? 'clickable' : ''}`}
                onClick={() => (issue.targetId || issue.pageId) && handleJump(issue)}
              >
                <span className="wb-audit-item-icon">
                  {issue.severity === 'error' ? <AlertCircle size={16} /> : issue.severity === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                </span>
                <div className="wb-audit-item-body">
                  <div className="wb-audit-item-title">
                    <span>{issue.title}</span>
                    <span className="wb-audit-cat">{issue.category}</span>
                  </div>
                  <p>{issue.detail}</p>
                </div>
                {(issue.targetId || issue.pageId) && (
                  <span className="wb-audit-jump"><ArrowRight size={14} /></span>
                )}
              </div>
            ))}
            {filteredIssues.length === 0 && (
              <div className="wb-pm-empty">
                <p>No issues found in this category!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
