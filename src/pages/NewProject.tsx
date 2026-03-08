import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, Sparkles,
  GripVertical, Lock, Trash2, Plus, Wand2, LayoutGrid, Image as ImageIcon, FolderOpen, Loader2
} from "lucide-react";
import { toneOptions, screenTags, slideObjectives, defaultStorylines, emphasisOptions } from "@/lib/demo-data";
import type { SlideItem } from "@/lib/demo-data";
import { useCreateProject, useSaveSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const createProject = useCreateProject();
  const saveSlides = useSaveSlides();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideCount, setSlideCount] = useState(5);
  const [slides, setSlides] = useState<SlideItem[]>(defaultStorylines['5-slide']);
  const [consistencyLevel, setConsistencyLevel] = useState<'strict' | 'balanced' | 'exploratory'>('balanced');
  const [selectedTone, setSelectedTone] = useState('premium');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [uploadedScreens, setUploadedScreens] = useState<string[]>([]);
  const [platform, setPlatform] = useState('both');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [projectName, setProjectName] = useState('');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [deviceFormats, setDeviceFormats] = useState<string[]>(['iphone-6-5', 'iphone-6-9']);
  const [isSaving, setIsSaving] = useState(false);
  const [generationMode, setGenerationMode] = useState<'full' | 'creative-direction' | 'first-3'>('full');

  const toggleFormat = (f: string) => {
    setDeviceFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

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
        <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-4 hide-scrollbar">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${currentStep === step.id ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,166,35,0.3)] border border-primary/30' :
                  currentStep > step.id ? 'bg-success/15 text-success hover:bg-success/25 border border-success/20' :
                    'bg-black/5 text-foreground/40 hover:bg-white/10 hover:text-muted-foreground border border-transparent'
                  }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${currentStep === step.id ? 'bg-primary/30 text-primary' : 'bg-card/90'}`}>{step.id}</span>}
                <span className="hidden sm:inline tracking-tight">{step.label}</span>
              </button>
              {i < steps.length - 1 && <div className={`w-6 h-px mx-2 ${currentStep > step.id ? 'bg-success/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px] bg-card/90 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-elevated relative overflow-hidden"
          >
            {/* Ambient subtle glow for container */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Step 1: Project */}
            {currentStep === 1 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Create project</h2>
                  <p className="text-muted-foreground font-medium">Set up your screenshot project basics.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Project name</label>
                    <Input placeholder="e.g. LinguaPal US Launch" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App name</label>
                    <Input placeholder="e.g. LinguaPal" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Platform</label>
                  <div className="flex gap-3">
                    {['iOS', 'Android', 'Both'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p.toLowerCase())}
                        className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${platform === p.toLowerCase() ? 'bg-primary/10 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App category</label>
                    <Input placeholder="e.g. Education, Finance, Health" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target audience</label>
                    <Input placeholder="e.g. Young professionals, students" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Primary goal</label>
                  <div className="flex flex-wrap gap-2">
                    {['Increase installs', 'Highlight features', 'Improve conversion', 'Localize assets', 'Launch new app', 'A/B testing'].map(g => (
                      <button
                        key={g}
                        onClick={() => setPrimaryGoal(g)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${primaryGoal === g ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {(platform === 'ios' || platform === 'both') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Device formats (App Store Compliance)
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">Required</Badge>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: 'iphone-6-9', label: 'iPhone 6.9"', desc: 'Pro Max' },
                          { id: 'iphone-6-5', label: 'iPhone 6.5"', desc: 'Max / Plus' },
                          { id: 'ipad-12-9', label: 'iPad 12.9"', desc: 'Pro' }
                        ].map(f => (
                          <div
                            key={f.id}
                            onClick={() => toggleFormat(f.id)}
                            className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 min-w-[140px] ${deviceFormats.includes(f.id) ? 'bg-primary/10 border-primary shadow-glow' : 'bg-black/5 border-border hover:border-primary/40'}`}
                          >
                            <span className={`text-sm font-bold leading-tight ${deviceFormats.includes(f.id) ? 'text-primary' : 'text-muted-foreground'}`}>{f.label}</span>
                            <span className="text-xs text-foreground/40 font-medium">{f.desc}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-primary/70 pt-1 font-medium">Assets will be batch-generated for all selected device metrics.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Step 2: App Info */}
            {currentStep === 2 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">App information</h2>
                  <p className="text-muted-foreground font-medium">Tell us about your app so we can craft the perfect screenshots.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Short description</label>
                  <Input placeholder="A brief summary of your app" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Long description</label>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg"><Wand2 className="mr-1.5 h-3.5 w-3.5" /> Auto-fill from store URL</Button>
                  </div>
                  <Textarea placeholder="Full app description..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[140px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Value proposition</label>
                  <Input placeholder="One line that captures your app's value" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Key features</label>
                    <Textarea placeholder="List main features..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Top benefits</label>
                    <Textarea placeholder="What users gain..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tone of voice</label>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTone(t)}
                        className={`px-4 py-2.5 rounded-lg text-sm capitalize font-bold border transition-all duration-300 ${selectedTone === t ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="bg-black/5 text-foreground hover:bg-white/10 border border-border font-bold tracking-tight"><Sparkles className="mr-2 h-4 w-4 text-primary" /> Generate hooks</Button>
                  <Button variant="secondary" className="bg-black/5 text-foreground hover:bg-white/10 border border-border font-bold tracking-tight"><Wand2 className="mr-2 h-4 w-4 text-primary" /> Suggest storylines</Button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Screens */}
            {currentStep === 3 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Upload raw screens</h2>
                  <p className="text-muted-foreground font-medium">Drag & drop your app screenshots. Tag and organize them.</p>
                </div>
                <div className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-[2rem] p-20 text-center hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all duration-300 cursor-pointer group">
                  <div className="h-20 w-20 bg-card/90 border border-border rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-elevated">
                    <Upload className="h-8 w-8 text-primary shadow-sm" />
                  </div>
                  <p className="text-xl font-bold text-foreground mb-2">Drop screenshots here</p>
                  <p className="text-sm font-medium text-foreground/40">PNG, JPG up to 10MB each</p>
                </div>
                {/* Demo uploaded screens */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Uploaded screens (demo)</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-black/5 px-3 py-1.5 rounded-md border border-border">6 files</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {screenTags.slice(0, 6).map((tag, i) => (
                      <div key={tag} className="aspect-[9/19.5] rounded-xl border border-border bg-card/90 flex flex-col items-center justify-center p-2 shadow-inner relative group hover:border-primary/50 hover:shadow-glow transition-all duration-300">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg shadow-sm bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-foreground border border-red-500/30"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="h-full w-full rounded bg-black/5 mb-2 flex flex-col items-center justify-center border border-border">
                          <ImageIcon className="h-6 w-6 text-foreground/20" />
                        </div>
                        <Badge className="bg-white/10 text-muted-foreground border-transparent text-[10px] w-full justify-center max-w-[90%] truncate uppercase tracking-wider font-bold">{tag}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Brand Kit */}
            {currentStep === 4 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Brand kit</h2>
                  <p className="text-muted-foreground font-medium">Set your visual identity for consistent branding.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {['Logo', 'App Icon', 'Mascot'].map(label => (
                    <div key={label} className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group shadow-inner">
                      <div className="h-14 w-14 bg-black/5 border border-border rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-glow transition-all duration-500">
                        <Upload className="h-6 w-6 text-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground tracking-tight">Upload {label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Brand colors</label>
                  <div className="flex gap-4 p-5 border border-border bg-card/90 rounded-2xl shadow-inner">
                    {['#0B192C', '#6C5CE7', '#00B894', '#E1B382', '#FDFBF7'].map(c => (
                      <div key={c} className="h-14 w-14 rounded-full border-4 border-black/80 cursor-pointer hover:scale-110 hover:shadow-glow transition-all duration-300 shadow-elevated" style={{ backgroundColor: c }} />
                    ))}
                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/10 hover:shadow-glow transition-all duration-300">
                      <Plus className="h-6 w-6 text-foreground/40" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Visual preferences</label>
                  <div className="flex flex-wrap gap-3">
                    {['Keep app UI untouched', 'Allow visual enhancement', 'Use premium preset palette', 'Auto-detect from assets'].map(opt => (
                      <Badge key={opt} className="bg-card/90 text-muted-foreground font-bold border-border cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/40 transition-all duration-300 py-2 px-4 shadow-sm">{opt}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Style / Template */}
            {currentStep === 5 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Choose your style</h2>
                  <p className="text-muted-foreground font-medium">Pick a template or upload references for inspiration.</p>
                </div>

                <div className="flex gap-2 p-1.5 bg-card/90 border border-border rounded-xl inline-flex mb-2 shadow-inner">
                  <Button variant={selectedTemplate !== 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate !== 'reference' ? 'bg-primary text-black shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`} onClick={() => setSelectedTemplate('')}>Templates</Button>
                  <Button variant={selectedTemplate === 'reference' ? 'default' : 'ghost'} className={`rounded-lg font-bold transition-all duration-300 ${selectedTemplate === 'reference' ? 'bg-primary text-black shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`} onClick={() => setSelectedTemplate('reference')}>References</Button>
                </div>

                {selectedTemplate !== 'reference' ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['Clean SaaS', 'Bold Gaming', 'Premium Gradient', 'Educational Playful', 'Lifestyle',
                      'Luxury Minimal', 'Feature-Led', 'Comparison', 'Mascot-Led', 'Cinematic'].map(name => (
                        <button
                          key={name}
                          onClick={() => setSelectedTemplate(name)}
                          className={`aspect-[3/4] rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-300 ${selectedTemplate === name ? 'border-primary bg-primary/10 shadow-glow scale-[1.02]' : 'border-border bg-card/90 hover:border-primary/40 hover:scale-[1.02] shadow-sm'
                            }`}
                        >
                          <div className={`h-16 w-12 rounded-lg mb-3 flex items-center justify-center border transition-all duration-300 ${selectedTemplate === name ? 'bg-primary/20 border-primary/50 shadow-inner' : 'bg-black/5 border-border'}`}>
                            <LayoutGrid className={`h-5 w-5 ${selectedTemplate === name ? 'text-primary' : 'text-foreground/30'}`} />
                          </div>
                          <span className={`text-xs font-bold text-center leading-tight tracking-tight ${selectedTemplate === name ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div
                      onClick={() => window.open('/inspiration', '_blank')}
                      className="border border-dashed border-primary/40 bg-primary/10 rounded-2xl p-12 text-center hover:border-primary/60 hover:bg-primary/20 hover:shadow-glow transition-all duration-300 cursor-pointer group shadow-inner"
                    >
                      <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                      <p className="text-lg font-bold text-foreground tracking-tight">Browse Inspiration Gallery</p>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Find high-converting App Store examples</p>
                    </div>
                    <div className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-black/5 transition-all duration-300 cursor-pointer shadow-inner">
                      <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-bold text-muted-foreground tracking-tight">Or upload your own references</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Inspiration notes</label>
                      <Textarea placeholder="e.g. Use this as inspiration for composition and intensity, but keep my branding and app content." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] focus-visible:ring-primary transition-all rounded-xl p-4" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Planner */}
            {currentStep === 6 && (
              <div className="space-y-8 relative z-10">
                <div className="flex items-start justify-between border-b border-border pb-5">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Screenshot set planner</h2>
                    <p className="text-muted-foreground font-medium">Define each slide's content and objective.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleSlideCountChange(5)} className="text-xs font-bold bg-black/5 hover:bg-white/10 text-foreground border border-border tracking-tight">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> 5-slide storyline
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleSlideCountChange(10)} className="text-xs font-bold bg-black/5 hover:bg-white/10 text-foreground border border-border tracking-tight">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> 10-slide storyline
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 bg-card/90 px-3 py-1.5 rounded-xl border border-border shadow-inner">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slides:</span>
                        <div className="flex gap-1">
                          {[3, 5, 7, 10].map(n => (
                            <button
                              key={n}
                              onClick={() => handleSlideCountChange(n)}
                              className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all duration-300 ${slideCount === n ? 'bg-primary text-black border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-border hover:text-foreground'
                                }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Slides */}
                    <div className="space-y-4">
                      {slides.map((slide) => (
                        <div key={slide.id} className="rounded-2xl border border-border bg-card/90 p-5 shadow-elevated hover:border-primary/40 hover:shadow-glow transition-all duration-300 group">
                          <div className="flex items-start gap-4">
                            <GripVertical className="h-5 w-5 text-foreground/20 mt-3 cursor-grab flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity hover:text-foreground" />
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner">
                                  <span className="text-sm font-black text-primary">{slide.number}</span>
                                </div>
                                <select
                                  className="flex-1 bg-card/90 border border-border rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary shadow-inner outline-none transition-all"
                                  value={slide.objective}
                                  onChange={e => updateSlide(slide.id, 'objective', e.target.value)}
                                >
                                  {slideObjectives.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <Badge className={`shadow-sm px-3 py-1.5 font-bold tracking-tight border ${slide.importance === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : slide.importance === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-black/5 text-muted-foreground border-border'}`}>
                                  {slide.importance}
                                </Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                  value={slide.headline}
                                  onChange={e => updateSlide(slide.id, 'headline', e.target.value)}
                                  placeholder="Headline"
                                  className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-bold shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl"
                                />
                                <Input
                                  value={slide.subheadline}
                                  onChange={e => updateSlide(slide.id, 'subheadline', e.target.value)}
                                  placeholder="Subheadline"
                                  className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-medium shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                <select
                                  className="bg-black/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground outline-none mt-2 focus:ring-1 focus:ring-primary transition-all"
                                  value={slide.rawScreenTag}
                                  onChange={e => updateSlide(slide.id, 'rawScreenTag', e.target.value)}
                                >
                                  {screenTags.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                  className="bg-black/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground outline-none mt-2 focus:ring-1 focus:ring-primary transition-all"
                                  value={slide.emphasis}
                                  onChange={e => updateSlide(slide.id, 'emphasis', e.target.value)}
                                >
                                  {emphasisOptions.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <div className="flex-1" />
                                <Button variant="ghost" size="sm" className="h-9 text-xs font-bold mt-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg"><Lock className="mr-1.5 h-3.5 w-3.5" />Lock</Button>
                                <Button variant="ghost" size="sm" className="h-9 text-xs font-bold mt-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Consistency Engine */}
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sticky top-6 shadow-glow backdrop-blur-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-lg font-black tracking-tight text-foreground">Consistency Engine</span>
                        </div>
                        <div className="flex flex-col gap-3 mb-6">
                          {(['strict', 'balanced', 'exploratory'] as const).map(level => (
                            <button
                              key={level}
                              onClick={() => setConsistencyLevel(level)}
                              className={`px-4 py-3.5 rounded-xl text-sm capitalize font-bold border transition-all duration-300 w-full text-left flex justify-between items-center ${consistencyLevel === level ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(245,166,35,0.2)]' : 'bg-card/90 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground shadow-inner'
                                }`}
                            >
                              {level}
                              {consistencyLevel === level && <CheckCircle2 className="h-4.5 w-4.5" />}
                            </button>
                          ))}
                        </div>
                        <div className="p-4 bg-card/90 rounded-xl border border-border text-xs text-muted-foreground font-medium leading-relaxed shadow-inner">
                          {consistencyLevel === 'strict' && 'All slides remain very homogeneous — same palette, framing, density. Recommended for traditional app store pages.'}
                          {consistencyLevel === 'balanced' && 'Same visual universe with controlled variations for each slide. Great for feature showcases.'}
                          {consistencyLevel === 'exploratory' && 'More creative freedom while maintaining a coherent base brand identity. High contrast allowed.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Review */}
            {currentStep === 7 && (
              <div className="space-y-8 relative z-10">
                <div className="border-b border-border pb-5">
                  <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Pre-generation review</h2>
                  <p className="text-muted-foreground font-medium">Review everything before generating your screenshot set.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-[120px] pointer-events-none transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-110" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" /> Project summary
                    </h3>
                    <div className="space-y-4 text-sm text-muted-foreground font-medium">
                      <div className="flex justify-between border-b border-border pb-3"><span>Platform:</span> <span className="font-bold text-foreground capitalize">{platform}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Tone:</span> <span className="font-bold text-foreground capitalize">{selectedTone}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Template:</span> <span className="font-bold text-foreground">{selectedTemplate || 'Not selected'}</span></div>
                      {(platform === 'ios' || platform === 'both') && (
                        <div className="flex justify-between border-b border-border pb-3"><span>Formats:</span> <span className="font-bold text-foreground">{deviceFormats.join(', ')}</span></div>
                      )}
                      <div className="flex justify-between border-b border-border pb-3"><span>Slides:</span> <span className="font-bold text-foreground">{slideCount}</span></div>
                      <div className="flex justify-between pb-1"><span>Consistency:</span> <span className="font-bold text-foreground capitalize">{consistencyLevel}</span></div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 hover:border-primary/30 transition-all duration-500">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" /> Slide headlines
                    </h3>
                    <div className="space-y-3">
                      {slides.map((s, i) => (
                        <div key={s.id} className="flex items-start gap-4 text-sm p-3 rounded-xl hover:bg-black/5 transition-colors border border-transparent hover:border-border">
                          <span className="text-primary font-black bg-primary/10 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner border border-primary/20">{s.number}</span>
                          <span className="text-foreground/90 pt-1 font-bold tracking-tight">{s.headline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generation modes */}
                <div className="space-y-5 pt-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Generation mode</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { id: 'full', title: 'Full set generation', desc: 'Generate all slides at once' },
                      { id: 'creative-direction', title: 'Creative direction first', desc: 'Generate 3 style directions for Slide 1' },
                      { id: 'first-3', title: 'First 3 slides only', desc: 'Quick preview before full generation' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setGenerationMode(mode.id as any)}
                        className={`text-left rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 shadow-elevated ${generationMode === mode.id ? 'border-primary bg-primary/10 shadow-[0_5px_20px_rgba(245,166,35,0.2)]' : 'border-border bg-card/90 hover:border-primary/40 hover:bg-black/5'}`}>
                        <p className={`text-sm font-black mb-1.5 tracking-tight ${generationMode === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.title}</p>
                        <p className={`text-xs font-medium ${generationMode === mode.id ? 'text-primary/70' : 'text-foreground/40'}`}>{mode.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-8 mt-8 border-t border-border">
                  <Button
                    size="lg"
                    className="flex-1 h-16 rounded-2xl text-lg font-black bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(245,166,35,0.3)] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] hover:-translate-y-1.5 transition-all duration-300"
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const project = await createProject.mutateAsync({
                          name: projectName || `Project ${Date.now()}`,
                          app_name: appName,
                          app_description: appDescription,
                          platform,
                          template_id: selectedTemplate !== 'reference' ? selectedTemplate.toLowerCase().replace(/\s+/g, '-') : 'clean-saas',
                          consistency_level: consistencyLevel,
                          device_formats: deviceFormats as any,
                          generation_mode: generationMode,
                          status: 'draft',
                          brand_kit: { colors: [] } as any,
                          config: { primaryGoal, tone: selectedTone } as any,
                        });
                        await saveSlides.mutateAsync({
                          projectId: project.id,
                          slides: slides.map((s, i) => ({
                            slide_number: i + 1,
                            objective: s.objective,
                            headline: s.headline,
                            subheadline: s.subheadline || '',
                            raw_screen_tag: s.rawScreenTag,
                            emphasis: s.emphasis,
                            importance: s.importance,
                            status: 'pending',
                          })),
                        });
                        navigate(`/project/${project.id}/generating`);
                      } catch (e) {
                        console.error("Failed to save project", e);
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin text-black" /> : <Sparkles className="mr-3 h-6 w-6 text-black" />}
                    {isSaving ? "Preparing Output..." : "Generate Cinematic Screenshots"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-12 pt-8 border-t border-border relative z-10">
          <Button variant="secondary" onClick={prev} disabled={currentStep === 1} className="bg-black/5 text-foreground hover:bg-white/10 border-border h-12 px-6 rounded-xl font-bold tracking-tight">
            <ArrowLeft className="mr-2 h-4.5 w-4.5" /> Back
          </Button>
          {currentStep < 7 ? (
            <Button variant="default" onClick={next} className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl font-black tracking-tight shadow-glow hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all">
              Continue <ArrowRight className="ml-2 h-4.5 w-4.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewProject;
