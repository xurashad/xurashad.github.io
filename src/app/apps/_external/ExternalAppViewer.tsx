"use client";

import { useState } from "react";
import "./viewer.css";

interface Props {
  src: string;
  title: string;
  description: string;
  projectUrl: string;
  projectName: string;
  tags?: string[];
}

export default function ExternalAppViewer({
  src,
  title,
  description,
  projectUrl,
  projectName,
  tags = [],
}: Props) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="ev-root">
      {/* External App Banner */}
      {!bannerDismissed && (
        <div className="ev-banner">
          <div className="ev-banner-inner">
            <div className="ev-banner-icon">🔗</div>
            <div className="ev-banner-text">
              <strong>{title}</strong> is an external application created by{" "}
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-banner-link"
              >
                {projectName}
              </a>
              . It is embedded here for convenience and is not affiliated with this
              website.
            </div>
            <div className="ev-banner-actions">
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-btn ev-btn-outline"
              >
                ↗ Original Site
              </a>
              <button
                className="ev-btn ev-btn-dismiss"
                onClick={() => setBannerDismissed(true)}
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={src}
        title={title}
        allowFullScreen
        className="ev-iframe"
        loading="lazy"
      />

      {/* Corner badge when banner is dismissed */}
      {bannerDismissed && (
        <a
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ev-badge"
          title={`External app by ${projectName}`}
        >
          🔗 External
        </a>
      )}
    </div>
  );
}
