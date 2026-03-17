import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Download, Globe, Loader2 } from "lucide-react";
import { DEVICE_DIMENSIONS } from "@/lib/image-resize";
import { LANGUAGE_LABELS } from "@/lib/localization";
import type { TFunction } from "i18next";

export interface SavedTranslation {
  id: string;
  slide_number: number;
  target_language: string;
  source_language: string;
  storage_path: string;
  device_format: string;
  created_at: string;
  signedUrl?: string;
}

interface TranslationsSectionProps {
  translationLanguages: string[];
  savedTranslations: SavedTranslation[];
  translationsByLangFormat: Record<string, SavedTranslation[]>;
  expandedLang: string | null;
  onToggleLanguage: (lang: string) => void;
  onDownloadLanguageZip: (lang: string) => void;
  onDownloadTranslation: (translation: SavedTranslation) => void;
  t: TFunction;
}

const FORMAT_SHORT: Record<string, string> = {
  "iphone-6-5": '6.5"',
  "iphone-6-9": '6.9"',
  "ipad-12-9": '12.9" iPad',
};

export const TranslationsSection = ({
  translationLanguages,
  savedTranslations,
  translationsByLangFormat,
  expandedLang,
  onToggleLanguage,
  onDownloadLanguageZip,
  onDownloadTranslation,
  t,
}: TranslationsSectionProps) => {
  if (translationLanguages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6">
      <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" /> {t("results.translations")}
      </h3>
      <div className="space-y-3">
        {translationLanguages.map((lang) => {
          const langTranslations = savedTranslations.filter((translation) => translation.target_language === lang);
          const langFormats = [...new Set(langTranslations.map((translation) => translation.device_format || "iphone-6-5"))];

          return (
            <div key={lang} className="border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => onToggleLanguage(lang)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">{LANGUAGE_LABELS[lang] || lang}</span>
                  <Badge variant="outline" className="text-xs">{t("results.slides", { count: langTranslations.length })}</Badge>
                  {langFormats.length > 1 && <Badge variant="outline" className="text-xs">{t("results.sizes", { count: langFormats.length })}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 rounded-lg"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDownloadLanguageZip(lang);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> {t("results.zip")}
                  </Button>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedLang === lang ? "rotate-90" : ""}`} />
                </div>
              </button>
              <AnimatePresence>
                {expandedLang === lang && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-4">
                      {langFormats.map((format) => {
                        const formatKey = `${lang}|||${format}`;
                        const formatTranslations = translationsByLangFormat[formatKey] || [];
                        const isIpad = format.includes("ipad");
                        const formatDimensions = DEVICE_DIMENSIONS[format];

                        return (
                          <div key={format}>
                            {langFormats.length > 1 && (
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-[10px] font-bold">{FORMAT_SHORT[format] || format}</Badge>
                                {formatDimensions && <span className="text-[10px] text-muted-foreground font-mono">{formatDimensions.width}&times;{formatDimensions.height}</span>}
                                <span className="text-[10px] text-muted-foreground">{t("results.slides", { count: formatTranslations.length })}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                              {formatTranslations.map((translation) => (
                                <div key={translation.id} className={`relative group rounded-lg overflow-hidden border border-border/50 ${isIpad ? "aspect-[3/4]" : "aspect-[9/16]"}`}>
                                  {translation.signedUrl ? (
                                    <img
                                      src={translation.signedUrl}
                                      alt={`Slide ${translation.slide_number} - ${lang} - ${format}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => onDownloadTranslation(translation)}
                                    className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <Download className="h-5 w-5 text-foreground" />
                                  </button>
                                  <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1 py-0.5 text-[10px] font-bold">{translation.slide_number}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
