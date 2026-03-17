import { Button } from "@/components/ui/button";
import { FolderOpen, LayoutGrid, Sparkles, Save, Loader2 } from "lucide-react";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";

export const StepReview = () => {
  const { t } = useTranslation();
  const {
    appName, platform, selectedTone, selectedTemplate, deviceFormats,
    slideCount, uploadedScreens, brandAssets, consistencyLevel,
    outputLanguage, slides,
    isSaving, handleSaveDraft, handleGenerate,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.review.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.review.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-[120px] pointer-events-none transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-110" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" /> {t("step.review.projectSummary")}
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground font-medium">
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.app")}</span> <span className="font-bold text-foreground">{appName || t("step.review.notSet")}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.platform")}</span> <span className="font-bold text-foreground capitalize">{platform}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.tone")}</span> <span className="font-bold text-foreground capitalize">{selectedTone}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.template")}</span> <span className="font-bold text-foreground">{selectedTemplate || t("step.review.notSelected")}</span></div>
            {(platform === 'ios' || platform === 'both') && (
              <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.formats")}</span> <span className="font-bold text-foreground">{deviceFormats.join(', ')}</span></div>
            )}
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.slides")}</span> <span className="font-bold text-foreground">{slideCount}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.screens")}</span> <span className="font-bold text-foreground">{uploadedScreens.length} {t("step.review.uploaded")}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.brandAssets")}</span> <span className="font-bold text-foreground">{brandAssets.length} {t("step.review.uploaded")}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>{t("step.review.consistency")}</span> <span className="font-bold text-foreground capitalize">{consistencyLevel}</span></div>
            <div className="flex justify-between pb-1"><span>{t("step.review.outputLanguage")}</span> <span className="font-bold text-foreground">{outputLanguage.toUpperCase()}</span></div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 hover:border-primary/30 transition-all duration-500">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" /> {t("step.review.slideHeadlines")}
          </h3>
          <div className="space-y-3">
            {slides.map(s => (
              <div key={s.id} className="flex items-start gap-4 text-sm p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <span className="text-primary font-black bg-primary/10 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner border border-primary/20">{s.number}</span>
                <div className="flex-1 pt-1">
                  <span className="text-foreground/90 font-bold tracking-tight">{s.headline || <span className="text-foreground/30 italic">{t("step.review.noHeadline")}</span>}</span>
                  {s.subheadline && <p className="text-foreground/50 text-xs mt-0.5">{s.subheadline}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="flex gap-4 pt-8 mt-8 border-t border-border">
        <Button variant="outline" size="lg" onClick={handleSaveDraft} disabled={isSaving} className="h-16 rounded-2xl text-lg font-bold border-border hover:border-primary/40 px-8">
          <Save className="mr-3 h-5 w-5" /> {t("step.review.saveDraft")}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-16 rounded-2xl text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:-translate-y-1.5 transition-all duration-300"
          disabled={isSaving}
          onClick={handleGenerate}
        >
          {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Sparkles className="mr-3 h-6 w-6" />}
          {isSaving ? t("step.review.preparing") : t("step.review.generate")}
        </Button>
      </div>
    </div>
  );
};
