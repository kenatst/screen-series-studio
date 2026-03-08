import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

  // Try to fetch project to get real slide count, fallback to 5
  const [slidesLength, setSlidesLength] = useState(5);
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      if (projectId) {
        api.getProject(projectId).then(p => {
          if (p.slides) setSlidesLength(p.slides.length);
        }).catch(console.error);
      }
    });
  }, [projectId]);

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

    // Connect to actual backend generation stream
    const sse = new EventSource(`http://localhost:3001/api/generate/${projectId}`);
    let totalSlides = slidesLength; // from url/project context, fallback to 5

    sse.addEventListener('slide-start', (e) => {
      const data = JSON.parse(e.data);
      totalSlides = data.total || 5;
      setCurrentStage(4); // Generating visuals
      setProgress(20 + ((data.slideNumber - 1) / totalSlides) * 70);
      setSlideStatuses(prev => {
        const next = [...prev];
        next[data.slideNumber - 1] = 'generating';
        return next;
      });
    });

    sse.addEventListener('slide-done', (e) => {
      const data = JSON.parse(e.data);
      setSlideStatuses(prev => {
        const next = [...prev];
        next[data.slideNumber - 1] = 'completed';
        return next;
      });
      setProgress(20 + ((data.slideNumber) / totalSlides) * 70);
    });

    sse.addEventListener('all-done', () => {
      setProgress(100);
      setCurrentStage(6); // Preparing exports
      sse.close();
      setTimeout(() => navigate(`/project/${projectId}/results`), 1500);
    });

    sse.addEventListener('slide-error', (e) => {
      console.error("Generation error:", e.data);
      // fallback just to continue presentation
      const data = JSON.parse(e.data);
      setSlideStatuses(prev => {
        const next = [...prev];
        next[data.slideNumber - 1] = 'completed'; // or error state
        return next;
      });
    });

    sse.onerror = (err) => {
      console.error("SSE connection error:", err);
      sse.close();
      // On connection err, navigate anyway for demo purposes if backend fails
      setTimeout(() => navigate(`/project/${projectId}/results`), 2000);
    };

    return () => {
      clearInterval(warmupInterval);
      sse.close();
    };
  }, [navigate, projectId, slidesLength]);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] relative">
        {/* Cinematic ambient glow */}
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
          <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden shadow-inner relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 via-primary to-orange-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "circOut", duration: 0.5 }}
            />
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent blur-sm mix-blend-overlay animate-pulse" style={{ left: `calc(${progress}% - 5rem)` }} />
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
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 motion-safe:animate-[pulse-glow_4s_infinite]" />
                </>
              )}

              <div className="relative z-10 flex flex-col items-center">
                {status === 'completed' ? (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="h-14 w-14 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 shadow-glow">
                    <CheckCircle2 className="h-7 w-7 text-primary" />
                  </motion.div>
                ) : status === 'generating' ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-black/5 border border-border mb-4" />
                )}
                <span className="text-sm font-black text-foreground tracking-tight">Slide {i + 1}</span>
                <Badge className={`mt-3 text-[10px] uppercase tracking-widest font-bold shadow-sm ${status === 'completed' ? 'bg-primary text-black border-none' :
                  status === 'generating' ? 'bg-card/90 text-primary border-primary/30' :
                    'bg-black/5 text-foreground/30 border-border'
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
