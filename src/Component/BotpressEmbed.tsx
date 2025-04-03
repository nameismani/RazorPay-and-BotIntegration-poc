"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function BotpressEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize when scripts are loaded
    const initEmbeddedWebchat = () => {
      if (window.botpress && containerRef.current) {
        window.botpress.init({
          botId: process.env.NEXT_PUBLIC_BOTPRESS_BOT_ID,
          configuration: {
            // Your configuration
            themeMode: "light",
            fontFamily: "Geist",
          },
        });

        // Open the chatbot automatically when ready
        window.botpress.on("webchat:ready", () => {
          window.botpress.open();
        });
      }
    };

    if (window.botpress) {
      initEmbeddedWebchat();
    }

    window.addEventListener("botpress:ready", initEmbeddedWebchat);
    return () => {
      window.removeEventListener("botpress:ready", initEmbeddedWebchat);
    };
  }, []);

  return (
    <>
      <div
        id="webchat-container"
        ref={containerRef}
        className="relative w-full h-full"
      >
        <Script
          src="https://cdn.botpress.cloud/webchat/v2/inject.js"
          strategy="afterInteractive"
          onLoad={() => {
            window.dispatchEvent(new Event("botpress:ready"));
          }}
        />
        <style jsx>{`
          #webchat-container {
            position: relative;
            width: 100%;
            height: 500px; /* Adjust as needed */
          }
          :global(.bpFab) {
            display: none;
          }
          :global(.bpWebchat) {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>
      </div>
    </>
  );
}
