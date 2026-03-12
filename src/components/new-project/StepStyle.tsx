import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, LayoutGrid, Upload, Lock, Sparkles, Loader2, Brain } from "lucide-react";
import { templateMoods } from "@/lib/demo-data";
import { templatePreviews } from "@/constants/templates";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useBilling } from "@/hooks/useBilling";
import { useSearchParams } from "react-router-dom";
import { useTemplateRecommendations, type TemplateMatch } from "@/hooks/useTemplateRecommendations";
import { motion, AnimatePresence } from "framer-motion";

export const StepStyle = () => {
  const {
    selectedTemplate, setSelectedTemplate,
    templateMoodFilter, setTemplateMoodFilter,
    templateCategoryFilter, setTemplateCategoryFilter,
    filteredTemplates, templateCategories,
    profile, handleSaveDraft,
    uploadedScreens, brandAssets, appName, appDescription
  } = useNewProject();
  const { handleUpgrade } = useBilling();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const isFree = profile?.plan === 'free';

  const { recommendations, isLoading: isLoadingRecs, fetchRecommendations } = useTemplateRecommendations();
  const [hasFetchedRecs, setHasFetchedRecs] = useState(false);

  // Auto-trigger recommendations when step loads
  useEffect(() => {
    if (hasFetchedRecs) return;
    setHasFetchedRecs(true);

    // Collect screenshot URLs (from uploaded screens previews)
    const screenshotUrls = uploadedScreens
      .filter(s => s.preview)
      .slice(0, 3)
      .map(s => s.preview);

    // Collect logo URL
    const logoAsset = brandAssets.find(a => a.type === 'logo');
    const logoUrl = logoAsset?.preview || undefined;

    fetchRecommendations({
      screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
      logoUrl,
      appName: appName || undefined,
      appDescription: appDescription || undefined,
    });
  }, [hasFetchedRecs, uploadedScreens, brandAssets, appName, appDescription, fetchRecommendations]);

  const onSelectTemplate = async (templateName: string) => {
    const isPremium = ['Subscription', 'Finance', 'RPG', 'Vault', 'Trainer AI'].some(p => templateName.includes(p));
    if (isFree && isPremium) {
      if (window.confirm(`"${templateName}" is a Premium template. Upgrade to unlock all styles? We'll save your draft so you can continue immediately.`)) {
        await handleSaveDraft();
        handleUpgrade('starter', `/project/new?project=${projectId}&step=4`);
      }
      return;
    }
    setSelectedTemplate(templateName);
  };

  const onSelectReference = async () => {
    if (isFree) {
      if (window.confirm("Reference-based generation is a Pro feature. Upgrade to unlock? We'll save your draft so you can continue immediately.")) {
        await handleSaveDraft();
        handleUpgrade('starter', `/project/new?project=${projectId}&step=4`);
      }
      return;
    }
    setSelectedTemplate('reference');
  };

  const recommendedNames = recommendations?.matches?.map(m => m.template_name) || [];

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Choose your style</h2>
        <p className="text-muted-foreground font-medium">Pick a template or upload references for inspiration.</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-card/90 border border-border rounded-xl inline-flex mb-2 shadow-inner">
        <Button variant={selectedTemplate !== 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate !== 'reference' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} onClick={() => setSelectedTemplate('')}>Templates</Button>
        <Button variant={selectedTemplate === 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate === 'reference' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} onClick={onSelectReference}>References</Button>
      </div>

      {selectedTemplate !== 'reference' ? (
        <div className="space-y-4">
          {/* AI Recommendations Section */}
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
                    <span className="text-sm font-bold text-primary">✨ Recommended for {appName || 'your app'}</span>
                  </div>
                  {isLoadingRecs && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {recommendations?.copilot_summary && (
                  <p className="text-sm text-muted-foreground mb-3 pl-1 italic">
                    {recommendations.copilot_summary}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {recommendations?.matches.map((match, idx) => {
                    const template = filteredTemplates.find(t => t.name === match.template_name) ||
                      { id: `rec-${idx}`, name: match.template_name };
                    const similarityPercent = Math.round(match.similarity * 100);
                    const isLocked = isFree && ['Subscription', 'Finance', 'RPG', 'Vault', 'Trainer AI'].some(p => match.template_name.includes(p));

                    return (
                      <motion.button
                        key={match.template_name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => onSelectTemplate(match.template_name)}
                        className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${selectedTemplate === match.template_name
                          ? 'border-primary shadow-glow scale-[1.02]'
                          : 'border-primary/30 hover:border-primary/60 hover:scale-[1.02] shadow-sm'
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
                          {/* Similarity badge */}
                          <div className="absolute top-2 left-2 z-20 bg-primary/90 backdrop-blur-md rounded-lg px-2 py-0.5 border border-primary/50">
                            <span className="text-[10px] font-bold text-primary-foreground">{similarityPercent}% match</span>
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
                          <span className={`text-xs font-bold tracking-tight ${selectedTemplate === match.template_name ? 'text-primary' : 'text-muted-foreground'}`}>
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
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Mood:</span>
              {templateMoods.map(m => (
                <button key={m} onClick={() => setTemplateMoodFilter(m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all ${templateMoodFilter === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/90 text-muted-foreground border-border hover:border-primary/30'}`}>
                  {m === 'All' ? '🎨 All' : m === 'dark' ? '🌙 Dark' : m === 'light' ? '☀️ Light' : m === 'colorful' ? '🌈 Colorful' : '⚪ Neutral'}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Category:</span>
              {templateCategories.map(c => (
                <button key={c} onClick={() => setTemplateCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${templateCategoryFilter === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/90 text-muted-foreground border-border hover:border-primary/30'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredTemplates.map(t => {
              const isLocked = isFree && ['Subscription', 'Finance', 'RPG', 'Vault', 'Trainer AI'].some(p => t.name.includes(p));
              const isRecommended = recommendedNames.includes(t.name);
              return (
                <button key={t.id} onClick={() => onSelectTemplate(t.name)} className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${selectedTemplate === t.name ? 'border-primary shadow-glow scale-[1.02]' : isRecommended ? 'border-primary/20 hover:border-primary/40 hover:scale-[1.02] shadow-sm' : 'border-border hover:border-primary/40 hover:scale-[1.02] shadow-sm'}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-card/90">
                    {templatePreviews[t.name] ? (
                      <img src={templatePreviews[t.name]} alt={t.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className={`h-8 w-8 ${selectedTemplate === t.name ? 'text-primary' : 'text-foreground/30'}`} />
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
                    <span className={`text-xs font-bold tracking-tight ${selectedTemplate === t.name ? 'text-primary' : 'text-muted-foreground'}`}>{t.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium">No templates match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div
            onClick={onSelectReference}
            className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-muted/50 transition-all duration-300 cursor-pointer shadow-inner group"
          >
            <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-3 group-hover:text-primary transition-colors" />
            <p className="text-sm font-bold text-muted-foreground tracking-tight group-hover:text-foreground">Upload your reference mockups</p>
            {isFree && <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 rounded-lg">Pro Feature</Badge>}
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Inspiration notes</label>
            <Textarea placeholder="e.g. Use this as inspiration for composition and intensity, but keep my branding and app content." className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] focus-visible:ring-primary transition-all rounded-xl p-4" />
          </div>
        </div>
      )}
    </div>
  );
};
