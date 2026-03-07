import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/lib/demo-data";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Layers, BarChart3, Image, Globe } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
  editing: 'bg-info/10 text-info border-info/20',
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your screenshot projects</p>
          </div>
          <Button variant="hero" onClick={() => navigate('/new-project')}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projects', value: '3', icon: Layers },
            { label: 'Generated Sets', value: '12', icon: Image },
            { label: 'Total Slides', value: '67', icon: BarChart3 },
            { label: 'Locales', value: '4', icon: Globe },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent projects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoProjects.map(p => (
              <div
                key={p.id}
                className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-glow transition-all cursor-pointer"
                onClick={() => navigate(`/project/${p.id}/planner`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.appName} • {p.category}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.slideCount} slides • {p.locale}</span>
                  <span>{p.lastUpdated}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.template}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}

            {/* New project card */}
            <div
              className="rounded-xl border border-dashed border-border/50 bg-card/50 p-5 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => navigate('/new-project')}
            >
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Create new project</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
