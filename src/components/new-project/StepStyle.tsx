import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, LayoutGrid, Upload } from "lucide-react";
import { templateMoods } from "@/lib/demo-data";
import { templatePreviews } from "@/constants/templates";
import { useNewProject } from "@/contexts/NewProjectContext";

export const StepStyle = () => {
  const {
    selectedTemplate, setSelectedTemplate,
    templateMoodFilter, setTemplateMoodFilter,
    templateCategoryFilter, setTemplateCategoryFilter,
    filteredTemplates, templateCategories,
  } = useNewProject();

  return (
    <div className="space-y-8 relative z-10">
      <div className="border-b border-border pb-5">
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Choose your style</h2>
        <p className="text-muted-foreground font-medium">Pick a template or upload references for inspiration.</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-card/90 border border-border rounded-xl inline-flex mb-2 shadow-inner">
        <Button variant={selectedTemplate !== 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate !== 'reference' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} onClick={() => setSelectedTemplate('')}>Templates</Button>
        <Button variant={selectedTemplate === 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate === 'reference' ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} onClick={() => setSelectedTemplate('reference')}>References</Button>
      </div>

      {selectedTemplate !== 'reference' ? (
        <div className="space-y-4">
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
            {filteredTemplates.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t.name)} className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${selectedTemplate === t.name ? 'border-primary shadow-glow scale-[1.02]' : 'border-border hover:border-primary/40 hover:scale-[1.02] shadow-sm'}`}>
                <div className="aspect-[3/4] relative overflow-hidden bg-card/90">
                  {templatePreviews[t.name] ? (
                    <img src={templatePreviews[t.name]} alt={t.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LayoutGrid className={`h-8 w-8 ${selectedTemplate === t.name ? 'text-primary' : 'text-foreground/30'}`} />
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
            ))}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium">No templates match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-muted/50 transition-all duration-300 cursor-pointer shadow-inner">
            <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground tracking-tight">Upload your reference mockups</p>
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
