import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download, RefreshCw, Copy, Edit3, Globe, CheckCircle2,
  X, Loader2, Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useProject, useProjectSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TranslationsModal } from "@/components/project/TranslationsModal";
import { canTranslate, canRedesign } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const Results = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: slides, refetch: refetchSlides } = useProjectSlides(projectId);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);

  const userPlan = profile?.plan || 'free';

  const selectedSlide = slides?.find(s => s.id === selectedSlideId) || slides?.[0];

  const handleDownload = async () => {
    if (!projectId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/export-zip?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      // Open each download URL
      for (const dl of data.downloads || []) {
        window.open(dl.url, '_blank');
      }
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const handleRegenerate = async (slideId: string) => {
    setIsRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !projectId) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (response.ok) {
        // Wait for completion then refetch
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
          }
        }
        await refetchSlides();
      }
    } catch (e) {
      console.error("Regeneration failed", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!project || !slides) {
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
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">{project.status}</Badge>
              <Badge variant="outline">{project.platform}</Badge>
              <Badge variant="outline">{project.consistency_level} consistency</Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsTranslationModalOpen(true)}>
              <Globe className="mr-2 h-4 w-4" /> Translate
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="rounded-xl" onClick={() => handleRegenerate('')} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate All
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Main preview */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            {selectedSlide && (
              <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
                {selectedSlide.image_url ? (
                  <img
                    src={selectedSlide.image_url}
                    alt={`Slide ${selectedSlide.slide_number}`}
                    className="w-full max-w-md mx-auto rounded-xl shadow-elevated"
                  />
                ) : (
                  <div className="aspect-[9/19.5] max-w-md mx-auto rounded-xl bg-muted border border-border flex items-center justify-center">
                    <span className="text-muted-foreground">No image generated</span>
                  </div>
                )}
                <div className="mt-6 space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{selectedSlide.headline || `Slide ${selectedSlide.slide_number}`}</h3>
                  <p className="text-muted-foreground">{selectedSlide.subheadline}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">{selectedSlide.objective}</Badge>
                    <Badge variant="outline">{selectedSlide.emphasis}</Badge>
                    <Badge className={selectedSlide.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}>{selectedSlide.status}</Badge>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Thumbnail rail */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">All Slides</h3>
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                  (selectedSlide?.id === slide.id) ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-20 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {slide.image_url ? (
                      <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{slide.slide_number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{slide.headline || `Slide ${slide.slide_number}`}</p>
                    <p className="text-xs text-muted-foreground truncate">{slide.objective}</p>
                    <Badge className={`mt-1 text-[10px] ${slide.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {slide.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <TranslationsModal
        isOpen={isTranslationModalOpen}
        onOpenChange={setIsTranslationModalOpen}
        projectId={projectId || ''}
      />
    </DashboardLayout>
  );
};

export default Results;
