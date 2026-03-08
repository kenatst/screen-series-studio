import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { demoTemplates, templateMoods } from "@/lib/demo-data";
import { Search } from "lucide-react";

// Agency gallery images
import agency01 from "@/assets/gallery/agency-01-habit.png";
import agency02 from "@/assets/gallery/agency-02-coach.png";
import agency03 from "@/assets/gallery/agency-03-map.png";
import agency04 from "@/assets/gallery/agency-04-subs.png";
import agency05 from "@/assets/gallery/agency-05-water.png";
import agency06 from "@/assets/gallery/agency-06-sugar.png";
import agency07 from "@/assets/gallery/agency-07-aura.png";
import agency08 from "@/assets/gallery/agency-08-scribe.png";
import agency09 from "@/assets/gallery/agency-09-trainer.png";
import agency10 from "@/assets/gallery/agency-10-stackr.png";
import agency11 from "@/assets/gallery/agency-11-trainer-ai.png";
import agency12 from "@/assets/gallery/agency-12-stackr-yellow.png";
import agency13 from "@/assets/gallery/agency-13-vow.png";
import agency14 from "@/assets/gallery/agency-14-rpg.png";
import agency15 from "@/assets/gallery/agency-15-cram.png";
import agency16 from "@/assets/gallery/agency-16-adblock.png";
import agency17 from "@/assets/gallery/agency-17-drift.png";
import agency18 from "@/assets/gallery/agency-18-coaching.png";
import agency19 from "@/assets/gallery/agency-19-tape.png";
import agency20 from "@/assets/gallery/agency-20-solo.png";
import agency21 from "@/assets/gallery/agency-21-minddrop.png";
import agency22 from "@/assets/gallery/agency-22-mealplan.png";
import agency23 from "@/assets/gallery/agency-23-vault.jpeg";
import agency24 from "@/assets/gallery/agency-24-linguaflow.png";
import agency25 from "@/assets/gallery/agency-25-nestle.png";
import agency26 from "@/assets/gallery/agency-26-lifeplan.png";


const templatePreviews: Record<string, string> = {
  'Habit Tracker': agency01,
  'AI Coach': agency02,
  'Map Explorer': agency03,
  'Subscription Manager': agency04,
  'Hydration': agency05,
  'Sugar Free': agency06,
  'Aura Mood': agency07,
  'Scribe Notes': agency08,
  'Personal Trainer': agency09,
  'Stackr Finance': agency10,
  'Trainer AI': agency11,
  'Stackr Yellow': agency12,
  'Vow Couples': agency13,
  'RPG Gaming': agency14,
  'Cram Study': agency15,
  'AdBlock Shield': agency16,
  'Drift Meditation': agency17,
  'Life Coaching': agency18,
  'Tape Recorder': agency19,
  'Solo Travel': agency20,
  'MindDrop Journal': agency21,
  'Meal Planner': agency22,
  'Vault Security': agency23,
  'LinguaFlow': agency24,
  'Nestle Wellness': agency25,
  'LifePlan Goals': agency26,
};

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
