import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/lib/demo-data";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutTemplate, Copy, Play } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const Dashboard = () => {
  const navigate = useNavigate();

  const currentProject = demoProjects[0];
  const recentProjects = demoProjects.slice(1);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 font-medium text-lg">Create, edit, and export your screenshot sets</p>
          </div>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl px-6" onClick={() => navigate('/project/new')}>
            <Plus className="mr-2 h-5 w-5" /> New project
          </Button>
        </motion.div>

        {/* Continue Working - Main Card */}
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
              className="group relative rounded-2xl border border-border bg-card/40 p-8 hover:border-primary/40 hover:shadow-glow transition-all duration-500 overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <span className="text-4xl bg-black/40 rounded-xl p-4 border border-border shadow-inner group-hover:border-primary/30 transition-colors shadow-xl">
                    {currentProject.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">{currentProject.name}</h3>
                      <Badge variant="secondary" className="capitalize bg-black/40 border-border text-xs px-2 py-0.5">{currentProject.status}</Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                        {Math.floor(Number(currentProject.slideCount) / 2)} / {currentProject.slideCount} slides ready
                      </span>
                      <span>Updated {currentProject.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" className="border-border bg-black/20 hover:bg-black/40 hover:text-foreground">Preview</Button>
                  <Button variant="outline" className="border-border bg-black/20 hover:bg-black/40 hover:text-foreground">Export</Button>
                  <Button className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" onClick={() => navigate(`/project/${currentProject.id}/planner`)}>
                    <Play className="mr-2 h-4 w-4 fill-current" /> Resume
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Recent Projects Sidebar/Grid */}
          <div className="lg:col-span-2 space-y-4">
            <motion.h2
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2 mb-2"
            >
              Recent projects
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}
                  className="group relative rounded-xl border border-border bg-card/20 p-5 hover:border-primary/30 hover:bg-card/40 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm flex flex-col justify-between"
                  onClick={() => navigate(`/project/${p.id}/planner`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-2xl bg-black/30 rounded-lg p-2 border border-border">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">{p.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{p.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      {p.slideCount} slides
                    </div>
                    <span>{p.lastUpdated}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-foreground tracking-tight mb-2"
            >
              Quick actions
            </motion.h2>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-14 px-4 bg-card/20 border-border hover:bg-card/40 hover:border-primary/30 text-base font-medium rounded-xl group"
                onClick={() => navigate('/project/new')}
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
                New project
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 px-4 bg-card/20 border-border hover:bg-card/40 hover:border-primary/30 text-base font-medium rounded-xl group"
                onClick={() => navigate('/templates')}
              >
                <div className="w-8 h-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center mr-3 transition-colors">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                Start from template
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 px-4 bg-card/20 border-border hover:bg-card/40 hover:border-primary/30 text-base font-medium rounded-xl group"
              >
                <div className="w-8 h-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center mr-3 transition-colors">
                  <Copy className="h-4 w-4" />
                </div>
                Duplicate project
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

