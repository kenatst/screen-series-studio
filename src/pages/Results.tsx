import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultStorylines } from "@/lib/demo-data";
import { useNavigate } from "react-router-dom";
import {
  Download, RefreshCw, Copy, Edit3, Globe, GitBranch, CheckCircle2,
  Layers, ArrowRight, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Results = () => {
  const navigate = useNavigate();
  const slides = defaultStorylines['5-slide'];
  const [selectedSlide, setSelectedSlide] = useState(slides[0]);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main Preview */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Generated Screenshot Set</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Consistent</Badge>
                <span className="text-sm text-muted-foreground">5 slides • Premium Gradient • Balanced consistency</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"><Download className="mr-1 h-4 w-4" /> Download all</Button>
              <Button variant="secondary" size="sm"><Copy className="mr-1 h-4 w-4" /> Duplicate project</Button>
              <Button variant="secondary" size="sm"><Globe className="mr-1 h-4 w-4" /> Localize</Button>
              <Button variant="secondary" size="sm"><GitBranch className="mr-1 h-4 w-4" /> A/B Variant</Button>
            </div>
          </div>

          {/* Large preview */}
          <div className="mb-6 flex justify-center">
            <div className="aspect-[9/19.5] w-72 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-elevated">
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-primary">{selectedSlide.number}</span>
                </div>
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">{selectedSlide.objective}</Badge>
                <h3 className="text-lg font-bold text-foreground mb-1">{selectedSlide.headline}</h3>
                <p className="text-xs text-muted-foreground mb-4">{selectedSlide.subheadline}</p>
                <div className="w-full h-32 rounded-lg bg-secondary border border-border/50" />
                <div className="mt-3 flex gap-1">
                  <Badge className="bg-secondary text-muted-foreground text-[10px]">{selectedSlide.rawScreenTag}</Badge>
                  <Badge className="bg-secondary text-muted-foreground text-[10px]">{selectedSlide.emphasis}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail rail */}
          <div className="flex gap-3 justify-center">
            {slides.map(slide => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlide(slide)}
                className={`aspect-[9/19.5] w-16 rounded-lg border flex flex-col items-center justify-center p-1 transition-all ${
                  selectedSlide.id === slide.id ? 'border-primary shadow-glow' : 'border-border/50 bg-card hover:border-primary/30'
                }`}
              >
                <span className="text-[10px] font-bold text-primary">{slide.number}</span>
                <div className="h-4 w-full rounded bg-secondary mt-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Side editor */}
        {editingSlide ? (
          <div className="w-96 border-l border-border/50 bg-card p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Edit Slide {selectedSlide.number}</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingSlide(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Headline</label>
                <Input defaultValue={selectedSlide.headline} className="bg-secondary border-border text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subheadline</label>
                <Input defaultValue={selectedSlide.subheadline} className="bg-secondary border-border text-sm" />
              </div>
              <div className="space-y-3">
                <Button variant="default" size="sm" className="w-full"><RefreshCw className="mr-1 h-3 w-3" /> Regenerate this slide</Button>
                <Button variant="secondary" size="sm" className="w-full">Generate 3 variants</Button>
                <Button variant="secondary" size="sm" className="w-full">Apply style to all slides</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-80 border-l border-border/50 bg-card p-6 overflow-auto">
            <h3 className="font-semibold text-foreground mb-4">Slide Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Objective</span>
                <p className="text-sm font-medium text-foreground">{selectedSlide.objective}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Headline</span>
                <p className="text-sm font-medium text-foreground">{selectedSlide.headline}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Raw screen</span>
                <Badge className="bg-secondary text-muted-foreground">{selectedSlide.rawScreenTag}</Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Emphasis</span>
                <Badge className="bg-secondary text-muted-foreground">{selectedSlide.emphasis}</Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Importance</span>
                <Badge className={`${selectedSlide.importance === 'high' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-info/10 text-info border-info/20'}`}>
                  {selectedSlide.importance}
                </Badge>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Button variant="default" size="sm" className="w-full" onClick={() => setEditingSlide(selectedSlide.id)}>
                <Edit3 className="mr-1 h-3 w-3" /> Edit slide
              </Button>
              <Button variant="secondary" size="sm" className="w-full"><RefreshCw className="mr-1 h-3 w-3" /> Regenerate</Button>
              <Button variant="secondary" size="sm" className="w-full"><Copy className="mr-1 h-3 w-3" /> Duplicate</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Results;
