import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutTemplate, Loader2, Crown, CreditCard, Settings, ArchiveRestore, Archive, Coins, Layers, FolderKanban } from "lucide-react";
import { motion } from "framer-motion";
import { useProjects, useProjectSlides, useArchiveProject, useUnarchiveProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { canCreateProject, getPlanById } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBilling } from "@/hooks/useBilling";
import { ProjectThumbnail } from "@/components/dashboard/ProjectThumbnail";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-accent/20 text-accent',
  completed: 'bg-primary/20 text-primary',
  archived: 'bg-muted text-muted-foreground/60',
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, profile, checkSubscription } = useAuth();
  const { toast } = useToast();
  const { data: projects, isLoading } = useProjects();
  const plan = getPlanById(profile?.plan || 'free');
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { handleUpgrade, handleManageSubscription, isOpeningPortal } = useBilling();
  const unarchiveProject = useUnarchiveProject();
  const archiveProject = useArchiveProject();

  const activeProjects = projects?.filter(p => p.status !== 'archived') || [];
  const archivedProjects = projects?.filter(p => p.status === 'archived') || [];
  const completedProjects = activeProjects.filter(p => p.status === 'completed').length;

  const handleNewProject = () => {
    if (!canCreateProject(profile?.plan || 'free', activeProjects.length)) {
      toast({ title: "Limit reached", description: `Your ${plan.name} plan allows ${plan.limits.maxProjects} project(s). Upgrade to a higher plan.`, variant: "destructive" });
      return;
    }
    navigate('/project/new');
  };

  const handleRefreshSub = async () => {
    setIsCheckingSub(true);
    await checkSubscription();
    setIsCheckingSub(false);
    toast({ title: "Status updated", description: `Current plan: ${plan.name}` });
  };

  const handleUnarchive = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      await unarchiveProject.mutateAsync(projectId);
      toast({ title: "Project restored", description: "Project is active again." });
    } catch {
      toast({ title: "Error", description: "Could not restore the project.", variant: "destructive" });
    }
  };

  const handleArchive = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to archive this project?")) return;
    try {
      await archiveProject.mutateAsync(projectId);
      toast({ title: "Project archived" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not archive the project.", variant: "destructive" });
    }
  };

  const currentProject = activeProjects[0];
  const recentProjects = activeProjects.slice(1);

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
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              <Crown className="h-3 w-3 mr-1" /> {plan.name}
            </Badge>
            {profile?.subscriptionEnd && (
              <span className="text-xs text-muted-foreground">
                expires {new Date(profile.subscriptionEnd).toLocaleDateString()}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleRefreshSub} disabled={isCheckingSub} className="rounded-xl text-xs">
              {isCheckingSub ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
            </Button>
            {profile?.plan !== 'free' && (
              <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={isOpeningPortal} className="rounded-xl text-xs">
                {isOpeningPortal ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                Billing
              </Button>
            )}
            {profile?.plan === 'free' && (
              <Button variant="outline" size="sm" onClick={() => handleUpgrade('starter')} className="rounded-xl text-xs text-primary border-primary/30">
                Upgrade
              </Button>
            )}
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow rounded-xl px-6 font-black hover:scale-105 transition-all duration-300"
              onClick={handleNewProject}
            >
              <Plus className="mr-2 h-5 w-5" /> New project
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {!isLoading && projects && projects.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{activeProjects.length}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Projects</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{completedProjects}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sets Completed</p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-glow">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-primary">{profile?.credits ?? 0}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Credits Left</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!projects || projects.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 px-6 border border-dashed border-border rounded-3xl bg-card/20 backdrop-blur-sm max-w-2xl mx-auto shadow-sm">
            <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-primary/10 border border-primary/20 mb-8 shadow-inner">
              <LayoutTemplate className="h-12 w-12 text-primary drop-shadow-md" />
            </div>
            <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">No projects yet</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">Create your first screenshot set to start generating high-converting App Store visuals.</p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/project/new')} className="rounded-xl px-8 shadow-glow hover:scale-105 transition-all duration-300">
                <Plus className="mr-2 h-5 w-5" /> Create first project
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/templates')} className="rounded-xl px-8 hover:bg-secondary/50">
                Browse Templates
              </Button>
            </div>
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
                else if (currentProject.status === 'draft') navigate(`/project/new?project=${currentProject.id}`);
                else navigate(`/project/${currentProject.id}/planner`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-28 rounded-xl border border-border shadow-inner group-hover:border-primary/30 transition-colors shadow-xl overflow-hidden flex-shrink-0">
                    <ProjectThumbnail projectId={currentProject.id} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">{currentProject.app_name || currentProject.name}</h3>
                      <Badge className={statusColors[currentProject.status] || statusColors.draft}>{currentProject.status}</Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">{currentProject.app_name || 'App'} · {currentProject.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground hover:text-foreground" onClick={(e) => handleArchive(e, currentProject.id)}>
                    <Archive className="h-3 w-3 mr-1" /> Archive
                  </Button>
                  <Button variant="default" className="rounded-xl font-bold px-6">
                    {currentProject.status === 'completed' ? 'View Results' : currentProject.status === 'generating' ? 'View Progress' : 'Continue'}
                  </Button>
                </div>
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
                    else if (project.status === 'generating') navigate(`/project/${project.id}/generating`);
                    else if (project.status === 'draft') navigate(`/project/new?project=${project.id}`);
                    else navigate(`/project/${project.id}/planner`);
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-16 rounded-lg border border-border overflow-hidden flex-shrink-0">
                      <ProjectThumbnail projectId={project.id} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground tracking-tight truncate flex-1">{project.app_name || project.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{project.platform}</Badge>
                    <Badge className={`text-xs ${statusColors[project.status] || statusColors.draft}`}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleArchive(e, project.id)}>
                      <Archive className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Archived projects */}
        {archivedProjects.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <Archive className="h-4 w-4" />
              Archived ({archivedProjects.length})
              <span className="text-xs">{showArchived ? '▼' : '▶'}</span>
            </button>
            {showArchived && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial="hidden" animate="visible" variants={fadeUp} custom={i}
                    className="group rounded-2xl border border-border/50 bg-card/20 p-6 transition-all duration-300 backdrop-blur-sm opacity-60 hover:opacity-100"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-16 rounded-lg border border-border overflow-hidden flex-shrink-0 grayscale">
                        <ProjectThumbnail projectId={project.id} />
                      </div>
                      <h3 className="font-bold text-lg text-foreground tracking-tight truncate flex-1">{project.app_name || project.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{project.platform}</Badge>
                      <Badge className="text-xs bg-muted text-muted-foreground/60">archived</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs rounded-xl" onClick={(e) => handleUnarchive(e, project.id)}>
                        <ArchiveRestore className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout >
  );
};

export default Dashboard;
