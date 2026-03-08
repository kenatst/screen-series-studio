import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useProject, useProjectSlides } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";

const stages = [
  "Analyzing brand identity...",
  "Analyzing visual references...",
  "Building creative direction...",
  "Planning slide compositions...",
  "Generating slide visuals...",
  "Harmonizing set consistency...",
  "Preparing exports...",
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

  const startedRef = useRef(false);
  const redirectedRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);

  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [slideStatuses, setSlideStatuses] = useState<SlideUiStatus[]>([]);
  const [slideImages, setSlideImages] = useState<(string | null)[]>([]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const routeToResults = () => {
    if (!projectId || redirectedRef.current) return;
    redirectedRef.current = true;
    setTimeout(() => navigate(`/project/${projectId}/results`), 1200);
  };

  const applyLiveSlides = (slides: Array<{ slide_number: number; status: string; image_url: string | null }>) => {
    if (!slides.length) return;

    const ordered = [...slides].sort((a, b) => a.slide_number - b.slide_number);
    const statuses = ordered.map((slide) => normalizeStatus(slide.status, slide.image_url));
    const images = ordered.map((slide) => slide.image_url || null);

    setSlideStatuses(statuses);
    setSlideImages(images);

    const total = statuses.length;
    const completedCount = statuses.filter((s) => s === "completed").length;
    const hasGenerating = statuses.some((s) => s === "generating");

    if (completedCount >= total) {
      setCurrentStage(6);
      setProgress(100);
      routeToResults();
      return;
    }

    const nextProgress = Math.min(
      95,
      Math.round(20 + (completedCount / total) * 70 + (hasGenerating ? (70 / total) * 0.35 : 0))
    );

    setProgress((prev) => Math.max(prev, nextProgress));

    if (hasGenerating) setCurrentStage(4);
    else if (completedCount > 0) setCurrentStage(5);
  };

  useEffect(() => {
    if (!dbSlides?.length) return;

    applyLiveSlides(
      dbSlides.map((slide) => ({
        slide_number: slide.slide_number,
        status: slide.status,
        image_url: slide.image_url,
      }))
    );
  }, [dbSlides]);

  useEffect(() => {
    if (!projectId || startedRef.current) return;
    startedRef.current = true;

    const warmupInterval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 20) {
          window.clearInterval(warmupInterval);
          return 20;
        }
        return prev + 5;
      });
      setCurrentStage((s) => Math.min(s + 1, 3));
    }, 800);

    const startPolling = () => {
      if (pollIntervalRef.current || !projectId) return;

      pollIntervalRef.current = window.setInterval(async () => {
        const { data } = await supabase
          .from("project_slides")
          .select("slide_number,status,image_url")
          .eq("project_id", projectId)
          .order("slide_number", { ascending: true });

        if (!data?.length) return;

        applyLiveSlides(data);

        const isDone = data.every((slide) => normalizeStatus(slide.status, slide.image_url) === "completed");
        if (isDone) stopPolling();
      }, 2500);
    };

    const startGenerationStream = async (accessToken: string) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      requestAbortRef.current = new AbortController();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ project_id: projectId }),
        signal: requestAbortRef.current.signal,
      });

      if (response.status === 409) {
        startPolling();
        return;
      }

      if (!response.ok || !response.body) {
        startPolling();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              const index = Math.max(0, (data.slideNumber || 1) - 1);
              setCurrentStage(4);

              setSlideStatuses((prev) => {
                const length = Math.max(prev.length, index + 1, data.total || 0);
                const next = Array.from({ length }, (_, i) => prev[i] ?? "pending") as SlideUiStatus[];
                next[index] = "generating";
                return next;
              });

              setSlideImages((prev) => {
                const length = Math.max(prev.length, index + 1, data.total || 0);
                return Array.from({ length }, (_, i) => prev[i] ?? null);
              });
            }

            if (eventType === "slide-done") {
              const index = Math.max(0, (data.slideNumber || 1) - 1);

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
              setCurrentStage(6);
              setProgress(100);
              routeToResults();
              stopPolling();
              return;
            }
          } catch {
            // Ignore malformed SSE events
          }
        }
      }

      startPolling();
    };

    const bootstrap = async () => {
      if (!projectId) return;

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

      if (!latestSlides?.length) return;

      applyLiveSlides(latestSlides);

      const hasIncomplete = latestSlides.some(
        (slide) => normalizeStatus(slide.status, slide.image_url) !== "completed"
      );
      const hasStarted = latestSlides.some(
        (slide) => slide.status === "generating" || normalizeStatus(slide.status, slide.image_url) === "completed"
      );

      if (!hasIncomplete) {
        routeToResults();
        return;
      }

      if (project?.status === "generating" && hasStarted) {
        startPolling();
        return;
      }

      await startGenerationStream(session.access_token);
    };

    const timer = window.setTimeout(bootstrap, 500);

    return () => {
      window.clearInterval(warmupInterval);
      window.clearTimeout(timer);
      stopPolling();
      requestAbortRef.current?.abort();
    };
  }, [navigate, project?.status, projectId]);

  const slideCount = slideStatuses.length || 5;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-card/90 border border-border shadow-elevated backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-foreground tracking-widest uppercase">Consistency Engine Active</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-foreground mb-4 drop-shadow-xl">Forging your series</h2>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">Live sync active: your existing slides stay intact, and generation resumes without restarting credits.</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="w-full max-w-4xl mb-16 relative z-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stages[currentStage]}</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 via-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "circOut", duration: 0.5 }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-6xl relative z-10">
          {Array.from({ length: slideCount }).map((_, i) => {
            const status = slideStatuses[i] ?? "pending";
            const image = slideImages[i];

            return (
              <motion.div
                key={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 2}
                className={`relative aspect-[9/19.5] rounded-3xl border flex flex-col items-center justify-center transition-all duration-700 overflow-hidden shadow-elevated ${status === "completed"
                  ? "border-primary/50 bg-card/90 shadow-glow scale-100 backdrop-blur-md"
                  : status === "generating"
                    ? "border-primary/30 bg-primary/5 scale-[1.03] backdrop-blur-xl"
                    : status === "error"
                      ? "border-destructive/40 bg-destructive/5 scale-100"
                      : "border-border bg-card/90 scale-95 opacity-50 backdrop-blur-sm"
                  }`}
              >
                {image ? (
                  <img src={image} alt={`Slide ${i + 1} preview`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : null}

                {!image && status === "generating" && (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent animate-pulse" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                  </>
                )}

                <div className={`relative z-10 flex flex-col items-center ${image ? "bg-background/70 px-3 py-2 rounded-xl border border-border" : ""}`}>
                  {!image && status === "completed" ? (
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="h-14 w-14 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 shadow-glow">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </motion.div>
                  ) : !image && status === "generating" ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                  ) : !image && status === "error" ? (
                    <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                  ) : !image ? (
                    <div className="h-10 w-10 rounded-full bg-muted border border-border mb-4" />
                  ) : null}

                  <span className="text-sm font-black text-foreground tracking-tight">Slide {i + 1}</span>
                  <Badge className={`mt-3 text-[10px] uppercase tracking-widest font-bold shadow-sm ${status === "completed"
                    ? "bg-primary text-primary-foreground border-none"
                    : status === "generating"
                      ? "bg-card/90 text-primary border-primary/30"
                      : status === "error"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>{statusLabel[status]}</Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Generating;
