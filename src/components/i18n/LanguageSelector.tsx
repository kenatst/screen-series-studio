import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UI_LANGUAGE_OPTIONS, normalizeUiLanguage } from "@/lib/ui-languages";

interface LanguageSelectorProps {
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export const LanguageSelector = ({
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = useMemo(() => {
    const normalized = normalizeUiLanguage(i18n.resolvedLanguage ?? i18n.language);
    return UI_LANGUAGE_OPTIONS.find((language) => language.code === normalized) ?? UI_LANGUAGE_OPTIONS[0];
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("common.selectLanguage")}
        className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md ${buttonClassName}`}
      >
        <Globe className="h-4 w-4" />
        <span>
          {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 ${menuClassName}`}
          >
            {UI_LANGUAGE_OPTIONS.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => {
                  void i18n.changeLanguage(language.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-white/5 ${currentLanguage.code === language.code ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground"}`}
              >
                <span className="text-lg">{language.flag}</span>
                {language.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
