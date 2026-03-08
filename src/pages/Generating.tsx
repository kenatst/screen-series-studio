import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProjectSlides } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";

const stages = [
  'Analyzing brand identity...',
  'Analyzing visual references...',
  'Building creative direction...',
  'Planning slide compositions...',
  'Generating slide visuals...',
  'Harmonizing set consistency...',
  'Preparing exports...',
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
};

const Generating = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: dbSlides } = useProjectSlides(projectId);

  const slidesLength = dbSlides?.length || 5;

  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [slideStatuses, setSlideStatuses] = useState<('pending' | 'generating' | 'completed')[]>(
    Array(slidesLength).fill('pending')
  );

  useEffect(() => {
    setSlideStatuses(Array(slidesLength).fill('pending'));
  }, [slidesLength]);

  useEffect(() => {
    if (!projectId) return;

    // Simulate analysis stages first
    const warmupInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 20) {
          clearInterval(warmupInterval);
          return 20;
        }
        return prev + 5;
      });
      setCurrentStage(s => Math.min(s + 1, 3));
    }, 800);

    // Call the edge function via fetch with SSE
    const startGeneration = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok || !response.body) {
          console.error("Failed to start generation");
          setTimeout(() => navigate(`/project/${projectId}/results`), 2000);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let totalSlides = slidesLength;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 2);

            const lines = chunk.split('\n');
            let eventType = '';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) eventType = line.slice(7);
              else if (line.startsWith('data: ')) eventData = line.slice(6);
            }

            if (!eventType || !eventData) continue;

            try {
              const data = JSON.parse(eventData);

              if (eventType === 'slide-start') {
                totalSlides = data.total || slidesLength;
                setCurrentStage(4);
                setProgress(20 + ((data.slideNumber - 1) / totalSlides) * 70);
                setSlideStatuses(prev => {
                  const next = [...prev];
                  if (data.slideNumber - 1 < next.length) next[data.slideNumber - 1] = 'generating';
                  return next;
                });
              } else if (eventType === 'slide-done') {
                setSlideStatuses(prev => {
                  const next = [...prev];
                  if (data.slideNumber - 1 < next.length) next[data.slideNumber - 1] = 'completed';
                  return next;
                });
                setProgress(20 + ((data.slideNumber) / totalSlides) * 70);
              } else if (eventType === 'all-done') {
                setProgress(100);
                setCurrentStage(6);
                setTimeout(() => navigate(`/project/${projectId}/results`), 1500);
              } else if (eventType === 'slide-error') {
                console.error("Generation error:", data);
                setSlideStatuses(prev => {
                  const next = [...prev];
                  if (data.slideNumber - 1 < next.length) next[data.slideNumber - 1] = 'completed';
                  return next;
                });
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      } catch (err) {
        console.error("SSE connection error:", err);
        setTimeout(() => navigate(`/project/${projectId}/results`), 2000);
      }
    };

    // Start generation after a brief warmup
    const timer = setTimeout(startGeneration, 500);

    return () => {
      clearInterval(warmupInterval);
      clearTimeout(timer);
    };
  }, [navigate, projectId, slidesLength]);

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
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">Harmonizing visual rules and executing pixel-perfect generated assets for all {slideStatuses.length} slides simultaneously.</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="w-full max-w-4xl mb-16 relative z-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stages[currentStage]}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
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
          {slideStatuses.map((status, i) => (
            <motion.div
              key={i}
              initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}
              className={`relative aspect-[9/19.5] rounded-3xl border flex flex-col items-center justify-center transition-all duration-700 overflow-hidden shadow-elevated ${status === 'completed' ? 'border-primary/50 bg-card/90 shadow-glow scale-100 backdrop-blur-md' :
                status === 'generating' ? 'border-primary/30 bg-primary/5 scale-[1.03] backdrop-blur-xl' :
                  'border-border bg-card/90 scale-95 opacity-50 backdrop-blur-sm'
                }`}
            >
              {status === 'generating' && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent animate-pulse" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                </>
              )}

              <div className="relative z-10 flex flex-col items-center">
                {status === 'completed' ? (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="h-14 w-14 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 shadow-glow">
                    <CheckCircle2 className="h-7 w-7 text-primary" />
                  </motion.div>
                ) : status === 'generating' ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted border border-border mb-4" />
                )}
                <span className="text-sm font-black text-foreground tracking-tight">Slide {i + 1}</span>
                <Badge className={`mt-3 text-[10px] uppercase tracking-widest font-bold shadow-sm ${status === 'completed' ? 'bg-primary text-primary-foreground border-none' :
                  status === 'generating' ? 'bg-card/90 text-primary border-primary/30' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>{status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Generating;
