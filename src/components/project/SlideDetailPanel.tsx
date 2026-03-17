import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, ImageDown, Loader2, Lock, Send, Sparkles, Wand2 } from "lucide-react";
import type { TFunction } from "i18next";

export interface SlideDetailPanelSlide {
  id: string;
  slide_number: number;
  headline: string | null;
  subheadline: string | null;
  objective: string | null;
  emphasis: string | null;
}

interface SlideDetailPanelProps {
  slide: SlideDetailPanelSlide;
  selectedImageUrl: string | null;
  isSlideLocked: boolean;
  isOpeningPortal: boolean;
  onUpgrade: () => void;
  selectedIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  primaryFormat: string;
  primaryDimensions?: { width: number; height: number };
  showRegenPrompt: boolean;
  regenPrompt: string;
  onRegenPromptChange: (value: string) => void;
  onToggleRegenPrompt: (open: boolean) => void;
  regeneratingSlideId: string | null;
  onRegenerateSelected: () => void;
  onDownloadSelected: () => void;
  t: TFunction;
}

export const SlideDetailPanel = ({
  slide,
  selectedImageUrl,
  isSlideLocked,
  isOpeningPortal,
  onUpgrade,
  selectedIndex,
  totalSlides,
  onPrevious,
  onNext,
  primaryFormat,
  primaryDimensions,
  showRegenPrompt,
  regenPrompt,
  onRegenPromptChange,
  onToggleRegenPrompt,
  regeneratingSlideId,
  onRegenerateSelected,
  onDownloadSelected,
  t,
}: SlideDetailPanelProps) => {
  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 w-full md:w-64">
          <div className={`w-full ${primaryFormat.includes("ipad") ? "aspect-[3/4]" : "aspect-[9/16]"} rounded-xl overflow-hidden border border-border bg-muted`}>
            {selectedImageUrl && !isSlideLocked ? (
              <img src={selectedImageUrl} alt={`Slide ${slide.slide_number}`} className="w-full h-full object-cover" />
            ) : isSlideLocked ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Lock className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">{t("results.upgradeToUnlock")}</p>
                <p className="text-xs text-muted-foreground">{t("results.freePreview")}</p>
                <Button size="sm" onClick={onUpgrade} disabled={isOpeningPortal} className="mt-2 rounded-xl">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {t("common.upgrade")}
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={selectedIndex === 0} onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-black text-muted-foreground">{selectedIndex + 1} / {totalSlides}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={selectedIndex === totalSlides - 1} onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-black text-foreground">{slide.headline || `Slide ${slide.slide_number}`}</h3>
            {slide.subheadline && <p className="text-sm text-muted-foreground mt-1">{slide.subheadline}</p>}
          </div>

          <div className="flex gap-2 flex-wrap">
            {slide.objective && <Badge variant="outline" className="text-xs">{slide.objective}</Badge>}
            {slide.emphasis && <Badge variant="outline" className="text-xs">{slide.emphasis}</Badge>}
            {primaryDimensions && (
              <Badge variant="secondary" className="text-xs font-mono">
                {primaryDimensions.width}&times;{primaryDimensions.height}px
              </Badge>
            )}
          </div>

          {!isSlideLocked && (
            <div className="space-y-3 pt-2">
              {selectedImageUrl && (
                <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={onDownloadSelected}>
                  <ImageDown className="mr-1.5 h-3.5 w-3.5" /> {t("results.saveSlide")}
                  {primaryDimensions && <span className="ml-1 text-[10px] opacity-60">{primaryDimensions.width}&times;{primaryDimensions.height}</span>}
                </Button>
              )}

              {showRegenPrompt ? (
                <div className="space-y-2">
                  <Textarea
                    value={regenPrompt}
                    onChange={(event) => onRegenPromptChange(event.target.value)}
                    placeholder={t("results.describeChanges")}
                    className="bg-card border-border text-sm min-h-[70px] resize-none rounded-xl p-3"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onRegenerateSelected} disabled={regeneratingSlideId === slide.id} className="rounded-lg">
                      {regeneratingSlideId === slide.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                      {t("results.regenerateCredit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onToggleRegenPrompt(false)} className="rounded-lg text-muted-foreground">
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onToggleRegenPrompt(true)} className="rounded-lg w-full">
                  <Wand2 className="mr-2 h-4 w-4 text-primary" /> {t("results.regeneratePrompt")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
