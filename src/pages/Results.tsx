import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download, RefreshCw, Globe, Loader2, Wand2, Send, Lock, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useProject, useProjectSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TranslationsModal } from "@/components/project/TranslationsModal";
import { canTranslate, canRegenerate, CREDIT_COSTS } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const Results = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: slides, refetch: refetchSlides } = useProjectSlides(projectId);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingSlideId, setRegeneratingSlideId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [showRegenPrompt, setShowRegenPrompt] = useState<string | null>(null);

  const userPlan = (profile?.plan || 'free') as any;
  const userCredits = profile?.credits ?? 0;

  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const selectedSlide = slides?.find(s => s.id === selectedSlideId) || slides?.[0];

  const handleUpgrade = async () => {
    try {
      setIsOpeningPortal(true);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: 'starter' },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const checkCredits = (cost: number): boolean => {
    if (userCredits < cost) {
      toast({ title: "Crédits insuffisants", description: `Il vous faut ${cost} crédit(s). Solde actuel : ${userCredits}.`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!projectId) return;
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/export-zip?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        toast({ title: "Export error", description: err.error, variant: "destructive" });
        return;
      }

      const contentType = res.headers.get("Content-Type");
      if (contentType?.includes("application/zip")) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
        const filename = filenameMatch?.[1] || `${project?.name || 'export'}.zip`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (userPlan === 'free') {
          toast({ title: "Export avec filigrane", description: "Passez à un plan payant pour exporter sans filigrane.", variant: "destructive" });
        } else {
          toast({ title: "Export terminé ✨" });
        }
      } else {
        const data = await res.json();
        toast({ title: "Export error", description: data.error || "Unexpected response", variant: "destructive" });
      }
    } catch (e) {
      console.error("Download failed", e);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerateAll = async () => {
    const totalCost = (slides?.length || 0) * CREDIT_COSTS.regenerateSlide;
    if (!checkCredits(totalCost)) return;

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
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            decoder.decode(value, { stream: true });
          }
        }
        await refetchSlides();
        await refreshProfile();
        toast({ title: "Régénération terminée ✨" });
      }
    } catch (e) {
      console.error("Regeneration failed", e);
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateSingle = async (slideId: string) => {
    if (!checkCredits(CREDIT_COSTS.regenerateSlide)) return;

    setRegeneratingSlideId(slideId);
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
        body: JSON.stringify({
          project_id: projectId,
          single_slide_id: slideId,
          user_prompt: regenPrompt || undefined,
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            decoder.decode(value, { stream: true });
          }
        }
        await refetchSlides();
        await refreshProfile();
        setRegenPrompt('');
        setShowRegenPrompt(null);
        toast({ title: "Slide régénérée ✨" });
      }
    } catch (e) {
      console.error("Single regen failed", e);
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setRegeneratingSlideId(null);
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

  // Freemium Logic
  const isFreePlan = userPlan === 'free';
  const selectedSlideIndex = slides.findIndex(s => s.id === selectedSlide?.id);
  const isSlideLocked = isFreePlan && selectedSlideIndex > 0;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{project.app_name || project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">{project.status}</Badge>
              <Badge variant="outline">{project.platform}</Badge>
              <Badge variant="outline">{project.consistency_level} consistency</Badge>
              <Badge variant="outline" className="text-primary border-primary/30">
                {userCredits} crédits
              </Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsTranslationModalOpen(true)}
            >
              <Globe className="mr-2 h-4 w-4" /> Translate ({CREDIT_COSTS.translateSlide} cr./slide)
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleRegenerateAll}
              disabled={isRegenerating}
            >
              {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate All ({(slides?.length || 0)} cr.)
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Main preview */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="relative">
            {selectedSlide && (
              <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
                {selectedSlide.image_url ? (
                  <div className="relative">
                    <img
                      src={selectedSlide.image_url}
                      alt={`Slide ${selectedSlide.slide_number}`}
                      className={`w-full max-w-md mx-auto rounded-xl shadow-elevated ${isSlideLocked ? 'blur-xl' : ''}`}
                    />
                    {userPlan === 'free' && !isSlideLocked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none max-w-md mx-auto">
                        <span className="text-4xl font-black text-white/30 rotate-[-30deg] select-none tracking-widest uppercase">
                          ScreenForge
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[9/19.5] max-w-md mx-auto rounded-xl bg-muted border border-border flex items-center justify-center">
                    <span className="text-muted-foreground">No image generated</span>
                  </div>
                )}
                <div className="mt-6 space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{selectedSlide.headline || `Slide ${selectedSlide.slide_number}`}</h3>
                  <p className="text-muted-foreground">{selectedSlide.subheadline}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{selectedSlide.objective}</Badge>
                    <Badge variant="outline">{selectedSlide.emphasis}</Badge>
                    <Badge className={selectedSlide.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}>{selectedSlide.status}</Badge>
                  </div>
                </div>

                {/* Single slide regeneration */}
                {!isSlideLocked && (
                  <div className="mt-6 pt-4 border-t border-border">
                    {showRegenPrompt === selectedSlide.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={regenPrompt}
                          onChange={e => setRegenPrompt(e.target.value)}
                          placeholder="Décrivez les changements souhaités... (ex: 'rend le fond plus sombre', 'change la headline en bleu')"
                          className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 min-h-[80px] resize-none focus-visible:ring-primary rounded-xl p-4 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRegenerateSingle(selectedSlide.id)}
                            disabled={regeneratingSlideId === selectedSlide.id}
                            className="rounded-lg"
                          >
                            {regeneratingSlideId === selectedSlide.id ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-3.5 w-3.5" />
                            )}
                            Régénérer (1 cr.)
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setShowRegenPrompt(null); setRegenPrompt(''); }}
                            className="rounded-lg text-muted-foreground"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRegenPrompt(selectedSlide.id)}
                        className="rounded-lg w-full"
                      >
                        <Wand2 className="mr-2 h-4 w-4 text-primary" />
                        Régénérer cette slide avec un prompt
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Freemium Paywall Overlay */}
            {isSlideLocked && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center rounded-2xl">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-xl rounded-2xl" />
                <div className="relative z-10 max-w-sm mx-auto space-y-6">
                  <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl border border-primary/30 flex items-center justify-center shadow-glow">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Débloquez la suite</h3>
                    <p className="text-muted-foreground font-medium text-sm">
                      Le plan gratuit vous permet de prévisualiser la première slide. Passez à la version Pro pour générer, traduire et exporter vos sets complets jusqu'à 10 slides.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleUpgrade}
                    disabled={isOpeningPortal}
                    className="w-full h-14 bg-primary text-black hover:bg-primary/90 text-lg font-black shadow-[0_0_30px_rgba(245,166,35,0.4)] rounded-xl"
                  >
                    {isOpeningPortal ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                    Passer Pro pour unlock
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Thumbnail rail */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">All Slides</h3>
            {slides.map((slide, index) => {
              const isLockedThumbnail = isFreePlan && index > 0;

              return (
                <div
                  key={slide.id}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 relative overflow-hidden ${(selectedSlide?.id === slide.id) ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card/40 hover:border-primary/30'
                    }`}
                >
                  <div className={`flex items-center gap-3 ${isLockedThumbnail ? 'blur-[4px] opacity-70' : ''}`}>
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${slide.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {slide.status}
                        </Badge>
                        {canRegenerate(userPlan) && regeneratingSlideId === slide.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isLockedThumbnail && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
                        <Lock className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
