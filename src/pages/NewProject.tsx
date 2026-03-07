import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, Sparkles,
  GripVertical, Lock, Trash2, Plus, Wand2,
} from "lucide-react";
import { toneOptions, screenTags, slideObjectives, defaultStorylines, emphasisOptions } from "@/lib/demo-data";
import type { SlideItem } from "@/lib/demo-data";

const steps = [
  { id: 1, label: 'Project' },
  { id: 2, label: 'App Info' },
  { id: 3, label: 'Screens' },
  { id: 4, label: 'Brand Kit' },
  { id: 5, label: 'Style' },
  { id: 6, label: 'Planner' },
  { id: 7, label: 'Review' },
];

const NewProject = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideCount, setSlideCount] = useState(5);
  const [slides, setSlides] = useState<SlideItem[]>(defaultStorylines['5-slide']);
  const [consistencyLevel, setConsistencyLevel] = useState<'strict' | 'balanced' | 'exploratory'>('balanced');
  const [selectedTone, setSelectedTone] = useState('premium');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [uploadedScreens, setUploadedScreens] = useState<string[]>([]);
  const [platform, setPlatform] = useState('both');
  const [primaryGoal, setPrimaryGoal] = useState('');

  const handleSlideCountChange = (count: number) => {
    setSlideCount(count);
    const key = count <= 5 ? '5-slide' : '10-slide';
    const base = defaultStorylines[key];
    setSlides(base.slice(0, count));
  };

  const updateSlide = (id: string, field: keyof SlideItem, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const next = () => setCurrentStep(s => Math.min(s + 1, 7));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStep === step.id ? 'bg-primary text-primary-foreground' :
                  currentStep > step.id ? 'bg-success/10 text-success' :
                  'bg-secondary text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : <span>{step.id}</span>}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Project */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Create project</h2>
              <p className="text-muted-foreground">Set up your screenshot project basics.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Project name</label>
                <Input placeholder="e.g. LinguaPal US Launch" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">App name</label>
                <Input placeholder="e.g. LinguaPal" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Platform</label>
              <div className="flex gap-2">
                {['iOS', 'Android', 'Both'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      platform === p.toLowerCase() ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">App category</label>
                <Input placeholder="e.g. Education, Finance, Health" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target audience</label>
                <Input placeholder="e.g. Young professionals, students" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary goal</label>
              <div className="flex flex-wrap gap-2">
                {['Increase installs', 'Highlight features', 'Improve conversion', 'Localize assets', 'Launch new app', 'A/B testing'].map(g => (
                  <button
                    key={g}
                    onClick={() => setPrimaryGoal(g)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      primaryGoal === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: App Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">App information</h2>
              <p className="text-muted-foreground">Tell us about your app so we can craft the perfect screenshots.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Short description</label>
              <Input placeholder="A brief summary of your app" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Long description</label>
              <Textarea placeholder="Full app description..." className="bg-secondary border-border min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Value proposition</label>
              <Input placeholder="One line that captures your app's value" className="bg-secondary border-border" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Key features</label>
                <Textarea placeholder="List main features..." className="bg-secondary border-border min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Top benefits</label>
                <Textarea placeholder="What users gain..." className="bg-secondary border-border min-h-[80px]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tone of voice</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize border transition-colors ${
                      selectedTone === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"><Sparkles className="mr-1 h-3 w-3" /> Generate hooks from description</Button>
              <Button variant="secondary" size="sm"><Wand2 className="mr-1 h-3 w-3" /> Suggest storylines</Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Screens */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Upload raw screens</h2>
              <p className="text-muted-foreground">Drag & drop your app screenshots. Tag and organize them.</p>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Drop screenshots here</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
            </div>
            {/* Demo uploaded screens */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Uploaded screens (demo)</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {screenTags.slice(0, 6).map((tag, i) => (
                  <div key={tag} className="aspect-[9/19.5] rounded-lg border border-border/50 bg-secondary flex flex-col items-center justify-center p-2">
                    <div className="h-12 w-full rounded bg-muted mb-2" />
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{tag}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Brand Kit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Brand kit</h2>
              <p className="text-muted-foreground">Set your visual identity for consistent branding.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {['Logo', 'App Icon', 'Mascot'].map(label => (
                <div key={label} className="border border-dashed border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Upload {label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Brand colors</label>
              <div className="flex gap-3">
                {['#6C5CE7', '#00B894', '#FD79A8', '#FDCB6E', '#2D3436'].map(c => (
                  <div key={c} className="h-10 w-10 rounded-lg border border-border cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ))}
                <div className="h-10 w-10 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/30">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Visual preferences</label>
              <div className="flex flex-wrap gap-2">
                {['Keep app UI untouched', 'Allow visual enhancement', 'Use premium preset palette', 'Auto-detect from assets'].map(opt => (
                  <Badge key={opt} className="bg-secondary text-muted-foreground border-border cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors">{opt}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Style / Template */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Choose your style</h2>
              <p className="text-muted-foreground">Pick a template or upload references for inspiration.</p>
            </div>
            <div className="flex gap-3 mb-4">
              <Button variant={selectedTemplate !== 'reference' ? 'default' : 'secondary'} onClick={() => setSelectedTemplate('')}>Templates</Button>
              <Button variant={selectedTemplate === 'reference' ? 'default' : 'secondary'} onClick={() => setSelectedTemplate('reference')}>References</Button>
            </div>

            {selectedTemplate !== 'reference' ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Clean SaaS', 'Bold Gaming', 'Premium Gradient', 'Educational Playful', 'Lifestyle',
                  'Luxury Minimal', 'Feature-Led', 'Comparison', 'Mascot-Led', 'Cinematic'].map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedTemplate(name)}
                    className={`aspect-[3/4] rounded-xl border flex flex-col items-center justify-center p-3 transition-all ${
                      selectedTemplate === name ? 'border-primary bg-primary/5 shadow-glow' : 'border-border/50 bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="h-12 w-10 rounded bg-secondary mb-2" />
                    <span className="text-xs font-medium text-foreground text-center">{name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Upload 1–5 reference images</p>
                  <p className="text-xs text-muted-foreground">We'll extract the visual direction</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Inspiration notes</label>
                  <Textarea placeholder="e.g. Use this as inspiration for composition and intensity, but keep my branding and app content." className="bg-secondary border-border" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Planner */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Screenshot set planner</h2>
                <p className="text-muted-foreground">Define each slide's content and objective.</p>
              </div>
            </div>

            {/* Slide count */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Number of slides:</span>
              <div className="flex gap-2">
                {[3, 5, 7, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => handleSlideCountChange(n)}
                    className={`h-10 w-10 rounded-lg text-sm font-bold border transition-colors ${
                      slideCount === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Consistency Engine */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Consistency Engine</span>
              </div>
              <div className="flex gap-2">
                {(['strict', 'balanced', 'exploratory'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setConsistencyLevel(level)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize border transition-colors ${
                      consistencyLevel === level ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {consistencyLevel === 'strict' && 'All slides remain very homogeneous — same palette, framing, density.'}
                {consistencyLevel === 'balanced' && 'Same visual universe with controlled variations for each slide.'}
                {consistencyLevel === 'exploratory' && 'More creative freedom while maintaining a coherent base.'}
              </p>
            </div>

            {/* AI Suggestions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleSlideCountChange(5)}>
                <Sparkles className="mr-1 h-3 w-3" /> Generate 5-slide storyline
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSlideCountChange(10)}>
                <Sparkles className="mr-1 h-3 w-3" /> Generate 10-slide storyline
              </Button>
              <Button variant="secondary" size="sm"><Wand2 className="mr-1 h-3 w-3" /> Best order for conversion</Button>
            </div>

            {/* Slides */}
            <div className="space-y-3">
              {slides.map((slide) => (
                <div key={slide.id} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{slide.number}</span>
                        </div>
                        <select
                          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                          value={slide.objective}
                          onChange={e => updateSlide(slide.id, 'objective', e.target.value)}
                        >
                          {slideObjectives.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <Badge className={`${slide.importance === 'high' ? 'bg-accent/10 text-accent border-accent/20' : slide.importance === 'medium' ? 'bg-info/10 text-info border-info/20' : 'bg-muted text-muted-foreground'}`}>
                          {slide.importance}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          value={slide.headline}
                          onChange={e => updateSlide(slide.id, 'headline', e.target.value)}
                          placeholder="Headline"
                          className="bg-secondary border-border text-sm"
                        />
                        <Input
                          value={slide.subheadline}
                          onChange={e => updateSlide(slide.id, 'subheadline', e.target.value)}
                          placeholder="Subheadline"
                          className="bg-secondary border-border text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                          value={slide.rawScreenTag}
                          onChange={e => updateSlide(slide.id, 'rawScreenTag', e.target.value)}
                        >
                          {screenTags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                          value={slide.emphasis}
                          onChange={e => updateSlide(slide.id, 'emphasis', e.target.value)}
                        >
                          {emphasisOptions.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <Button variant="ghost" size="sm" className="h-6 text-xs"><Lock className="mr-1 h-3 w-3" />Lock</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive"><Trash2 className="mr-1 h-3 w-3" />Remove</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Pre-generation review</h2>
              <p className="text-muted-foreground">Review everything before generating your screenshot set.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Project summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Platform: <span className="text-foreground capitalize">{platform}</span></p>
                  <p>Tone: <span className="text-foreground capitalize">{selectedTone}</span></p>
                  <p>Template: <span className="text-foreground">{selectedTemplate || 'Not selected'}</span></p>
                  <p>Slides: <span className="text-foreground">{slideCount}</span></p>
                  <p>Consistency: <span className="text-foreground capitalize">{consistencyLevel}</span></p>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Slide headlines</h3>
                <div className="space-y-1">
                  {slides.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="text-primary font-mono">{s.number}.</span>
                      <span className="text-foreground">{s.headline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation modes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Generation mode</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { title: 'Full set generation', desc: 'Generate all slides at once', primary: true },
                  { title: 'Creative direction first', desc: 'Generate 3 style directions to choose from' },
                  { title: 'First 3 slides only', desc: 'Quick preview before full generation' },
                  { title: 'Regenerate selected', desc: 'Only regenerate specific slides' },
                ].map(mode => (
                  <button key={mode.title} className={`text-left rounded-xl border p-4 transition-all ${mode.primary ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/20'}`}>
                    <p className="text-sm font-semibold text-foreground">{mode.title}</p>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="hero" size="lg" className="flex-1" onClick={() => navigate('/project/proj-1/generating')}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate screenshot set
              </Button>
              <Button variant="hero-outline" size="lg">
                Generate 3 creative directions first
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
          <Button variant="secondary" onClick={prev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {currentStep < 7 ? (
            <Button variant="default" onClick={next}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewProject;
