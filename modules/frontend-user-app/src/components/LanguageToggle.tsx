import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4" />
      <span>{lang === "en" ? t.common.tamil : t.common.english}</span>
    </button>
  );
};

export default LanguageToggle;
