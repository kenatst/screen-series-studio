import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { useNewProject } from "@/contexts/NewProjectContext";

export const StepProject = () => {
  const {
    appName, setAppName, projectName, setProjectName,
    platform, setPlatform, appCategory, setAppCategory,
    targetAudience, setTargetAudience, primaryGoal, setPrimaryGoal,
    outputLanguage, setOutputLanguage, deviceFormats, toggleFormat,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Create project</h2>
        <p className="text-muted-foreground font-medium">Set up your screenshot project basics.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App name</label>
          <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. LinguaPal" className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Project name <span className="text-foreground/30 normal-case font-medium">(optional)</span></label>
          <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={appName || "e.g. LinguaPal US Launch"} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Platform</label>
        <div className="flex gap-3">
          {['iOS', 'Android', 'Both'].map(p => (
            <button key={p} onClick={() => setPlatform(p.toLowerCase())} className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${platform === p.toLowerCase() ? 'bg-primary/10 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App category</label>
          <Input value={appCategory} onChange={e => setAppCategory(e.target.value)} placeholder="e.g. Education, Finance, Health" className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target audience</label>
          <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. Young professionals, students" className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Primary goal</label>
        <div className="flex flex-wrap gap-2">
          {['Increase installs', 'Highlight features', 'Improve conversion', 'Localize assets', 'Launch new app', 'A/B testing'].map(g => (
            <button key={g} onClick={() => setPrimaryGoal(g)} className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${primaryGoal === g ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Output language</label>
        <p className="text-xs text-foreground/40 font-medium -mt-1">The language used for headlines and subheadlines.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { code: 'en', label: '🇺🇸 English' }, { code: 'fr', label: '🇫🇷 Français' },
            { code: 'de', label: '🇩🇪 Deutsch' }, { code: 'es', label: '🇪🇸 Español' },
            { code: 'it', label: '🇮🇹 Italiano' }, { code: 'pt', label: '🇧🇷 Português' },
            { code: 'ja', label: '🇯🇵 日本語' }, { code: 'ko', label: '🇰🇷 한국어' },
            { code: 'zh', label: '🇨🇳 中文' }, { code: 'ar', label: '🇸🇦 العربية' },
          ].map(lang => (
            <button key={lang.code} onClick={() => setOutputLanguage(lang.code)} className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${outputLanguage === lang.code ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {(platform === 'ios' || platform === 'both') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Device formats (App Store Compliance)
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">Required</Badge>
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'iphone-6-9', label: 'iPhone 6.9"', desc: 'Pro Max' },
                { id: 'iphone-6-5', label: 'iPhone 6.5"', desc: 'Max / Plus' },
                { id: 'ipad-12-9', label: 'iPad 12.9"', desc: 'Pro' }
              ].map(f => (
                <div key={f.id} onClick={() => toggleFormat(f.id)} className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 min-w-[140px] ${deviceFormats.includes(f.id) ? 'bg-primary/10 border-primary shadow-glow' : 'bg-muted/50 border-border hover:border-primary/40'}`}>
                  <span className={`text-sm font-bold leading-tight ${deviceFormats.includes(f.id) ? 'text-primary' : 'text-muted-foreground'}`}>{f.label}</span>
                  <span className="text-xs text-foreground/40 font-medium">{f.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-primary/70 pt-1 font-medium">Assets will be batch-generated for all selected device metrics.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
