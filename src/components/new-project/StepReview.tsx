import { Button } from "@/components/ui/button";
import { FolderOpen, LayoutGrid, Sparkles, Save, Loader2 } from "lucide-react";
import { useNewProject } from "@/contexts/NewProjectContext";

export const StepReview = () => {
  const {
    appName, platform, selectedTone, selectedTemplate, deviceFormats,
    slideCount, uploadedScreens, brandAssets, consistencyLevel,
    outputLanguage, slides, generationMode, setGenerationMode,
    isSaving, handleSaveDraft, handleGenerate,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Pre-generation review</h2>
        <p className="text-muted-foreground font-medium">Review everything before generating your screenshot set.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-[120px] pointer-events-none transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-110" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" /> Project summary
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground font-medium">
            <div className="flex justify-between border-b border-border pb-3"><span>App:</span> <span className="font-bold text-foreground">{appName || 'Not set'}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Platform:</span> <span className="font-bold text-foreground capitalize">{platform}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Tone:</span> <span className="font-bold text-foreground capitalize">{selectedTone}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Template:</span> <span className="font-bold text-foreground">{selectedTemplate || 'Not selected'}</span></div>
            {(platform === 'ios' || platform === 'both') && (
              <div className="flex justify-between border-b border-border pb-3"><span>Formats:</span> <span className="font-bold text-foreground">{deviceFormats.join(', ')}</span></div>
            )}
            <div className="flex justify-between border-b border-border pb-3"><span>Slides:</span> <span className="font-bold text-foreground">{slideCount}</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Screens:</span> <span className="font-bold text-foreground">{uploadedScreens.length} uploaded</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Brand assets:</span> <span className="font-bold text-foreground">{brandAssets.length} uploaded</span></div>
            <div className="flex justify-between border-b border-border pb-3"><span>Consistency:</span> <span className="font-bold text-foreground capitalize">{consistencyLevel}</span></div>
            <div className="flex justify-between pb-1"><span>Output language:</span> <span className="font-bold text-foreground">{outputLanguage.toUpperCase()}</span></div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 hover:border-primary/30 transition-all duration-500">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" /> Slide headlines
          </h3>
          <div className="space-y-3">
            {slides.map(s => (
              <div key={s.id} className="flex items-start gap-4 text-sm p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <span className="text-primary font-black bg-primary/10 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner border border-primary/20">{s.number}</span>
                <div className="flex-1 pt-1">
                  <span className="text-foreground/90 font-bold tracking-tight">{s.headline || <span className="text-foreground/30 italic">No headline set</span>}</span>
                  {s.subheadline && <p className="text-foreground/50 text-xs mt-0.5">{s.subheadline}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 pt-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Generation mode</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { id: 'full', title: 'Full set generation', desc: 'Generate all slides at once' },
            { id: 'creative-direction', title: 'Creative direction first', desc: 'Generate 3 style directions for Slide 1' },
            { id: 'first-3', title: 'First 3 slides only', desc: 'Quick preview before full generation' },
          ].map(mode => (
            <button key={mode.id} onClick={() => setGenerationMode(mode.id as any)} className={`text-left rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 shadow-elevated ${generationMode === mode.id ? 'border-primary bg-primary/10 shadow-[0_5px_20px_hsl(var(--primary)/0.2)]' : 'border-border bg-card/90 hover:border-primary/40 hover:bg-muted/50'}`}>
              <p className={`text-sm font-black mb-1.5 tracking-tight ${generationMode === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.title}</p>
              <p className={`text-xs font-medium ${generationMode === mode.id ? 'text-primary/70' : 'text-foreground/40'}`}>{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-8 mt-8 border-t border-border">
        <Button variant="outline" size="lg" onClick={handleSaveDraft} disabled={isSaving} className="h-16 rounded-2xl text-lg font-bold border-border hover:border-primary/40 px-8">
          <Save className="mr-3 h-5 w-5" /> Save draft
        </Button>
        <Button
          size="lg"
          className="flex-1 h-16 rounded-2xl text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:-translate-y-1.5 transition-all duration-300"
          disabled={isSaving}
          onClick={handleGenerate}
        >
          {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Sparkles className="mr-3 h-6 w-6" />}
          {isSaving ? "Preparing Output..." : "Generate Cinematic Screenshots"}
        </Button>
      </div>
    </div>
  );
};
