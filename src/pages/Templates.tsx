import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { demoTemplates } from "@/lib/demo-data";
import { Search, LayoutGrid } from "lucide-react";

const categories = ['All', 'Business', 'Entertainment', 'Education', 'Lifestyle', 'Luxury', 'Media'];
const tones = ['All', 'corporate', 'bold', 'premium', 'playful', 'minimalist'];

const Templates = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTone, setSelectedTone] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = demoTemplates.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedTone !== 'All' && t.tone !== selectedTone) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">Premium templates for every app category and style.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedCategory === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <span className="text-sm text-muted-foreground mr-2">Tone:</span>
          {tones.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTone(t)}
              className={`px-3 py-1 rounded-lg text-xs capitalize border transition-colors ${
                selectedTone === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map(template => (
            <div
              key={template.id}
              className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-glow transition-all cursor-pointer"
            >
              <div className="aspect-[3/4] flex flex-col items-center justify-center p-4 bg-secondary/50">
                <LayoutGrid className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <span className="text-sm font-medium text-foreground text-center">{template.name}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <Badge key={tag} className="bg-secondary text-muted-foreground text-[10px] border-border">{tag}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{template.bestFor}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="capitalize">{template.complexity}</span>
                  <span>Up to {template.slidesSupported} slides</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Templates;
