import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { demoTemplates, templateMoods } from "@/lib/demo-data";
import { Search } from "lucide-react";

import { templatePreviews } from "@/constants/templates";

const categories = ['All', 'Business', 'Entertainment', 'Education', 'Lifestyle', 'Luxury', 'Media'];
const tones = ['All', 'corporate', 'bold', 'premium', 'playful', 'minimalist'];

const Templates = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTone, setSelectedTone] = useState('All');
  const [selectedMood, setSelectedMood] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = demoTemplates.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedTone !== 'All' && t.tone !== selectedTone) return false;
    if (selectedMood !== 'All' && t.mood !== selectedMood) return false;
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
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedCategory === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
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
              onClick={() => setSelectedMood(m)}
              className={`px-3 py-1 rounded-lg text-xs capitalize border transition-colors ${selectedMood === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'}`}
            >
              {m === 'dark' ? '🌙 Dark' : m === 'light' ? '☀️ Light' : m === 'colorful' ? '🌈 Colorful' : m === 'neutral' ? '⚪ Neutral' : '🎨 All'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <span className="text-sm text-muted-foreground mr-2">Tone:</span>
          {tones.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTone(t)}
              className={`px-3 py-1 rounded-lg text-xs capitalize border transition-colors ${selectedTone === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
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
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No templates match your filters.</p>
            <p className="text-sm mt-1">Try adjusting mood, tone, or category.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Templates;
