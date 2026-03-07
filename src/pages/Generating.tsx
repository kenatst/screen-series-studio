import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

const stages = [
  'Analyzing brand identity...',
  'Analyzing visual references...',
  'Building creative direction...',
  'Planning slide compositions...',
  'Generating slide visuals...',
  'Harmonizing set consistency...',
  'Preparing exports...',
];

const Generating = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [slideStatuses, setSlideStatuses] = useState<('pending' | 'generating' | 'completed')[]>(
    Array(5).fill('pending')
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 2, 100);
        const stageIdx = Math.min(Math.floor(next / (100 / stages.length)), stages.length - 1);
        setCurrentStage(stageIdx);

        setSlideStatuses(prev => {
          const newStatuses = [...prev];
          const completedCount = Math.floor(next / 20);
          for (let i = 0; i < 5; i++) {
            if (i < completedCount) newStatuses[i] = 'completed';
            else if (i === completedCount && next % 20 > 5) newStatuses[i] = 'generating';
            else newStatuses[i] = 'pending';
          }
          return newStatuses;
        });

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate(`/project/${projectId}/results`), 1000);
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [navigate, projectId]);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Generating your screenshot set</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Creating your cohesive screenshot series</h2>
          <p className="text-muted-foreground">Ensuring visual consistency across all {slideStatuses.length} slides...</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{stages[currentStage]}</span>
            <span className="text-sm font-mono text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          {slideStatuses.map((status, i) => (
            <div
              key={i}
              className={`aspect-[9/19.5] rounded-xl border flex flex-col items-center justify-center transition-all ${
                status === 'completed' ? 'border-success/30 bg-success/5' :
                status === 'generating' ? 'border-primary/30 bg-primary/5 animate-pulse' :
                'border-border/50 bg-card'
              }`}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : status === 'generating' ? (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-secondary" />
              )}
              <span className="mt-2 text-xs font-medium text-muted-foreground">Slide {i + 1}</span>
              <Badge className={`mt-1 text-[10px] ${
                status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                status === 'generating' ? 'bg-primary/10 text-primary border-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>{status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Generating;
