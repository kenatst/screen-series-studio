import { useEffect, useRef, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2, AlertCircle, StopCircle, ThumbsUp, RefreshCw, Download, Coins, PartyPopper } from "lucide-react";
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
  { label: "All slides generated", icon: "✅" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

type SlideUiStatus = "pending" | "generating" | "completed" | "error";
type SlideSnapshot = { slide_number: number; status: string; image_url: string | null };

const isStoragePath = (value: string | null) => {
  if (!value) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
};

const normalizeStatus = (status: string, imageUrl: string | null): SlideUiStatus => {
  if (imageUrl || status === "completed") return "completed";
  if (status === "generating") return "generating";
  if (status === "error") return "error";
  return "pending";
};

const Generating = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const { data: dbSlides } = useProjectSlides(projectId);
  const archiveProject = useArchiveProject();
  const { toast } = useToast();
  const { profile, refreshProfile, checkSubscription } = useAuth();

  const startedRef = useRef(false);
  const redirectedRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const warmupIntervalRef = useRef<number | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isReturningFromCheckoutRef = useRef(searchParams.get("checkout") === "success");
  const signedUrlCacheRef = useRef<Record<string, string>>({});

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [slideStatuses, setSlideStatuses] = useState<SlideUiStatus[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [slideImages, setSlideImages] = useState<(string | null)[]>([]);

  // Interactive Workflow State
  const [reviewMode, setReviewMode] = useState(false);
  const [activeSlideNumber, setActiveSlideNumber] = useState<number | null>(null);
  const [reviewSlideNumber, setReviewSlideNumber] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasMoreSlides, setHasMoreSlides] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);

  // Handle successful checkout return
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({
        title: "Upgrade Successful! 🎉",
        description: "Your Pro plan is active. Resuming your generation...",
        duration: 5000,
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout");
      setSearchParams(newParams, { replace: true });
      checkSubscription();
      refreshProfile();
    }
  }, [searchParams, toast, setSearchParams, checkSubscription, refreshProfile]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  const handleStopAndArchive = async () => {
    if (!projectId) return;
    setIsStopping(true);
    requestAbortRef.current?.abort();
    stopPolling();
    try { await archiveProject.mutateAsync(projectId); } catch { /* navigate anyway */ }
    navigate("/dashboard");
  };

  const routeToResults = useCallback(() => {
    if (!projectId || redirectedRef.current) return;
    redirectedRef.current = true;
    setTimeout(() => navigate(`/project/${projectId}/results`), 800);
  }, [navigate, projectId]);

  const resolveSlideImageUrl = useCallback(async (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (!isStoragePath(imageUrl)) return imageUrl;
    const cached = signedUrlCacheRef.current[imageUrl];
    if (cached) return cached;
    const { data } = await supabase.storage.from("generated-outputs").createSignedUrl(imageUrl, 60 * 60 * 2);
    const signedUrl = data?.signedUrl || null;
    if (signedUrl) signedUrlCacheRef.current[imageUrl] = signedUrl;
    return signedUrl;
  }, []);

  const hydrateSlidesForUi = useCallback(async (slides: SlideSnapshot[]) => {
    return Promise.all(slides.map(async (slide) => ({ ...slide, image_url: await resolveSlideImageUrl(slide.image_url) })));
  }, [resolveSlideImageUrl]);

  const applyLiveSlides = useCallback((slides: SlideSnapshot[]) => {
    if (!slides.length) return;
    const ordered = [...slides].sort((a, b) => a.slide_number - b.slide_number);
    const statuses = ordered.map((slide) => normalizeStatus(slide.status, slide.image_url));
    const images = ordered.map((slide) => slide.image_url || null);
    setSlideStatuses(statuses);
    setSlideImages(images);

    const total = statuses.length;
    const completedCount = statuses.filter((s) => s === "completed").length;
    const hasGenerating = statuses.some((s) => s === "generating");

    if (completedCount >= total && !hasGenerating) {
      setCurrentPhase(6);
      setProgress(100);
    } else {
      const nextProgress = Math.min(95, Math.round(20 + (completedCount / total) * 70 + (hasGenerating ? (70 / total) * 0.35 : 0)));
      setProgress((prev) => Math.max(prev, nextProgress));
      setCurrentPhase((prev) => {
        if (completedCount === 0 && !hasGenerating) return Math.min(prev, 2);
        if (hasGenerating) return 4;
        if (completedCount > 0 && completedCount < total) return 5;
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    if (!dbSlides?.length || startedRef.current) return;
    void (async () => {
      const hydratedSlides = await hydrateSlidesForUi(dbSlides.map((slide) => ({ slide_number: slide.slide_number, status: slide.status, image_url: slide.image_url })));
      applyLiveSlides(hydratedSlides);
    })();
  }, [dbSlides, applyLiveSlides, hydrateSlidesForUi]);

  const startPolling = useCallback(() => {
    if (!projectId || reviewMode || realtimeChannelRef.current) return;
    const channel = supabase
      .channel(`slides-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_slides', filter: `project_id=eq.${projectId}` }, async () => {
        const { data } = await supabase.from("project_slides").select("slide_number,status,image_url").eq("project_id", projectId).order("slide_number", { ascending: true });
        if (data?.length) {
          const hydratedSlides = await hydrateSlidesForUi(data as SlideSnapshot[]);
          applyLiveSlides(hydratedSlides);
        }
      }).subscribe();
    realtimeChannelRef.current = channel;
    pollIntervalRef.current = window.setInterval(async () => {
      const { data } = await supabase.from("project_slides").select("slide_number,status,image_url").eq("project_id", projectId).order("slide_number", { ascending: true });
      if (data?.length) {
        const hydratedSlides = await hydrateSlidesForUi(data as SlideSnapshot[]);
        applyLiveSlides(hydratedSlides);
      }
    }, 5000);
  }, [projectId, reviewMode, applyLiveSlides, hydrateSlidesForUi]);

  const startGenerationStream = useCallback(async (accessToken: string, resume = false, targetSlide?: number, userFeedback?: string): Promise<"done" | "hasMore" | "busy" | { error: string }> => {
    setIsDispatching(true);
    try {
      if (!projectId) return { error: "No project ID" };
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (requestAbortRef.current) requestAbortRef.current.abort();
      requestAbortRef.current = new AbortController();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}`, "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ project_id: projectId, resume, target_slide_number: targetSlide, user_feedback: userFeedback, idempotency_key: crypto.randomUUID() }),
        signal: requestAbortRef.current.signal,
      });

      if (response.status === 409) { setIsDispatching(false); return "busy"; }
      if (response.status === 402) { setIsDispatching(false); return { error: "Insufficient credits. Please upgrade your plan." }; }
      if (response.status === 401 || response.status === 403) { setIsDispatching(false); return { error: "Authentication issue. Please reconnect and retry generation." }; }
      if (!response.ok || !response.body) {
        try { const errData = await response.json(); setIsDispatching(false); return { error: errData.error || `Server error (${response.status})` }; }
        catch { setIsDispatching(false); return { error: `Server error (${response.status})` }; }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let localHasMore = false;
      let currentEvent = "";
      let currentData = "";
      let hasReceivedEvent = false;

      const handleEvent = (eventType: string, eventDataRaw: string) => {
        if (!eventType || !eventDataRaw) return;
        if (!hasReceivedEvent) { hasReceivedEvent = true; setIsDispatching(false); }

        let data: any = {};
        try { data = JSON.parse(eventDataRaw); } catch { return; }

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
          setReviewSlideNumber(num);
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
          // Refresh credit count after each slide generation
          refreshProfile();
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
          setReviewMode(true);
          if (!localHasMore) { setCurrentPhase(6); setProgress(100); }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.trim() === "") { handleEvent(currentEvent, currentData); currentEvent = ""; currentData = ""; continue; }
          if (line.startsWith("event:")) { currentEvent = line.slice(6).trim(); continue; }
          if (line.startsWith("data:")) { const payloadLine = line.slice(5).trimStart(); currentData = currentData ? `${currentData}\n${payloadLine}` : payloadLine; }
        }
      }
      if (currentEvent && currentData) handleEvent(currentEvent, currentData);

      setIsDispatching(false);
      return localHasMore ? "hasMore" : "done";
    } catch (e: any) {
      setIsDispatching(false);
      if (e.name === "AbortError") return "busy";
      return { error: `Request failed: ${e?.message || "Network/CORS error"}` };
    }
  }, [projectId]);

  const processQueue = useCallback(async (accessToken: string, initialResume: boolean, targetSlide?: number, userFeedback?: string) => {
    const result = await startGenerationStream(accessToken, initialResume, targetSlide, userFeedback);
    if (result === "busy") return;
    if (typeof result === "object" && result.error) {
      toast({ title: "Generation Failed", description: result.error, variant: "destructive", duration: 8000 });
      stopPolling();
      return;
    }
    if (result === "done") stopPolling();
  }, [startGenerationStream, stopPolling, toast]);

  useEffect(() => {
    if (!projectId || startedRef.current) return;
    startedRef.current = true;

    warmupIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => { if (prev >= 20) { if (warmupIntervalRef.current) window.clearInterval(warmupIntervalRef.current); return 20; } return prev + 5; });
      setCurrentPhase((s) => Math.min(s + 1, 3));
    }, 800);

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: latestSlides } = await supabase.from("project_slides").select("slide_number,status,image_url").eq("project_id", projectId).order("slide_number", { ascending: true });
      const slidesSnapshot = (latestSlides ?? []) as SlideSnapshot[];
      const hydratedSlidesSnapshot = await hydrateSlidesForUi(slidesSnapshot);
      if (hydratedSlidesSnapshot.length > 0) applyLiveSlides(hydratedSlidesSnapshot);

      const hasIncomplete = hydratedSlidesSnapshot.length > 0 ? hydratedSlidesSnapshot.some((slide) => normalizeStatus(slide.status, slide.image_url) !== "completed") : true;
      const isReturningFromCheckout = isReturningFromCheckoutRef.current;

      if (slidesSnapshot.length > 0 && !hasIncomplete && !isReturningFromCheckout) { routeToResults(); return; }

      const { data: projData } = await supabase.from("projects").select("status").eq("id", projectId).single();
      const currentStatus = projData?.status;
      const pendingSlide = slidesSnapshot.find(s => s.status === "pending" || s.status === "generating");
      if (pendingSlide) setActiveSlideNumber(pendingSlide.slide_number);
      else setActiveSlideNumber(1);

      const shouldAutoStart = currentStatus === "generating" || isReturningFromCheckout;
      startPolling();
      await processQueue(session.access_token, shouldAutoStart);
    };

    const timer = window.setTimeout(bootstrap, 500);
    return () => {
      if (warmupIntervalRef.current) window.clearInterval(warmupIntervalRef.current);
      window.clearTimeout(timer);
      stopPolling();
      requestAbortRef.current?.abort();
    };
  }, [navigate, projectId, applyLiveSlides, hydrateSlidesForUi, processQueue, routeToResults, startPolling, stopPolling]);

  const handleApprove = async () => {
    setReviewMode(false);
    setFeedback("");
    if (!hasMoreSlides) { routeToResults(); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const nextSlide = slideStatuses.findIndex(s => s === "pending") + 1;
      if (nextSlide > 0) setActiveSlideNumber(nextSlide);
      await processQueue(session.access_token, true);
    }
  };

  const handleRedesign = async () => {
    if (!feedback.trim()) return;
    const targetSlide = reviewSlideNumber ?? activeSlideNumber ?? 1;
    setIsSubmittingFeedback(true);
    setReviewMode(false);
    setActiveSlideNumber(targetSlide);
    setReviewSlideNumber(targetSlide);
    toast({ title: "Redesigning slide...", description: "Applying your feedback to the creative engine." });
    setSlideStatuses((prev) => { const next = [...prev]; next[targetSlide - 1] = "generating"; return next; });
    setSlideImages((prev) => { const next = [...prev]; next[targetSlide - 1] = null; return next; });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await processQueue(session.access_token, false, targetSlide, feedback);
    setIsSubmittingFeedback(false);
    setFeedback("");
  };

  const slideCount = slideStatuses.length || 5;
  const completedCount = slideStatuses.filter(s => s === "completed").length;
  const nextPendingIndex = slideStatuses.findIndex((s) => s === "pending");
  const nextSlideNumberForCta = nextPendingIndex >= 0 ? nextPendingIndex + 1 : (reviewSlideNumber ? reviewSlideNumber + 1 : null);

  const displaySlideIndex = activeSlideNumber ? activeSlideNumber - 1 : slideStatuses.findIndex(s => s === "generating" || s === "pending");
  const actualIndex = Math.max(0, displaySlideIndex);
  const centralStatus = slideStatuses[actualIndex] ?? "pending";
  const centralImage = slideImages[actualIndex];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-start min-h-[85vh] relative w-full pt-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="w-full flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              Consistency Engine
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {isDispatching ? "Connecting to the rendering engine..." : completedCount > 0 && completedCount < slideCount ? `${completedCount} of ${slideCount} slides ready` : completedCount >= slideCount ? `All ${slideCount} slides completed!` : "Crafting your premium store assets..."}
            </p>
          </div>
          <div className="flex items-center gap-4">
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
                  Stop & Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop generation?</AlertDialogTitle>
                  <AlertDialogDescription>This will stop the current generation and archive the project.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue generating</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStopAndArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Stop & Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Main content: slide preview + thumbnails */}
        <div className="flex flex-col xl:flex-row gap-6 w-full flex-1">

          {/* Central Active Slide */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex-1 flex flex-col items-center justify-center relative min-h-0">
            <div className={`relative w-full max-w-sm aspect-[9/19.5] max-h-[70vh] rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-700 overflow-hidden shadow-2xl ${centralStatus === "completed" ? "border-primary/50 bg-card/90 shadow-glow" : centralStatus === "generating" ? "border-primary/40 bg-primary/5 scale-[1.02] backdrop-blur-xl ring-4 ring-primary/20" : centralStatus === "error" ? "border-destructive/40 bg-destructive/5" : "border-border bg-card/90 opacity-50 backdrop-blur-sm"}`}>
              {centralImage && <img src={centralImage} alt={`Slide ${actualIndex + 1}`} className="absolute inset-0 w-full h-full object-cover" />}
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
                ) : !centralImage && (centralStatus === "generating" || (centralStatus === "pending" && isDispatching)) ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="h-12 w-12 text-primary mb-4" />
                  </motion.div>
                ) : !centralImage && centralStatus === "error" ? (
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                ) : null}
                {!centralImage && (
                  <>
                    <span className="text-lg font-black text-foreground tracking-tight">Slide {actualIndex + 1}</span>
                    <Badge className="mt-2 text-xs uppercase tracking-widest font-bold shadow-sm">
                      {isDispatching && centralStatus === "pending" ? "initializing" : centralStatus}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Thumbnail rail */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="w-full xl:w-48 flex xl:flex-col items-center justify-start gap-3 overflow-x-auto xl:overflow-x-visible xl:overflow-y-auto pt-2 pb-4 px-2">
            {Array.from({ length: Math.max(slideCount, 1) }).map((_, i) => {
              const status = slideStatuses[i] ?? "pending";
              const image = slideImages[i];
              const isActive = (activeSlideNumber === i + 1);
              return (
                <div key={i} className={`group flex-shrink-0 relative w-20 xl:w-full aspect-[9/19.5] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] ${status === "completed" ? "border-primary/50 bg-card/90" : status === "generating" ? "border-primary bg-primary/5 backdrop-blur-md animate-[pulse_2.6s_ease-in-out_infinite]" : "border-border bg-card/50 opacity-60 hover:opacity-100"} ${isActive ? 'ring-4 ring-primary ring-offset-2 ring-offset-background z-10' : ''}`}
                  onClick={() => { setActiveSlideNumber(i + 1); if (status === "completed") setReviewSlideNumber(i + 1); }}>
                  {image ? <img src={image} alt={`Tmb ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" /> : null}
                  {status === "generating" || (status === "pending" && isDispatching && (i + 1 === activeSlideNumber || activeSlideNumber === null)) ? (
                    <div className="flex flex-col items-center gap-1 z-10">
                      <Loader2 className="h-5 w-5 text-primary animate-[spin_2.4s_linear_infinite]" />
                    </div>
                  ) : !image ? (
                    <span className="text-lg font-black text-muted-foreground/30 z-10">{i + 1}</span>
                  ) : null}
                  <div className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5 backdrop-blur-sm z-20">
                    {status === "completed" ? <CheckCircle2 className="h-3 w-3 text-primary" /> : status === "generating" ? <div className="h-2 w-2 rounded-full bg-primary animate-ping m-0.5" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground m-0.5" />}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* REVIEW CONTROLS — Fixed bottom bar, always visible when in review mode */}
        <AnimatePresence>
          {reviewMode && centralStatus === "completed" && centralImage && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-xl border-t-2 border-primary/20 shadow-2xl"
            >
              <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    ✏️ Want changes? Describe them:
                  </p>
                  <Textarea
                    placeholder="e.g., 'Make the headline smaller', 'Change background to blue'"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="resize-none min-h-[56px] max-h-[80px] border-primary/20 bg-card text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary rounded-xl p-3"
                  />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={handleRedesign}
                    disabled={!feedback.trim() || isSubmittingFeedback}
                    variant="outline"
                    className="h-12 rounded-xl text-primary font-bold border-primary/20 hover:bg-primary/10 px-5"
                  >
                    {isSubmittingFeedback ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Redesign
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="h-12 rounded-xl font-black shadow-glow px-6 text-sm"
                    disabled={isSubmittingFeedback}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {hasMoreSlides
                      ? `Looks Good, Continue with Slide ${nextSlideNumberForCta ?? "next"}`
                      : "Looks Good, View Results"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All done CTA — when review is done and all complete */}
        {!reviewMode && !hasMoreSlides && completedCount >= slideCount && completedCount > 0 && (
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
                <p className="text-sm text-muted-foreground">Your screenshot set is complete.</p>
              </div>
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl px-8 shadow-glow flex-shrink-0" onClick={() => navigate(`/project/${projectId}/results`)}>
              <Download className="mr-2 h-5 w-5" />
              View & Download Results
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Generating;
