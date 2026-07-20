import React, { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If app is already installed, hide prompt
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isVisible) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in border-t border-border bg-card p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:bottom-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:rounded-xl lg:border lg:p-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/routex-logo.jpg" alt="RouteX" className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Install RouteX App</span>
            <span className="text-xs text-muted-foreground">For a faster, offline experience</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex min-h-[44px] min-w-[80px] items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
