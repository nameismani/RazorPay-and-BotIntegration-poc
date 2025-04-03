"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function BotpressChat() {
  // This function will be called after the webchat scripts are loaded
  useEffect(() => {
    // The window.botpressWebChat object will be available after the scripts load
    const initWebchat = () => {
      if (window.botpress && !window.botpressInitialized) {
        window.botpressInitialized = true;
        window.botpress.init({
          // Replace with your bot's ID from Botpress dashboard
          botId: process.env.NEXT_PUBLIC_BOTPRESS_BOT_ID || "your-bot-id",
          // Optional configuration
          configuration: {
            botName: "AI Chatbot",
            // Customize the appearance
            color: "#FF6600", // Match to your theme color
            themeMode: "light",
            fontFamily: "Geist",
            // Additional customization
            radius: 1,
          },
          // Replace with your client ID if needed
          clientId: process.env.NEXT_PUBLIC_BOTPRESS_CLIENT_ID,
        });
      }
    };

    // Try to initialize if the script already loaded
    if (window.botpress) {
      initWebchat();
    }

    // Add event listener for when the webchat is ready
    window.addEventListener("botpress:ready", initWebchat);

    return () => {
      window.removeEventListener("botpress:ready", initWebchat);
    };
  }, []);

  return (
    <>
      {/* Load the Botpress webchat inject script */}
      <Script
        src="https://cdn.botpress.cloud/webchat/v2/inject.js"
        strategy="afterInteractive"
        onLoad={() => {
          // This event will be triggered when the script is loaded
          window.dispatchEvent(new Event("botpress:ready"));
        }}
      />
      {/* Load your bot-specific configuration script */}
      {/* Replace this URL with the URL provided in your Botpress dashboard */}
      {process.env.NEXT_PUBLIC_BOTPRESS_CONFIG_URL && (
        <Script
          src={process.env.NEXT_PUBLIC_BOTPRESS_CONFIG_URL}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
