import { Loader2, Wand2, Plus, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSlide } from "@/components/project/SortableSlide";
import { useNewProject } from "@/contexts/NewProjectContext";

export const StepPlanner = () => {
  const {
    slides, slideCount, isAutoFilling, uploadedScreens,
    consistencyLevel, sensors, handleDragEnd, handleAutoFillSlides,
    handleSlideCountChange, updateSlide, removeSlide, addSlide,
    getScreenOptions, setConsistencyLevel,
  } = useNewProject();

  const screensMapped = uploadedScreens.map(s => ({ id: s.id, file: s.file, preview: s.preview, tag: s.tag }));

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-start justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Screenshot set planner</h2>
          <p className="text-muted-foreground font-medium">Define each slide's content and objective.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleAutoFillSlides}
          disabled={isAutoFilling}
          className="rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10 h-10 px-4"
        >
          {isAutoFilling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
          Auto-fill with AI
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3 bg-card/90 px-3 py-1.5 rounded-xl border border-border shadow-inner">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slides:</span>
              <div className="flex gap-1">
                {[3, 5, 7, 10].map(n => (
                  <button key={n} onClick={() => handleSlideCountChange(n)} className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all duration-300 ${slideCount === n ? 'bg-primary text-primary-foreground border-primary shadow-glow' : 'bg-muted/50 text-muted-foreground border-border hover:border-border hover:text-foreground'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TooltipProvider>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-4">
                <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {slides.map((slide) => (
                    <SortableSlide
                      key={slide.id}
                      slide={slide}
                      updateSlide={updateSlide}
                      removeSlide={removeSlide}
                      getScreenOptions={getScreenOptions}
                      uploadedScreens={screensMapped}
                    />
                  ))}
                </SortableContext>
                <Button variant="outline" onClick={addSlide} className="w-full rounded-2xl border-dashed border-2 h-14 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <Plus className="mr-2 h-5 w-5" /> Add slide
                </Button>
              </div>
            </DndContext>
          </TooltipProvider>
        </div>

        {/* Sidebar Consistency Engine */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sticky top-6 shadow-glow backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">Consistency Engine</span>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                {(['strict', 'balanced', 'exploratory'] as const).map(level => (
                  <button key={level} onClick={() => setConsistencyLevel(level)} className={`px-4 py-3.5 rounded-xl text-sm capitalize font-bold border transition-all duration-300 w-full text-left flex justify-between items-center ${consistencyLevel === level ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)]' : 'bg-card/90 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground shadow-inner'}`}>
                    {level}
                    {consistencyLevel === level && <CheckCircle2 className="h-4.5 w-4.5" />}
                  </button>
                ))}
              </div>
              <div className="p-4 bg-card/90 rounded-xl border border-border text-xs text-muted-foreground font-medium leading-relaxed shadow-inner">
                {consistencyLevel === 'strict' && 'All slides remain very homogeneous — same palette, framing, density. Recommended for traditional app store pages.'}
                {consistencyLevel === 'balanced' && 'Same visual universe with controlled variations for each slide. Great for feature showcases.'}
                {consistencyLevel === 'exploratory' && 'More creative freedom while maintaining a coherent base brand identity. High contrast allowed.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
