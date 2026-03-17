import { Button } from "@/components/ui/button";
import { Upload, Trash2, Plus } from "lucide-react";
import { screenTags } from "@/lib/demo-data";
import { useNewProject } from "@/contexts/NewProjectContext";
import { useTranslation } from "react-i18next";

export const StepScreens = () => {
  const { t } = useTranslation();
  const { uploadedScreens, setUploadedScreens, handleScreenUpload, removeScreen, screenInputRef } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">{t("step.screens.title")}</h2>
        <p className="text-muted-foreground font-medium">{t("step.screens.subtitle")}</p>
      </div>
      <input ref={screenInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleScreenUpload(e.target.files)} />
      <div
        onClick={() => screenInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); handleScreenUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-[2rem] p-20 text-center hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all duration-300 cursor-pointer group"
      >
        <div className="h-20 w-20 bg-card/90 border border-border rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-elevated">
          <Upload className="h-8 w-8 text-primary shadow-sm" />
        </div>
        <p className="text-xl font-bold text-foreground mb-2">{t("step.screens.dropHere")}</p>
        <p className="text-sm font-medium text-foreground/40">{t("step.screens.fileTypes")}</p>
      </div>

      {uploadedScreens.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("step.screens.uploaded")}</h3>
            <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border">{t("step.screens.files", { count: uploadedScreens.length })}</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {uploadedScreens.map(screen => (
              <div key={screen.id} className="aspect-[9/19.5] rounded-xl border border-border bg-card/90 flex flex-col items-center justify-center p-2 shadow-inner relative group hover:border-primary/50 hover:shadow-glow transition-all duration-300">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="destructive" size="icon" onClick={() => removeScreen(screen.id)} className="h-7 w-7 rounded-lg shadow-sm bg-destructive/20 text-destructive hover:bg-destructive hover:text-foreground border border-destructive/30">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <img src={screen.preview} alt={screen.tag} className="h-full w-full rounded object-cover mb-2" />
                <select
                  value={screen.tag}
                  onChange={e => setUploadedScreens(prev => prev.map(s => s.id === screen.id ? { ...s, tag: e.target.value } : s))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[10px] font-bold text-muted-foreground w-full"
                >
                  {screenTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
            <div
              onClick={() => screenInputRef.current?.click()}
              className="aspect-[9/19.5] rounded-xl border-2 border-dashed border-border bg-card/90 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Plus className="h-8 w-8 text-foreground/20" />
              <span className="text-xs text-muted-foreground mt-2 font-bold">{t("step.screens.addMore")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
