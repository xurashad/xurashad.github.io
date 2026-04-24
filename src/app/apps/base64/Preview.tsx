"use client";

interface PreviewProps {
  src: string;
  mimeType: string;
}

export function Preview({ src, mimeType }: PreviewProps) {
  if (!src || !mimeType) return null;

  const mediaType = mimeType.split("/")[0];

  switch (mediaType) {
    case "image":
      return (
        <img
          src={src}
          alt="Preview"
          className="max-w-full max-h-80 mx-auto rounded-xl object-contain"
        />
      );

    case "audio":
      return (
        <audio controls src={src} className="w-full rounded-lg">
          Your browser does not support the audio element.
        </audio>
      );

    case "video":
      return (
        <video
          controls
          src={src}
          className="max-w-full max-h-80 mx-auto rounded-xl"
        >
          Your browser does not support the video tag.
        </video>
      );

    case "text":
      return (
        <div className="text-left p-4 border border-white/10 rounded-xl bg-black/20 w-full">
          <p className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-2">
            Text Content
          </p>
          <p className="text-sm font-mono text-foreground/70 whitespace-pre-wrap break-words">
            {atob(src.split(",")[1] ?? "")}
          </p>
        </div>
      );

    default:
      return (
        <div className="text-center p-4 border border-crimson/30 rounded-xl bg-crimson/5 w-full">
          <p className="font-semibold text-crimson text-sm">Unsupported Preview</p>
          <p className="text-xs text-foreground/50 mt-1 mb-3">
            Cannot render a preview for type:{" "}
            <span className="font-mono text-foreground/70">{mimeType}</span>
          </p>
          <a
            href={src}
            download="decoded-file"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-quantum/30 bg-quantum/10 text-quantum hover:bg-quantum/20 transition-colors"
          >
            Download file instead
          </a>
        </div>
      );
  }
}
