// ============================================================
// Website Builder Pro — Editor Layout (hides parent site chrome)
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebBuilder Pro — Editor",
  description:
    "Professional drag-and-drop website builder editor.",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide parent site nav/footer */
            body > div > nav,
            body > div > header,
            body > div > footer,
            body header.fixed,
            body header.sticky,
            body nav.fixed,
            body nav.sticky,
            [class*="navbar"],
            [class*="Navbar"],
            .site-footer,
            body > div > div > nav,
            body > div > div > header,
            body > div > div > footer,
            footer {
              display: none !important;
            }
            main.flex-1,
            main[class*="pt-"] {
              padding: 0 !important;
              margin: 0 !important;
              flex: none !important;
            }
            html, body {
              overflow: hidden !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body > div {
              height: 100vh !important;
              display: flex !important;
              flex-direction: column !important;
            }
          `,
        }}
      />
      {/* Kill any background music/audio that auto-plays from the parent site */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              // Stop all existing audio elements
              document.querySelectorAll('audio').forEach(function(a){a.pause();a.src='';});
              // Override Audio constructor to prevent new audio from playing
              var _OrigAudio = window.Audio;
              var _blocked = true;
              window.Audio = function(){
                var a = new _OrigAudio();
                if(_blocked){a.volume=0;var _play=a.play.bind(a);a.play=function(){return Promise.resolve();};}
                return a;
              };
              window.Audio.prototype = _OrigAudio.prototype;
              // Also kill any audio that gets created after a short delay
              setTimeout(function(){
                document.querySelectorAll('audio').forEach(function(a){a.pause();a.src='';a.remove();});
              }, 100);
              setTimeout(function(){
                document.querySelectorAll('audio').forEach(function(a){a.pause();a.src='';a.remove();});
              }, 1000);
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
