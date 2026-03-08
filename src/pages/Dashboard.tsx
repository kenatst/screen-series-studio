import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutTemplate, Copy, Play, Loader2, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { canCreateProject, getPlanById } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-accent/20 text-accent',
  completed: 'bg-primary/20 text-primary',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();
  const { toast } = useToast();
  const { data: projects, isLoading } = useProjects();
  const plan = getPlanById(profile?.plan || 'free');

  const handleNewProject = () => {
    if (!canCreateProject(profile?.plan || 'free', projects?.length || 0)) {
      toast({ title: "Limite atteinte", description: `Votre plan ${plan.name} permet ${plan.limits.maxProjects} projet(s). Passez à un plan supérieur.`, variant: "destructive" });
      return;
    }
    navigate('/project/new');
  };

  const currentProject = projects?.[0];
  const recentProjects = projects?.slice(1) || [];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-medium text-lg">Create, edit, and export your screenshot sets</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
              <Crown className="h-3 w-3 mr-1" /> {plan.name}
            </Badge>
            <Button variant="outline" size="sm" onClick={signOut} className="rounded-xl">Sign out</Button>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl px-6" onClick={handleNewProject}>
              <Plus className="mr-2 h-5 w-5" /> New project
            </Button>
          </div>
        </motion.div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!projects || projects.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <LayoutTemplate className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Create your first screenshot set to get started</p>
            <Button onClick={() => navigate('/project/new')} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Create first project
            </Button>
          </motion.div>
        )}

        {currentProject && (
          <div className="mb-12">
            <motion.h2
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-foreground mb-4 tracking-tight flex items-center gap-2"
            >
              Continue working
            </motion.h2>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="group relative rounded-2xl border border-border bg-card/40 p-8 hover:border-primary/40 hover:shadow-glow transition-all duration-500 overflow-hidden backdrop-blur-sm cursor-pointer"
              onClick={() => {
                if (currentProject.status === 'completed') navigate(`/project/${currentProject.id}/results`);
                else if (currentProject.status === 'generating') navigate(`/project/${currentProject.id}/generating`);
                else navigate(`/project/${currentProject.id}/planner`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <span className="text-4xl bg-muted rounded-xl p-4 border border-border shadow-inner group-hover:border-primary/30 transition-colors shadow-xl">
                    📱
                  </span>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">{currentProject.name}</h3>
                      <Badge className={statusColors[currentProject.status] || statusColors.draft}>{currentProject.status}</Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">{currentProject.app_name || 'App'} · {currentProject.platform}</p>
                  </div>
                </div>
                <Button variant="default" className="rounded-xl font-bold px-6">
                  {currentProject.status === 'completed' ? 'View Results' : currentProject.status === 'generating' ? 'View Progress' : 'Continue'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {recentProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 tracking-tight">All Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial="hidden" animate="visible" variants={fadeUp} custom={i + 3}
                  className="group rounded-2xl border border-border bg-card/40 p-6 hover:border-primary/30 hover:shadow-glow transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  onClick={() => {
                    if (project.status === 'completed') navigate(`/project/${project.id}/results`);
                    else navigate(`/project/${project.id}/planner`);
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📱</span>
                    <h3 className="font-bold text-foreground tracking-tight truncate">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{project.platform}</Badge>
                    <Badge className={`text-xs ${statusColors[project.status] || statusColors.draft}`}>{project.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
