import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultStorylines, SlideItem } from "@/lib/demo-data";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download, RefreshCw, Copy, Edit3, Globe, GitBranch, CheckCircle2,
  X, Image as ImageIcon, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { TranslationsModal } from "@/components/project/TranslationsModal";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const Results = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<any>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<SlideItem | null>(null);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenKey, setRegenKey] = useState(Date.now()); // for cache busting images
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      api.getProject(projectId).then(p => {
        setProject(p);
        if (p.slides && p.slides.length > 0) {
          setSlides(p.slides);
          setSelectedSlide(p.slides[0]);
        }
      }).catch(console.error);
    }
  }, [projectId]);

  const handleDownload = () => {
    if (projectId) {
      window.open(api.getDownloadUrl(projectId), '_blank');
    }
  };

  const handleRegenerate = async () => {
    if (!project || !selectedSlide || !projectId) return;
    setIsRegenerating(true);
    try {
      await api.regenerateSlide({
        projectId,
        slide: selectedSlide,
        project: { appName: project.name, platform: project.platform },
        brandKit: project.brandKit || { colors: [] },
        templateId: project.templateId || 'clean-saas',
        consistencyLevel: project.consistencyLevel || 'balanced',
        totalSlides: slides.length
      });
      setRegenKey(Date.now());
    } catch (e) {
      console.error("Failed to regenerate slide", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!selectedSlide || slides.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main Preview */}
        <div className="flex-1 p-8 overflow-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Generated Screenshot Set</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-success/10 text-success border-success/20 shadow-sm"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Consistent</Badge>
                <span className="text-sm font-medium text-muted-foreground">{slides.length} slides • {project?.templateId || 'Premium'} • {project?.consistencyLevel || 'Balanced'} consistency</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download all (ZIP)</Button>
              <Button variant="secondary" className="border-border/60 shadow-sm" size="sm"><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
              <Button variant="secondary" className="border-border/60 shadow-sm" size="sm" onClick={() => setIsTranslationModalOpen(true)}><Globe className="mr-2 h-4 w-4" /> Localize</Button>
            </div>
          </motion.div>

          {/* Large preview */}
          <div className="mb-8 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSlide.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="aspect-[9/19.5] w-80 rounded-[2rem] border border-border bg-card/90 overflow-hidden shadow-elevated relative group backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-20" />
                <div className="h-full flex flex-col items-center justify-start p-8 text-center relative z-10">
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 shadow-glow">
                    <span className="text-base font-black text-primary">{selectedSlide.number}</span>
                  </div>
                  <Badge className="mb-4 bg-white/10 text-foreground font-medium border-border text-xs shadow-sm capitalize px-3 py-1 tracking-widest uppercase">{selectedSlide.objective}</Badge>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2 leading-tight drop-shadow-md">{selectedSlide.headline}</h3>
                  <p className="text-sm font-medium text-muted-foreground mb-6 line-clamp-2">{selectedSlide.subheadline}</p>

                  <div className="w-full flex-1 rounded-xl bg-card/90 border border-border shadow-inner flex flex-col items-center justify-center overflow-hidden relative">
                    {/* Render the actual generated image */}
                    <img
                      src={`http://localhost:3001/output/${projectId}/slide-${selectedSlide.number}.png?t=${regenKey}`}
                      alt={`Slide ${selectedSlide.number}`}
                      className="w-full h-full object-cover absolute inset-0 z-0"
                    />
                  </div>

                  <div className="mt-4 flex gap-2 w-full justify-center">
                    <Badge className="bg-card/90 text-muted-foreground text-[10px] border-border shadow-sm uppercase tracking-wider">{selectedSlide.rawScreenTag}</Badge>
                    <Badge className="bg-card/90 text-muted-foreground text-[10px] border-border shadow-sm uppercase tracking-wider">{selectedSlide.emphasis}</Badge>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail rail */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex gap-4 justify-center">
            {slides.map((slide, i) => (
              <motion.button
                key={slide.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedSlide(slide)}
                className={`aspect-[9/19.5] w-20 rounded-xl border-2 flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${selectedSlide.id === slide.id ? 'border-primary bg-primary/5 shadow-md scale-105' : 'border-border/50 bg-card hover:border-primary/40'
                  }`}
              >
                <span className={`text-[10px] font-black ${selectedSlide.id === slide.id ? 'text-primary' : 'text-muted-foreground'}`}>{slide.number}</span>
                <div className={`h-full w-full rounded border mt-1 flex items-center justify-center overflow-hidden ${selectedSlide.id === slide.id ? 'bg-background border-primary/20' : 'bg-secondary border-border/50'}`}>
                  <img
                    src={`http://localhost:3001/output/${projectId}/slide-${slide.number}.png?t=${regenKey}`}
                    alt={`Slide ${slide.number}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Side editor */}
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-96 border-l border-border bg-card/90 backdrop-blur-2xl p-6 overflow-auto shadow-elevated z-10"
        >
          {editingSlide ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <h3 className="font-bold text-lg text-foreground tracking-tight">Edit Slide {selectedSlide.number}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={() => setEditingSlide(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Headline</label>
                  <Input defaultValue={selectedSlide.headline} className="bg-secondary border-border/60 text-sm font-semibold h-10 focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Subheadline</label>
                  <Input defaultValue={selectedSlide.subheadline} className="bg-secondary border-border/60 text-sm h-10 focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {isRegenerating ? "Generating..." : "Regenerate this slide"}
                  </Button>
                  <Button variant="secondary" className="w-full border border-border/60 shadow-sm hover:border-primary/30">Generate 3 variants</Button>
                  <Button variant="secondary" className="w-full border border-border/60 shadow-sm hover:border-primary/30">Apply style to all slides</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="pb-4 border-b border-border">
                <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">Slide Details</h3>
                <p className="text-sm font-medium text-muted-foreground">Overview of the selected slide.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-black/5 p-3 rounded-lg border border-border shadow-inner">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1 block">Objective</span>
                  <p className="text-sm font-bold text-foreground capitalize">{selectedSlide.objective}</p>
                </div>
                <div className="bg-black/5 p-3 rounded-lg border border-border shadow-inner">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1 block">Headline</span>
                  <p className="text-sm font-bold text-foreground">{selectedSlide.headline}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/5 p-3 rounded-lg border border-border shadow-inner">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2 block">Raw screen</span>
                    <Badge className="bg-card/90 text-muted-foreground border-border text-xs shadow-sm">{selectedSlide.rawScreenTag}</Badge>
                  </div>
                  <div className="bg-black/5 p-3 rounded-lg border border-border shadow-inner">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2 block">Emphasis</span>
                    <Badge className="bg-card/90 text-muted-foreground border-border text-xs shadow-sm capitalize">{selectedSlide.emphasis}</Badge>
                  </div>
                </div>
                <div className="bg-black/5 p-3 rounded-lg border border-border shadow-inner">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2 block">Importance</span>
                  <Badge className={`shadow-sm px-3 py-1 capitalize border-none ${selectedSlide.importance === 'high' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                    {selectedSlide.importance}
                  </Badge>
                </div>
              </div>
              <div className="pt-6 border-t border-border space-y-3">
                <Button className="w-full bg-primary text-black font-bold hover:bg-primary/90 shadow-glow" onClick={() => setEditingSlide(selectedSlide.id)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit slide
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full bg-black/5 border border-border text-foreground hover:bg-white/10 shadow-sm"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Reload</Button>
                  <Button variant="secondary" className="w-full bg-black/5 border border-border text-foreground hover:bg-white/10 shadow-sm"><Copy className="mr-2 h-3.5 w-3.5" /> Clone</Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <TranslationsModal isOpen={isTranslationModalOpen} onOpenChange={setIsTranslationModalOpen} projectId={projectId || ''} />
    </DashboardLayout>
  );
};

export default Results;
