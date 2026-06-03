'use client';
// ============================================================
// Website Builder Pro — Client Wrapper (SSR-disabled)
// ============================================================

import dynamic from 'next/dynamic';

const WebBuilderApp = dynamic(() => import('./WebBuilderApp'), {
  ssr: false,
  loading: () => (
    <div className="wb-loading">
      <div className="wb-loading-spinner">
        <div className="wb-spinner"></div>
        <p>Loading WebBuilder Pro...</p>
      </div>
    </div>
  ),
});

export default function BuilderClient() {
  return <WebBuilderApp />;
}
