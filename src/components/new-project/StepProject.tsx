import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";
import { OUTPUT_LANGUAGE_CODES } from "@/lib/ui-languages";

const goalOptions = [
  { value: "Increase installs", key: "installs" },
  { value: "Highlight features", key: "features" },
  { value: "Improve conversion", key: "conversion" },
  { value: "Localize assets", key: "localize" },
  { value: "Launch new app", key: "launch" },
  { value: "A/B testing", key: "ab" },
] as const;

export const StepProject = () => {
  const { t } = useTranslation();
  const {
    appName, setAppName, projectName, setProjectName,
    platform, setPlatform, appCategory, setAppCategory,
    targetAudience, setTargetAudience, primaryGoal, setPrimaryGoal,
    outputLanguage, setOutputLanguage, deviceFormats, toggleFormat,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.project.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.project.subtitle")}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.appName")}</label>
          <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder={t("step.project.appNamePlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t("step.project.projectName")}{" "}
            <span className="text-foreground/30 normal-case font-medium">{t("step.project.projectNameOptional")}</span>
          </label>
          <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={appName || t("step.project.projectNamePlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.platform")}</label>
        <div className="flex gap-3">
          {[
            { value: "ios", key: "ios" },
            { value: "android", key: "android" },
            { value: "both", key: "both" },
          ].map((platformOption) => (
            <button
              key={platformOption.value}
              onClick={() => setPlatform(platformOption.value)}
              className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${platform === platformOption.value ? 'bg-primary/10 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}
            >
              {t(`step.project.platformOptions.${platformOption.key}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.category")}</label>
          <Input value={appCategory} onChange={e => setAppCategory(e.target.value)} placeholder={t("step.project.categoryPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.audience")}</label>
          <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder={t("step.project.audiencePlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.goal")}</label>
        <div className="flex flex-wrap gap-2">
          {goalOptions.map((goalOption) => (
            <button
              key={goalOption.value}
              onClick={() => setPrimaryGoal(goalOption.value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${primaryGoal === goalOption.value ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}
            >
              {t(`step.project.goals.${goalOption.key}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.project.outputLanguage")}</label>
        <p className="text-xs text-foreground/40 font-medium -mt-1">{t("step.project.outputLanguageHint")}</p>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_LANGUAGE_CODES.map((languageCode) => (
            <button
              key={languageCode}
              onClick={() => setOutputLanguage(languageCode)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${outputLanguage === languageCode ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}
            >
              {`${languageCode.toUpperCase()} - ${t(`step.project.outputLanguageOptions.${languageCode}`)}`}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {(platform === 'ios' || platform === 'both') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {t("step.project.deviceFormats")}
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">{t("step.project.deviceFormatsRequired")}</Badge>
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'iphone-6-9', label: 'iPhone 6.9"', desc: t("step.project.deviceDescriptions.iphone69") },
                { id: 'iphone-6-5', label: 'iPhone 6.5"', desc: t("step.project.deviceDescriptions.iphone65") },
                { id: 'ipad-12-9', label: 'iPad 12.9"', desc: t("step.project.deviceDescriptions.ipad129") }
              ].map(f => (
                <div key={f.id} onClick={() => toggleFormat(f.id)} className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 min-w-[140px] ${deviceFormats.includes(f.id) ? 'bg-primary/10 border-primary shadow-glow' : 'bg-muted/50 border-border hover:border-primary/40'}`}>
                  <span className={`text-sm font-bold leading-tight ${deviceFormats.includes(f.id) ? 'text-primary' : 'text-muted-foreground'}`}>{f.label}</span>
                  <span className="text-xs text-foreground/40 font-medium">{f.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-primary/70 pt-1 font-medium">{t("step.project.deviceFormatsHint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
