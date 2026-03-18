import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, LayoutGrid, Upload, Lock, Loader2, Brain, Trash2 } from "lucide-react";
import { templateMoods } from "@/lib/demo-data";
import { templatePreviews } from "@/constants/templates";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useBilling } from "@/hooks/useBilling";
import { useSearchParams } from "react-router-dom";
import { useTemplateRecommendations } from "@/hooks/useTemplateRecommendations";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export const StepStyle = () => {
  const { t } = useTranslation();
  const {
    selectedTemplate, setSelectedTemplate,
    templateMoodFilter, setTemplateMoodFilter,
    templateCategoryFilter, setTemplateCategoryFilter,
    filteredTemplates, templateCategories,
    profile, handleSaveDraft,
    uploadedScreens, brandAssets, appName, appDescription,
    referenceMockups, handleReferenceUpload, removeReferenceMockup, referenceInputRef,
    inspirationText, setInspirationText,
    selectedTone, appCategory, targetAudience, primaryGoal,
  } = useNewProject();

  const { handleUpgrade } = useBilling();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const isFree = profile?.plan === "free";

  const { recommendations, isLoading: isLoadingRecs, fetchRecommendations } = useTemplateRecommendations();
  const lastFingerprintRef = useRef<string>("");

  useEffect(() => {
    const run = async () => {
      const primaryImages = [...uploadedScreens.map((s) => s.file), ...referenceMockups.map((r) => r.file)].slice(0, 3);
      const logoFile = brandAssets.find((a) => a.type === "logo")?.file;
      const hasAnyInput = Boolean(primaryImages.length || logoFile || inspirationText?.trim() || appDescription?.trim() || appName?.trim());
      if (!hasAnyInput) return;

      const fingerprint = JSON.stringify({
        images: primaryImages.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
        logo: logoFile ? `${logoFile.name}-${logoFile.size}-${logoFile.lastModified}` : "",
        inspirationText,
        appName,
        appDescription,
        selectedTone,
        appCategory,
        targetAudience,
        primaryGoal,
      });

      if (lastFingerprintRef.current === fingerprint) return;
      lastFingerprintRef.current = fingerprint;

      const screenshotUrls = await Promise.all(primaryImages.map((f) => toDataUrl(f)));
      const logoUrl = logoFile ? await toDataUrl(logoFile) : undefined;

      await fetchRecommendations({
        screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
        logoUrl,
        inspirationText: inspirationText?.trim() || undefined,
        appName: appName || undefined,
        appDescription: appDescription || undefined,
        contextText: `Tone: ${selectedTone || ""}. Category: ${appCategory || ""}. Audience: ${targetAudience || ""}. Goal: ${primaryGoal || ""}. Selected template: ${selectedTemplate || "none"}.`,
      });
    };

    run().catch(() => undefined);
  }, [
    uploadedScreens,
    referenceMockups,
    brandAssets,
    inspirationText,
    appName,
    appDescription,
    selectedTone,
    appCategory,
    targetAudience,
    primaryGoal,
    selectedTemplate,
    fetchRecommendations,
  ]);

  const onSelectTemplate = async (templateName: string) => {
    const isPremium = ["Subscription", "Finance", "RPG", "Vault", "Trainer AI"].some((p) => templateName.includes(p));
    if (isFree && isPremium) {
      if (window.confirm(t("step.style.premiumTemplate", { name: templateName }))) {
        await handleSaveDraft();
        handleUpgrade("starter", `/project/new?project=${projectId}&step=4`);
      }
      return;
    }
    setSelectedTemplate(templateName);
  };

  const onSelectReference = async () => {
    if (isFree) {
      if (window.confirm(t("step.style.referenceProFeature"))) {
        await handleSaveDraft();
        handleUpgrade("starter", `/project/new?project=${projectId}&step=4`);
      }
      return;
    }
    setSelectedTemplate("reference");
  };

  const handleReferenceDrop = async (files: FileList | null) => {
    if (isFree) {
      await onSelectReference();
      return;
    }
    handleReferenceUpload(files);
  };

  const recommendedNames = recommendations?.matches?.map((m) => m.template_name) || [];

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.style.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.style.subtitle")}</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-card/90 border border-border rounded-xl inline-flex mb-2 shadow-inner">
        <Button variant={selectedTemplate !== "reference" ? "default" : "ghost"} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate !== "reference" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={() => setSelectedTemplate("")}>{t("step.style.templates")}</Button>
        <Button variant={selectedTemplate === "reference" ? "default" : "ghost"} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate === "reference" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={onSelectReference}>{t("step.style.references")}</Button>
      </div>

      {selectedTemplate !== "reference" ? (
        <div className="space-y-4">
          <AnimatePresence>
            {(isLoadingRecs || (recommendations && recommendations.matches.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      {t("step.style.recommendedFor", { name: appName || t("step.style.yourApp") })}
                    </span>
                  </div>
                  {isLoadingRecs && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {recommendations?.copilot_summary && (
                  <p className="text-sm text-muted-foreground mb-3 pl-1 italic">{recommendations.copilot_summary}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {recommendations?.matches.map((match, idx) => {
                    const template = filteredTemplates.find((t) => t.name === match.template_name) || { id: `rec-${idx}`, name: match.template_name };
                    const similarityPercent = Math.round(match.similarity * 100);
                    const isLocked = isFree && ["Subscription", "Finance", "RPG", "Vault", "Trainer AI"].some((p) => match.template_name.includes(p));

                    return (
                      <motion.button
                        key={match.template_name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => onSelectTemplate(match.template_name)}
                        className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${selectedTemplate === match.template_name
                          ? "border-primary shadow-glow scale-[1.02]"
                          : "border-primary/30 hover:border-primary/60 hover:scale-[1.02] shadow-sm"
                          }`}
                      >
                        <div className="aspect-[3/4] relative overflow-hidden bg-card/90">
                          {templatePreviews[match.template_name] ? (
                            <img src={templatePreviews[match.template_name]} alt={match.template_name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <LayoutGrid className="h-8 w-8 text-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-20 bg-primary/90 backdrop-blur-md rounded-lg px-2 py-0.5 border border-primary/50">
                            <span className="text-[10px] font-bold text-primary-foreground">
                              {t("step.style.match", { percent: similarityPercent })}
                            </span>
                          </div>
                          {isLocked && (
                            <div className="absolute top-2 right-2 z-20 bg-primary/20 backdrop-blur-md rounded-lg p-1.5 border border-primary/30">
                              <Lock className="h-3 w-3 text-primary animate-pulse" />
                            </div>
                          )}
                          {selectedTemplate === match.template_name && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <CheckCircle2 className="h-8 w-8 text-primary drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-card/90 border-t border-border">
                          <span className={`text-xs font-bold tracking-tight ${selectedTemplate === match.template_name ? "text-primary" : "text-muted-foreground"}`}>
                            {match.template_name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-4">
            <div className="flex gap-1.5 items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">{t("step.style.mood")}</span>
              {templateMoods.map((m) => (
                <button key={m} onClick={() => setTemplateMoodFilter(m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all ${templateMoodFilter === m ? "bg-primary text-primary-foreground border-primary" : "bg-card/90 text-muted-foreground border-border hover:border-primary/30"}`}>
                  {m === "All" ? `🎨 ${t("templates.moods.all")}` : m === "dark" ? `🌙 ${t("templates.moods.dark")}` : m === "light" ? `☀️ ${t("templates.moods.light")}` : m === "colorful" ? `🌈 ${t("templates.moods.colorful")}` : `⚪ ${t("templates.moods.neutral")}`}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">{t("step.style.category")}</span>
              {templateCategories.map((c) => (
                <button key={c} onClick={() => setTemplateCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${templateCategoryFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card/90 text-muted-foreground border-border hover:border-primary/30"}`}>
                  {t(`templates.categories.${c.toLowerCase()}`, { defaultValue: c })}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredTemplates.map((t) => {
              const isLocked = isFree && ["Subscription", "Finance", "RPG", "Vault", "Trainer AI"].some((p) => t.name.includes(p));
              const isRecommended = recommendedNames.includes(t.name);
              return (
                <button key={t.id} onClick={() => onSelectTemplate(t.name)} className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${selectedTemplate === t.name ? "border-primary shadow-glow scale-[1.02]" : isRecommended ? "border-primary/20 hover:border-primary/40 hover:scale-[1.02] shadow-sm" : "border-border hover:border-primary/40 hover:scale-[1.02] shadow-sm"}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-card/90">
                    {templatePreviews[t.name] ? (
                      <img src={templatePreviews[t.name]} alt={t.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className={`h-8 w-8 ${selectedTemplate === t.name ? "text-primary" : "text-foreground/30"}`} />
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-2 right-2 z-20 bg-primary/20 backdrop-blur-md rounded-lg p-1.5 border border-primary/30">
                        <Lock className="h-3 w-3 text-primary animate-pulse" />
                      </div>
                    )}
                    {selectedTemplate === t.name && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-primary drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-card/90 border-t border-border">
                    <span className={`text-xs font-bold tracking-tight ${selectedTemplate === t.name ? "text-primary" : "text-muted-foreground"}`}>{t.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium">{t("step.style.noMatch")}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <input
            ref={referenceInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleReferenceDrop(e.target.files)}
          />

          <div
            onClick={() => {
              if (isFree) {
                void onSelectReference();
                return;
              }
              referenceInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleReferenceDrop(e.dataTransfer.files);
            }}
            className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-muted/50 transition-all duration-300 cursor-pointer shadow-inner group"
          >
            <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-3 group-hover:text-primary transition-colors" />
            <p className="text-sm font-bold text-muted-foreground tracking-tight group-hover:text-foreground">{t("step.style.uploadRef")}</p>
            <p className="text-xs text-foreground/50 mt-1">{t("step.style.uploadRefTypes")}</p>
            {isFree && <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 rounded-lg">{t("step.style.proFeature")}</Badge>}
          </div>

          {referenceMockups.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.style.refMockups")}</h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border">{t("step.style.files", { count: referenceMockups.length })}</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {referenceMockups.map((ref) => (
                  <div key={ref.id} className="relative rounded-xl overflow-hidden border border-border bg-card/90 group">
                    <img src={ref.preview} alt={t("step.style.refMockups")} className="w-full aspect-[9/16] object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => removeReferenceMockup(ref.id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.style.inspirationNotes")}</label>
            <Textarea
              value={inspirationText}
              onChange={(e) => setInspirationText(e.target.value)}
              placeholder={t("step.style.inspirationPlaceholder")}
              className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] focus-visible:ring-primary transition-all rounded-xl p-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};
