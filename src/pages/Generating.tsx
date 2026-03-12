import { useEffect, useRef, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2, AlertCircle, StopCircle, ThumbsUp, RefreshCw, Download, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useArchiveProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useProject, useProjectSlides } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const phases = [
  { label: "Analyzing brand identity", icon: "🎨" },
  { label: "Processing visual references", icon: "🖼️" },
  { label: "Building creative direction", icon: "✨" },
  { label: "Planning slide compositions", icon: "📐" },
  { label: "Rendering slide visuals", icon: "🔥" },
  { label: "Harmonizing set consistency", icon: "🎯" },
  { label: "Finalizing exports", icon: "✅" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

type SlideUiStatus = "pending" | "generating" | "completed" | "error";

const normalizeStatus = (status: string, imageUrl: string | null): SlideUiStatus => {
  if (imageUrl) return "completed";
  if (status === "generating") return "generating";
  if (status === "error") return "error";
  return "pending";
};

const statusLabel: Record<SlideUiStatus, string> = {
  pending: "pending",
  generating: "generating",
  completed: "ready",
  error: "error",
};

const Generating = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const { data: dbSlides } = useProjectSlides(projectId);
  const archiveProject = useArchiveProject();
  const { toast } = useToast();
  const { profile } = useAuth();

  const startedRef = useRef(false);
  const redirectedRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const warmupIntervalRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [slideStatuses, setSlideStatuses] = useState<SlideUiStatus[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [slideImages, setSlideImages] = useState<(string | null)[]>([]);

  // Interactive Workflow State
  const [reviewMode, setReviewMode] = useState(false);
  const [activeSlideNumber, setActiveSlideNumber] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasMoreSlides, setHasMoreSlides] = useState(true);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Also unsubscribe realtime channel
    if (projectId) {
      supabase.removeChannel(supabase.channel(`slides-${projectId}`));
    }
  }, [projectId]);

  const handleStopAndArchive = async () => {
    if (!projectId) return;
    setIsStopping(true);
    requestAbortRef.current?.abort();
    stopPolling();
    try {
      await archiveProject.mutateAsync(projectId);
    } catch {
      // navigate anyway
    }
    navigate("/dashboard/projects");
  };

  const routeToResults = useCallback(() => {
    if (!projectId || redirectedRef.current) return;
    redirectedRef.current = true;
    setTimeout(() => navigate(`/project/${projectId}/results`), 800);
  }, [navigate, projectId]);

  const applyLiveSlides = useCallback((slides: Array<{ slide_number: number; status: string; image_url: string | null }>) => {
    if (!slides.length) return;

    const ordered = [...slides].sort((a, b) => a.slide_number - b.slide_number);
    const statuses = ordered.map((slide) => normalizeStatus(slide.status, slide.image_url));
    const images = ordered.map((slide) => slide.image_url || null);

    setSlideStatuses(statuses);
    setSlideImages(images);

    const total = statuses.length;
    const completedCount = statuses.filter((s) => s === "completed").length;
    const hasGenerating = statuses.some((s) => s === "generating");

    // Don't auto-route to results if we just completed all slides; we need to review the last one.
    if (completedCount >= total && !hasGenerating) {
      setCurrentPhase(6);
      setProgress(100);
    } else {
      const nextProgress = Math.min(
        95,
        Math.round(20 + (completedCount / total) * 70 + (hasGenerating ? (70 / total) * 0.35 : 0))
      );
      setProgress((prev) => Math.max(prev, nextProgress));

      if (completedCount === 0 && !hasGenerating) setCurrentPhase(Math.min(currentPhase, 2));
      else if (hasGenerating) setCurrentPhase(4);
      else if (completedCount > 0 && completedCount < total) setCurrentPhase(5);
    }
  }, [currentPhase]);

  // Sync DB Slides initially
  useEffect(() => {
    if (!dbSlides?.length || startedRef.current) return; // Only sync on first load to prevent overwriting optimistic state
    applyLiveSlides(dbSlides.map((slide) => ({
      slide_number: slide.slide_number,
      status: slide.status,
      image_url: slide.image_url,
    })));
  }, [dbSlides, applyLiveSlides]);

  const startPolling = useCallback(() => {
    if (!projectId || reviewMode) return;

    // Use Supabase Realtime instead of interval polling
    const channel = supabase
      .channel(`slides-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_slides', filter: `project_id=eq.${projectId}` },
        async () => {
          const { data } = await supabase
            .from("project_slides")
            .select("slide_number,status,image_url")
            .eq("project_id", projectId)
            .order("slide_number", { ascending: true });
          if (data?.length) applyLiveSlides(data);
        }
      )
      .subscribe();

    // Store channel ref for cleanup (reuse pollIntervalRef as sentinel)
    pollIntervalRef.current = 1;
  }, [projectId, reviewMode, applyLiveSlides]);

  const startGenerationStream = useCallback(async (accessToken: string, resume = false, targetSlide?: number, userFeedback?: string): Promise<"done" | "hasMore" | "busy" | { error: string }> => {
    try {
      if (!projectId) return { error: "No project ID" };
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
      requestAbortRef.current = new AbortController();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ project_id: projectId, resume, target_slide_number: targetSlide, user_feedback: userFeedback, idempotency_key: crypto.randomUUID() }),
        signal: requestAbortRef.current.signal,
      });

      if (response.status === 409) return "busy";
      if (response.status === 402) return { error: "Insufficient credits. Please upgrade your plan." };
      if (!response.ok || !response.body) {
        try {
          const errData = await response.json();
          return { error: errData.error || `Server error (${response.status})` };
        } catch {
          return { error: `Server error (${response.status})` };
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let localHasMore = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 2);

          const lines = chunk.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);

            if (eventType === "slide-start") {
              const num = data.slideNumber || 1;
              const index = Math.max(0, num - 1);
              setCurrentPhase(4);
              setActiveSlideNumber(num);
              setReviewMode(false);

              setSlideStatuses((prev) => {
                const length = Math.max(prev.length, index + 1, data.total || 0);
                const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
                next[index] = "generating";
                return next;
              });
            }

            if (eventType === "slide-done") {
              const num = data.slideNumber || 1;
              const index = Math.max(0, num - 1);
              setActiveSlideNumber(num);

              setSlideStatuses((prev) => {
                const length = Math.max(prev.length, index + 1);
                const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
                next[index] = "completed";
                return next;
              });
              setSlideImages((prev) => {
                const length = Math.max(prev.length, index + 1);
                const next = Array.from({ length }, (_, i) => prev[i] ?? null);
                next[index] = data.imageUrl || next[index];
                return next;
              });
            }

            if (eventType === "slide-error") {
              const index = Math.max(0, (data.slideNumber || 1) - 1);
              setSlideStatuses((prev) => {
                const length = Math.max(prev.length, index + 1);
                const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
                next[index] = "error";
                return next;
              });
            }

            if (eventType === "all-done") {
              localHasMore = Boolean(data.hasMore);
              setHasMoreSlides(localHasMore);
              setReviewMode(true); // Trigger review pause
              stopPolling();

              if (!localHasMore) {
                setCurrentPhase(6);
                setProgress(100);
              }
            }
          } catch {
            // Ignore malformed SSE events
          }
        }
      }

      return localHasMore ? "hasMore" : "done";
    } catch (e: any) {
      if (e.name === 'AbortError') return "busy";
      return { error: "Request failed or aborted." };
    }
  }, [projectId, stopPolling]);

  const processQueue = useCallback(async (accessToken: string, initialResume: boolean, targetSlide?: number, userFeedback?: string) => {
    const result = await startGenerationStream(accessToken, initialResume, targetSlide, userFeedback);

    if (result === "busy") {
      startPolling();
      return;
    }

    if (typeof result === "object" && result.error) {
      toast({ title: "Generation Failed", description: result.error, variant: "destructive", duration: 8000 });
      stopPolling();
      return;
    }

    // Whether "done" or "hasMore", we stop polling and rely on active user review
    stopPolling();
  }, [startGenerationStream, startPolling, stopPolling, toast]);

  useEffect(() => {
    if (!projectId || startedRef.current) return;
    startedRef.current = true;

    warmupIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 20) {
          if (warmupIntervalRef.current) window.clearInterval(warmupIntervalRef.current);
          return 20;
        }
        return prev + 5;
      });
      setCurrentPhase((s) => Math.min(s + 1, 3));
    }, 800);

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: latestSlides } = await supabase
        .from("project_slides")
        .select("slide_number,status,image_url")
        .eq("project_id", projectId)
        .order("slide_number", { ascending: true });

      const slidesSnapshot = latestSlides ?? [];

      if (slidesSnapshot.length > 0) {
        applyLiveSlides(slidesSnapshot);
      }

      const hasIncomplete = slidesSnapshot.length > 0
        ? slidesSnapshot.some((slide) => normalizeStatus(slide.status, slide.image_url) !== "completed")
        : true;
      const hasStarted = slidesSnapshot.some(
        (slide) => slide.status === "generating" || normalizeStatus(slide.status, slide.image_url) === "completed"
      );

      // If all completed, and we haven't touched anything, dump to results
      if (slidesSnapshot.length > 0 && !hasIncomplete) {
        routeToResults();
        return;
      }

      const { data: projData } = await supabase.from("projects").select("status").eq("id", projectId).single();
      const currentStatus = projData?.status;

      // Ensure we highlight the first pending active slide naturally if there is one
      const pendingSlide = slidesSnapshot.find(s => s.status === "pending" || s.status === "generating");
      if (pendingSlide) {
        setActiveSlideNumber(pendingSlide.slide_number);
      } else {
        setActiveSlideNumber(1);
      }

      await processQueue(session.access_token, currentStatus === "generating" && hasStarted);
    };

    const timer = window.setTimeout(bootstrap, 500);

    return () => {
      if (warmupIntervalRef.current) window.clearInterval(warmupIntervalRef.current);
      window.clearTimeout(timer);
      stopPolling();
      requestAbortRef.current?.abort();
    };
  }, [navigate, projectId, applyLiveSlides, processQueue, routeToResults, stopPolling]);

  const handleApprove = async () => {
    setReviewMode(false);
    setFeedback("");

    if (!hasMoreSlides) {
      routeToResults();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Find the next slide to generate
      const nextSlide = slideStatuses.findIndex(s => s === "pending") + 1;
      if (nextSlide > 0) {
        setActiveSlideNumber(nextSlide);
      }
      await processQueue(session.access_token, true); // resume = true
    }
  };

  const handleRedesign = async () => {
    if (!feedback.trim()) return;
    setIsSubmittingFeedback(true);
    setReviewMode(false);

    toast({
      title: "Redesigning slide...",
      description: "Applying your feedback to the creative engine.",
    });

    // Optimistic UI back to generating
    setSlideStatuses((prev) => {
      const next = [...prev];
      if (activeSlideNumber) next[activeSlideNumber - 1] = "generating";
      return next;
    });
    setSlideImages((prev) => {
      const next = [...prev];
      if (activeSlideNumber) next[activeSlideNumber - 1] = null;
      return next;
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await processQueue(session.access_token, false, activeSlideNumber || undefined, feedback);
    }

    setIsSubmittingFeedback(false);
    setFeedback("");
  };

  const slideCount = slideStatuses.length || 5;
  const completedCount = slideStatuses.filter(s => s === "completed").length;

  const displaySlideIndex = activeSlideNumber ? activeSlideNumber - 1 : slideStatuses.findIndex(s => s === "generating" || s === "pending");
  const actualIndex = Math.max(0, displaySlideIndex);
  const centralStatus = slideStatuses[actualIndex] ?? "pending";
  const centralImage = slideImages[actualIndex];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-start min-h-[85vh] relative w-full pt-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="w-full flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              Consistency Engine
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {completedCount > 0 && completedCount < slideCount
                ? `${completedCount} of ${slideCount} slides ready`
                : "Crafting your premium store assets..."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Credits display */}
            <div className="hidden md:flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-black text-primary">{profile?.credits ?? 0}</span>
              <span className="text-xs text-muted-foreground font-medium">credits</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{phases[currentPhase]?.icon}</span>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{phases[currentPhase]?.label}</span>
              <span className="text-sm font-black ml-2">{progress}%</span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl text-xs gap-1.5" disabled={isStopping || (progress >= 100 && !reviewMode)}>
                  {isStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <StopCircle className="h-3 w-3" />}
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop generation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop the current generation and archive the project. Already completed slides will be kept.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue generating</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStopAndArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Stop & Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Unified Layout Container */}
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-14 w-full h-[65vh] xl:h-[70vh]">

          {/* LEFT/TOP: Massive Central Active Slide Card */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex-1 flex flex-col items-center justify-center relative h-full">
            <div className={`relative h-full max-h-[800px] aspect-[9/19.5] rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-700 overflow-hidden shadow-2xl ${centralStatus === "completed"
              ? "border-primary/50 bg-card/90 shadow-glow"
              : centralStatus === "generating"
                ? "border-primary/40 bg-primary/5 scale-[1.02] backdrop-blur-xl ring-4 ring-primary/20"
                : centralStatus === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card/90 opacity-50 backdrop-blur-sm"
              }`}>

              {centralImage ? (
                <img src={centralImage} alt={`Slide ${actualIndex + 1}`} className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              {!centralImage && centralStatus === "generating" && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent animate-pulse" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                </>
              )}

              <div className={`relative z-10 flex flex-col items-center ${centralImage ? "bg-background/80 px-4 py-3 rounded-2xl border border-border mt-auto mb-8 shadow-xl" : ""}`}>
                {!centralImage && centralStatus === "completed" ? (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="h-16 w-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center mb-4 shadow-glow">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </motion.div>
                ) : !centralImage && centralStatus === "generating" ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="h-12 w-12 text-primary mb-4" />
                  </motion.div>
                ) : !centralImage && centralStatus === "error" ? (
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                ) : null}

                <span className="text-lg font-black text-foreground tracking-tight">Slide {actualIndex + 1}</span>
                <Badge className="mt-2 text-xs uppercase tracking-widest font-bold shadow-sm">{statusLabel[centralStatus]}</Badge>
              </div>
            </div>

            {/* Review Controls Modal-like Overlay */}
            <AnimatePresence>
              {reviewMode && centralStatus === "completed" && centralImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="fixed inset-x-4 bottom-4 z-[100] md:max-w-[400px] md:mx-auto xl:absolute xl:inset-auto xl:top-1/2 xl:-translate-y-1/2 xl:-right-10 xl:translate-x-full xl:w-[400px] bg-background/95 backdrop-blur-xl border-border border-2 shadow-2xl rounded-3xl p-6"
                >
                  <h3 className="text-xl font-black mb-1">Slide Ready</h3>
                  <p className="text-sm text-muted-foreground mb-6">Review this slide. Modify it or proceed.</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">What should we change?</label>
                      <Textarea
                        placeholder="e.g., 'Make the headline smaller' or 'Bring back the mascot'"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="resize-none min-h-[100px] border-primary/20 bg-card text-sm placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm rounded-xl p-4"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleRedesign}
                        disabled={!feedback.trim() || isSubmittingFeedback}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl text-primary font-bold border-primary/20 hover:bg-primary/10 shadow-sm"
                      >
                        {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Redesign
                      </Button>

                      <Button
                        onClick={handleApprove}
                        className="flex-1 h-14 rounded-2xl font-bold shadow-glow"
                        size="lg"
                        disabled={isSubmittingFeedback}
                      >
                        <ThumbsUp className="mr-2 h-5 w-5" />
                        {hasMoreSlides ? "Looks Good" : "Perfect"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT/BOTTOM: Timeline Thumbnails */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="w-full xl:w-56 xl:h-full flex xl:flex-col items-center justify-start gap-4 overflow-x-auto xl:overflow-x-visible xl:overflow-y-auto pt-2 pb-4 px-2 custom-scrollbar">
            {Array.from({ length: Math.max(slideCount, 1) }).map((_, i) => {
              const status = slideStatuses[i] ?? "pending";
              const image = slideImages[i];
              const isActive = (activeSlideNumber === i + 1);

              return (
                <div key={i} className={`group flex-shrink-0 relative w-24 xl:w-full aspect-[9/19.5] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] ${status === "completed"
                  ? "border-primary/50 bg-card/90"
                  : status === "generating"
                    ? "border-primary animate-pulse bg-primary/5 backdrop-blur-md"
                    : "border-border bg-card/50 opacity-60 hover:opacity-100"
                  } ${isActive ? 'ring-4 ring-primary ring-offset-2 ring-offset-background z-10' : ''}`}
                  onClick={() => {
                    setActiveSlideNumber(i + 1);
                    // If we navigate to a slide that isn't the "currently generating/ready" one, 
                    // we might want to toggle reviewMode based on whether THAT slide is completed.
                    if (status === "completed") {
                      // Optionally setReviewMode(true) if we want the redesign input to show for any completed slide
                    }
                  }}
                >
                  {image ? (
                    <img src={image} alt={`Tmb ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : null}

                  {status === "generating" ? (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-[8px] font-black uppercase tracking-tighter text-primary">Generating</span>
                    </div>
                  ) : !image ? (
                    <div className="flex flex-col items-center gap-1 z-10">
                      <span className="text-xl font-black text-muted-foreground/30">{i + 1}</span>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/50">{status}</span>
                    </div>
                  ) : null}

                  {/* Status Indicator Overlays */}
                  {status === "completed" && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-md backdrop-blur-sm z-20">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span className="text-[8px] font-black uppercase">READY</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-background/80 rounded-full p-0.5 backdrop-blur-sm z-20">
                    {status === "completed" ? <CheckCircle2 className="h-3 w-3 text-primary" /> :
                      status === "generating" ? <div className="h-2 w-2 rounded-full bg-primary animate-ping m-0.5" /> :
                        <div className="h-2 w-2 rounded-full bg-muted-foreground m-0.5" />}
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>

        {/* Download Results CTA — shown when all slides are generated */}
        {!hasMoreSlides && completedCount >= slideCount && completedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full mt-8 p-6 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-card/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground">All {completedCount} slides ready!</p>
                <p className="text-sm text-muted-foreground">Your screenshot set is complete and ready to download.</p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl px-8 shadow-glow flex-shrink-0"
              onClick={() => navigate(`/project/${projectId}/results`)}
            >
              <Download className="mr-2 h-5 w-5" />
              View &amp; Download Results
            </Button>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Generating;
