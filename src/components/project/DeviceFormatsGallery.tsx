import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Lock, Smartphone } from "lucide-react";
import { DEVICE_DIMENSIONS } from "@/lib/image-resize";
import type { TFunction } from "i18next";

interface ResizedFormatSlide {
  slide_number: number;
  imageUrl: string;
  storagePath: string;
}

interface ProjectSlide {
  id: string;
  slide_number: number;
  image_url: string | null;
}

interface DeviceFormatsGalleryProps {
  activeFormatTab: string | null;
  onActiveFormatTabChange: (tab: string | null) => void;
  primaryFormat: string;
  primaryDimensions?: { width: number; height: number };
  additionalFormats: string[];
  formatLabels: Record<string, { label: string; icon: typeof Smartphone }>;
  resizedFormats: Record<string, ResizedFormatSlide[]>;
  slides: ProjectSlide[];
  getImageUrl: (slide: ProjectSlide) => string | null;
  isFreePlan: boolean;
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  regeneratingSlideId: string | null;
  onDownloadFormat: (format: string) => void;
  onResizeFormat: (format: string) => void;
  isResizing: boolean;
  t: TFunction;
}

export const DeviceFormatsGallery = ({
  activeFormatTab,
  onActiveFormatTabChange,
  primaryFormat,
  primaryDimensions,
  additionalFormats,
  formatLabels,
  resizedFormats,
  slides,
  getImageUrl,
  isFreePlan,
  selectedIndex,
  onSelectSlide,
  regeneratingSlideId,
  onDownloadFormat,
  onResizeFormat,
  isResizing,
  t,
}: DeviceFormatsGalleryProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 overflow-x-auto">
        <Button
          variant={activeFormatTab === null ? "default" : "ghost"}
          size="sm"
          className="rounded-lg text-xs shrink-0"
          onClick={() => onActiveFormatTabChange(null)}
        >
          <Smartphone className="h-3.5 w-3.5 mr-1.5" />
          {formatLabels[primaryFormat]?.label || primaryFormat}
          {primaryDimensions && <span className="ml-1 text-[10px] opacity-70">{primaryDimensions.width}&times;{primaryDimensions.height}</span>}
        </Button>
        {additionalFormats.map((format) => {
          const hasGenerated = !!resizedFormats[format]?.length;
          const FormatIcon = formatLabels[format]?.icon || Smartphone;
          const formatDimensions = DEVICE_DIMENSIONS[format];
          return (
            <div key={format} className="flex gap-1 shrink-0">
              {hasGenerated ? (
                <>
                  <Button
                    variant={activeFormatTab === format ? "default" : "ghost"}
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => onActiveFormatTabChange(format)}
                  >
                    <FormatIcon className="h-3.5 w-3.5 mr-1.5" />
                    {formatLabels[format]?.label || format}
                    {formatDimensions && <span className="ml-1 text-[10px] opacity-70">{formatDimensions.width}&times;{formatDimensions.height}</span>}
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg text-xs h-8 w-8 p-0" onClick={() => onDownloadFormat(format)}>
                    <Download className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs border-dashed"
                  onClick={() => onResizeFormat(format)}
                  disabled={isResizing}
                >
                  {isResizing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <FormatIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {formatLabels[format]?.label || format}
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">{slides.length} cr</Badge>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4">
        {activeFormatTab === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {slides.map((slide, index) => {
              const imageUrl = getImageUrl(slide);
              const locked = isFreePlan && index > 0;
              return (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => onSelectSlide(index)}
                  className={`relative ${primaryFormat.includes("ipad") ? "aspect-[3/4]" : "aspect-[9/16]"} rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group ${selectedIndex === index ? "border-primary ring-2 ring-primary/30 shadow-glow" : "border-border/50 hover:border-primary/40"}`}
                >
                  {imageUrl && !locked ? (
                    <img src={imageUrl} alt={`Slide ${slide.slide_number}`} className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      {locked ? (
                        <div className="flex flex-col items-center gap-1">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-bold">{t("common.upgrade")}</span>
                        </div>
                      ) : (
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                    <span className="text-[10px] font-black text-foreground">{slide.slide_number}</span>
                  </div>
                  {regeneratingSlideId === slide.id && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : resizedFormats[activeFormatTab] ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {resizedFormats[activeFormatTab].map((slide) => (
              <div
                key={slide.slide_number}
                className={`relative rounded-xl border-2 border-border/50 overflow-hidden ${activeFormatTab.includes("ipad") ? "aspect-[3/4]" : "aspect-[9/16]"}`}
              >
                <img src={slide.imageUrl} alt={`Slide ${slide.slide_number} - ${activeFormatTab}`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] font-black text-foreground">{slide.slide_number}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
