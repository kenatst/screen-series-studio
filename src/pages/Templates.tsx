import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { demoTemplates, templateMoods } from "@/lib/demo-data";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { templatePreviews } from "@/constants/templates";

const categories = ['All', 'Business', 'Entertainment', 'Education', 'Lifestyle', 'Luxury', 'Media'];
const tones = ['All', 'corporate', 'bold', 'premium', 'playful', 'minimalist'];

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || 'All';
  const selectedTone = searchParams.get('tone') || 'All';
  const selectedMood = searchParams.get('mood') || 'All';
  const search = searchParams.get('q') || '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'All' || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const filtered = demoTemplates.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedTone !== 'All' && t.tone !== selectedTone) return false;
    if (selectedMood !== 'All' && t.mood !== selectedMood) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border bg-card/30">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary uppercase tracking-widest font-bold bg-primary/5">
              Template Gallery
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6">
              Start with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">proven foundation</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium mb-10">
              High-converting, production-ready layouts for every app category. Just select a template and customize 10 screens instantly.
            </p>

            <div className="flex gap-4 items-center mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-10 w-10 rounded-full border-2 border-background flex shadow-lg items-center justify-center text-xs font-bold ${i === 1 ? 'bg-primary text-primary-foreground' :
                    i === 2 ? 'bg-orange-500 text-white' :
                      'bg-accent text-accent-foreground'
                    }`}>
                    T{i}
                  </div>
                ))}
              </div>
              <span className="text-sm font-bold text-muted-foreground">26 premium templates</span>
            </div>

            {/* Search Bar in Hero */}
            <div className="relative w-full max-w-md mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search templates (e.g., Finance, Bold, Dark)..."
                  value={search}
                  onChange={e => setFilter('q', e.target.value)}
                  className="pl-12 pr-4 h-14 bg-background/80 border-border/50 text-foreground text-base rounded-xl backdrop-blur-xl shadow-inner focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Filters */}
          <div className="flex flex-col xl:flex-row gap-6 mb-8 items-start xl:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mr-2 hidden sm:inline-block">Category:</span>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter('category', c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-300 ${selectedCategory === c ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Mood filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="text-sm text-muted-foreground mr-2">Mood:</span>
            {templateMoods.map(m => (
              <button
                key={m}
                onClick={() => setFilter('mood', m)}
                className={`px-3 py-1 rounded-lg text-xs capitalize border transition-colors ${selectedMood === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'}`}
              >
                {m === 'dark' ? '🌙 Dark' : m === 'light' ? '☀️ Light' : m === 'colorful' ? '🌈 Colorful' : m === 'neutral' ? '⚪ Neutral' : '🎨 All'}
              </button>
            ))}
          </div>

          {/* Style filter — was outside container, now inside */}
          <div className="flex gap-2 flex-wrap mb-10 items-center">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mr-2 hidden sm:inline-block">Style:</span>
            {tones.map(t => (
              <button
                key={t}
                onClick={() => setFilter('tone', t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border transition-all duration-300 ${selectedTone === t ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(template => (
              <div
                key={template.id}
                onClick={() => navigate(`/project/new?template=${template.id}`)}
                className="group rounded-2xl border border-border bg-zinc-900/40 overflow-hidden hover:border-primary/40 hover:shadow-glow transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent border-b border-border">
                  {templatePreviews[template.name] ? (
                    <img src={templatePreviews[template.name]} alt={template.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground/30">{template.name}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3 bg-card/90">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{template.name}</span>
                    <Badge className="text-[9px] bg-muted text-muted-foreground border-border capitalize">{template.mood}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map(tag => (
                      <Badge key={tag} className="bg-black/5 text-muted-foreground text-[10px] border-border uppercase tracking-wider">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">{template.bestFor}</p>
                  <div className="flex items-center justify-between text-[10px] text-foreground/40 pt-2 border-t border-border uppercase tracking-widest font-bold">
                    <span className="text-primary/80">{template.complexity}</span>
                    <span>{template.slidesSupported} slides</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground border border-dashed border-border rounded-2xl bg-card/20">
              <Search className="h-10 w-10 mx-auto text-primary/40 mb-4" />
              <p className="text-xl font-bold text-foreground">No templates match your filters.</p>
              <p className="text-sm mt-2">Try adjusting mood, tone, or category.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Templates;
