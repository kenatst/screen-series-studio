import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toneOptions } from "@/lib/demo-data";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";

export const StepAppInfo = () => {
  const { t } = useTranslation();
  const {
    shortDescription, setShortDescription, appDescription, setAppDescription,
    valueProposition, setValueProposition, keyFeatures, setKeyFeatures,
    topBenefits, setTopBenefits, selectedTone, setSelectedTone,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.appInfo.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.appInfo.subtitle")}</p>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.shortDesc")}</label>
        <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder={t("step.appInfo.shortDescPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.longDesc")}</label>
        <Textarea value={appDescription} onChange={e => setAppDescription(e.target.value)} placeholder={t("step.appInfo.longDescPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[140px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.valueProp")}</label>
        <Input value={valueProposition} onChange={e => setValueProposition(e.target.value)} placeholder={t("step.appInfo.valuePropPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.keyFeatures")}</label>
          <Textarea value={keyFeatures} onChange={e => setKeyFeatures(e.target.value)} placeholder={t("step.appInfo.keyFeaturesPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.topBenefits")}</label>
          <Textarea value={topBenefits} onChange={e => setTopBenefits(e.target.value)} placeholder={t("step.appInfo.topBenefitsPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.appInfo.tone")}</label>
        <div className="flex flex-wrap gap-2">
          {toneOptions.map((toneOption) => (
            <button key={toneOption} onClick={() => setSelectedTone(toneOption)} className={`px-4 py-2.5 rounded-lg text-sm capitalize font-bold border transition-all duration-300 ${selectedTone === toneOption ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
              {t(`step.appInfo.tones.${toneOption}`, { defaultValue: toneOption })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
