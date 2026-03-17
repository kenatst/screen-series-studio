import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Plus, Wand2 } from "lucide-react";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";

export const StepBrandKit = () => {
  const { t } = useTranslation();
  const {
    brandAssets, brandColors, setBrandColors, brandFont, setBrandFont,
    newColor, setNewColor, handleBrandUpload, removeBrandAsset,
    handleAutoDetectColors, brandInputRefs, visualPreferences, setVisualPreferences,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.brandKit.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.brandKit.subtitle")}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {(['logo', 'icon', 'mascot'] as const).map(type => {
          const asset = brandAssets.find(a => a.type === type);
          return (
            <div key={type} className="relative">
              <input type="file" accept="image/*" className="hidden" ref={el => { brandInputRefs.current[type] = el; }} onChange={e => handleBrandUpload(type, e.target.files)} />
              {asset ? (
                <div className="border border-primary/30 bg-primary/5 rounded-2xl p-4 text-center relative group shadow-glow">
                  <button onClick={() => removeBrandAsset(type)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive hover:text-foreground flex items-center justify-center border border-destructive/30">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <img src={asset.preview} alt={type} className="h-24 w-24 object-contain mx-auto mb-3 rounded-xl" />
                  <p className="text-sm font-bold text-primary capitalize">{type} ✓</p>
                </div>
              ) : (
                <div onClick={() => brandInputRefs.current[type]?.click()} className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group shadow-inner">
                  <div className="h-14 w-14 bg-muted/50 border border-border rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-glow transition-all duration-500">
                    <Upload className="h-6 w-6 text-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground tracking-tight capitalize">{t("step.brandKit.upload", { type })}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.brandKit.brandColors")}</label>
          <Button variant="outline" size="sm" onClick={handleAutoDetectColors} className="text-xs font-bold rounded-lg h-8 border-primary/30 text-primary hover:bg-primary/10">
            <Wand2 className="h-3 w-3 mr-1.5" /> {t("step.brandKit.autoDetect")}
          </Button>
        </div>
        {brandColors.length === 0 ? (
          <div className="p-6 border border-dashed border-border bg-card/90 rounded-2xl text-center shadow-inner">
            <p className="text-sm text-muted-foreground font-medium mb-2">{t("step.brandKit.noColors")}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 w-10 rounded-full border-2 border-dashed border-border cursor-pointer bg-transparent" />
              <Button variant="ghost" size="sm" onClick={() => { if (!brandColors.includes(newColor)) setBrandColors(prev => [...prev, newColor]); }} className="text-xs font-bold text-primary">
                <Plus className="h-4 w-4 mr-1" /> {t("step.brandKit.addColor")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 p-5 border border-border bg-card/90 rounded-2xl shadow-inner">
            {brandColors.map((c, i) => (
              <div key={i} className="relative group">
                <div className="h-14 w-14 rounded-full border-4 border-background cursor-pointer hover:scale-110 hover:shadow-glow transition-all duration-300 shadow-elevated" style={{ backgroundColor: c }} />
                <button onClick={() => setBrandColors(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-14 w-14 rounded-full border-2 border-dashed border-border cursor-pointer bg-transparent" />
              <Button variant="ghost" size="sm" onClick={() => { if (!brandColors.includes(newColor)) setBrandColors(prev => [...prev, newColor]); }} className="text-xs font-bold text-primary">
                <Plus className="h-4 w-4 mr-1" /> {t("step.brandKit.add")}
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4 pt-4">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.brandKit.brandFont")}</label>
        <Input value={brandFont} onChange={e => setBrandFont(e.target.value)} placeholder={t("step.brandKit.brandFontPlaceholder")} className="bg-muted/50 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
      </div>
      <div className="space-y-4 pt-4">
        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.brandKit.visualPrefs")}</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "Keep app UI untouched", key: "untouched" },
            { value: "Allow visual enhancement", key: "enhance" },
            { value: "Use premium preset palette", key: "palette" },
            { value: "Auto-detect from assets", key: "autoDetect" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisualPreferences(prev => prev.includes(option.value) ? prev.filter(p => p !== option.value) : [...prev, option.value])}
              className={`font-bold border cursor-pointer transition-all duration-300 py-2 px-4 shadow-sm rounded-lg text-sm ${visualPreferences.includes(option.value) ? 'bg-primary text-primary-foreground border-primary shadow-glow' : 'bg-card/90 text-muted-foreground border-border hover:bg-primary/20 hover:text-primary hover:border-primary/40'}`}
            >
              {t(`step.brandKit.visualPrefOptions.${option.key}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
