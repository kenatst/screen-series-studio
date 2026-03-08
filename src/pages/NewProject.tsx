import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, Sparkles,
  GripVertical, Lock, Trash2, Plus, Wand2, LayoutGrid, Image as ImageIcon, FolderOpen, Loader2, X
} from "lucide-react";
import { toneOptions, screenTags, slideObjectives, defaultStorylines, emphasisOptions } from "@/lib/demo-data";
import type { SlideItem } from "@/lib/demo-data";
import { useCreateProject, useSaveSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { getMaxSlides } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, label: 'Project' },
  { id: 2, label: 'App Info' },
  { id: 3, label: 'Screens' },
  { id: 4, label: 'Brand Kit' },
  { id: 5, label: 'Style' },
  { id: 6, label: 'Planner' },
  { id: 7, label: 'Review' },
];

interface UploadedScreen {
  id: string;
  file: File;
  preview: string;
  tag: string;
}

interface BrandAsset {
  type: 'logo' | 'icon' | 'mascot';
  file: File;
  preview: string;
}

const NewProject = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const createProject = useCreateProject();
  const saveSlides = useSaveSlides();
  const { toast } = useToast();
  const maxSlides = getMaxSlides(profile?.plan || 'free');
  const [currentStep, setCurrentStep] = useState(1);
  const [slideCount, setSlideCount] = useState(Math.min(5, maxSlides));
  const [slides, setSlides] = useState<SlideItem[]>(
    maxSlides === 1 ? defaultStorylines['5-slide'].slice(0, 1) : defaultStorylines['5-slide']
  );
  const [consistencyLevel, setConsistencyLevel] = useState<'strict' | 'balanced' | 'exploratory'>('balanced');
  const [selectedTone, setSelectedTone] = useState('premium');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [platform, setPlatform] = useState('both');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [projectName, setProjectName] = useState('');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [topBenefits, setTopBenefits] = useState('');
  const [deviceFormats, setDeviceFormats] = useState<string[]>(['iphone-6-5', 'iphone-6-9']);
  const [isSaving, setIsSaving] = useState(false);
  const [generationMode, setGenerationMode] = useState<'full' | 'creative-direction' | 'first-3'>('full');

  // Upload states
  const [uploadedScreens, setUploadedScreens] = useState<UploadedScreen[]>([]);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(['#0B192C', '#6C5CE7', '#00B894', '#E1B382', '#FDFBF7']);
  const [brandFont, setBrandFont] = useState('');
  const [newColor, setNewColor] = useState('#000000');

  // AI loading states
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isSuggestingStorylines, setIsSuggestingStorylines] = useState(false);

  // Refs
  const screenInputRef = useRef<HTMLInputElement>(null);
  const brandInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleFormat = (f: string) => {
    setDeviceFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSlideCountChange = (count: number) => {
    const clamped = Math.min(count, maxSlides);
    setSlideCount(clamped);
    const key = clamped <= 5 ? '5-slide' : '10-slide';
    const base = defaultStorylines[key];
    setSlides(base.slice(0, clamped));
  };

  const updateSlide = (id: string, field: keyof SlideItem, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlide = (id: string) => {
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, i) => ({ ...s, number: i + 1 }));
    });
    setSlideCount(prev => prev - 1);
  };

  const addSlide = () => {
    if (slides.length >= maxSlides) {
      toast({ title: "Limite atteinte", description: `Maximum ${maxSlides} slides pour votre plan.`, variant: "destructive" });
      return;
    }
    const newSlide: SlideItem = {
      id: `s${Date.now()}`,
      number: slides.length + 1,
      objective: 'Feature spotlight',
      headline: 'New slide headline',
      subheadline: 'Supporting text',
      keyMessage: '',
      rawScreenTag: 'home',
      emphasis: 'UI focused',
      importance: 'medium',
      status: 'pending',
      locked: [],
    };
    setSlides(prev => [...prev, newSlide]);
    setSlideCount(prev => prev + 1);
  };

  // Screen upload handlers
  const handleScreenUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const newScreens: UploadedScreen[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      newScreens.push({
        id: `scr-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
        tag: screenTags[uploadedScreens.length + i] || 'home',
      });
    }
    setUploadedScreens(prev => [...prev, ...newScreens]);
  }, [uploadedScreens.length]);

  const removeScreen = (id: string) => {
    setUploadedScreens(prev => {
      const screen = prev.find(s => s.id === id);
      if (screen) URL.revokeObjectURL(screen.preview);
      return prev.filter(s => s.id !== id);
    });
  };

  // Brand asset upload
  const handleBrandUpload = (type: 'logo' | 'icon' | 'mascot', files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setBrandAssets(prev => {
      const existing = prev.find(a => a.type === type);
      if (existing) URL.revokeObjectURL(existing.preview);
      return [...prev.filter(a => a.type !== type), { type, file, preview: URL.createObjectURL(file) }];
    });
  };

  const removeBrandAsset = (type: string) => {
    setBrandAssets(prev => {
      const asset = prev.find(a => a.type === type);
      if (asset) URL.revokeObjectURL(asset.preview);
      return prev.filter(a => a.type !== type);
    });
  };

  const [visualPreferences, setVisualPreferences] = useState<string[]>([]);

  // AI suggestion handlers
  const callSuggestCopy = async (type: string, extra: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast({ title: "Non connecté", variant: "destructive" }); return null; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/suggest-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type, appName, appDescription, platform, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast({ title: "Erreur", description: err.error, variant: "destructive" });
      return null;
    }
    return (await res.json()).result;
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      const result = await callSuggestCopy('auto-fill');
      if (result) {
        setShortDescription(result.shortDescription || '');
        setAppDescription(result.longDescription || '');
        setValueProposition(result.valueProposition || '');
        setKeyFeatures((result.keyFeatures || []).join('\n'));
        setTopBenefits((result.topBenefits || []).join('\n'));
        toast({ title: "Auto-remplissage terminé ✨" });
      }
    } finally { setIsAutoFilling(false); }
  };

  const handleGenerateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const result = await callSuggestCopy('hooks');
      if (result?.hooks) {
        const hooks = result.hooks.slice(0, slides.length);
        setSlides(prev => prev.map((s, i) => hooks[i] ? { ...s, headline: hooks[i].headline, subheadline: hooks[i].subheadline } : s));
        toast({ title: `${hooks.length} hooks générés ✨` });
      }
    } finally { setIsGeneratingHooks(false); }
  };

  const handleSuggestStorylines = async () => {
    setIsSuggestingStorylines(true);
    try {
      const result = await callSuggestCopy('storylines', { slideCount });
      if (result?.slides) {
        const newSlides: SlideItem[] = result.slides.map((s: any, i: number) => ({
          id: `s${Date.now()}-${i}`,
          number: s.number || i + 1,
          objective: s.objective,
          headline: s.headline,
          subheadline: s.subheadline,
          keyMessage: '',
          rawScreenTag: s.rawScreenTag || 'home',
          emphasis: s.emphasis || 'UI focused',
          importance: s.importance || 'medium',
          status: 'pending' as const,
          locked: [],
        }));
        setSlides(newSlides.slice(0, maxSlides));
        setSlideCount(Math.min(newSlides.length, maxSlides));
        toast({ title: "Storyline générée ✨" });
      }
    } finally { setIsSuggestingStorylines(false); }
  };

  const next = () => setCurrentStep(s => Math.min(s + 1, 7));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  // Upload screens & brand assets to Supabase storage during project creation
  const uploadAssetsToStorage = async (projectId: string, userId: string) => {
    const assets: { storage_path: string; asset_type: string; tag: string; filename: string }[] = [];

    // Upload screens
    for (const screen of uploadedScreens) {
      const path = `${userId}/${projectId}/screens/${screen.id}-${screen.file.name}`;
      const { error } = await supabase.storage.from('raw-uploads').upload(path, screen.file, { upsert: true });
      if (!error) {
        assets.push({ storage_path: path, asset_type: 'screen', tag: screen.tag, filename: screen.file.name });
      }
    }

    // Upload brand assets
    for (const asset of brandAssets) {
      const path = `${userId}/${projectId}/brand/${asset.type}-${asset.file.name}`;
      const { error } = await supabase.storage.from('raw-uploads').upload(path, asset.file, { upsert: true });
      if (!error) {
        assets.push({ storage_path: path, asset_type: asset.type, tag: asset.type, filename: asset.file.name });
      }
    }

    // Insert asset records
    if (assets.length > 0) {
      await supabase.from('assets').insert(
        assets.map(a => ({ ...a, project_id: projectId, user_id: userId }))
      );
    }
  };

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
                    <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. LinguaPal US Launch" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App name</label>
                    <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. LinguaPal" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Platform</label>
                  <div className="flex gap-3">
                    {['iOS', 'Android', 'Both'].map(p => (
                      <button key={p} onClick={() => setPlatform(p.toLowerCase())} className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${platform === p.toLowerCase() ? 'bg-primary/10 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}>
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
                      <button key={g} onClick={() => setPrimaryGoal(g)} className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all duration-300 ${primaryGoal === g ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
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
                          <div key={f.id} onClick={() => toggleFormat(f.id)} className={`flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 min-w-[140px] ${deviceFormats.includes(f.id) ? 'bg-primary/10 border-primary shadow-glow' : 'bg-black/5 border-border hover:border-primary/40'}`}>
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
                  <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="A brief summary of your app" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Long description</label>
                  </div>
                  <Textarea value={appDescription} onChange={e => setAppDescription(e.target.value)} placeholder="Full app description..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[140px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Value proposition</label>
                  <Input value={valueProposition} onChange={e => setValueProposition(e.target.value)} placeholder="One line that captures your app's value" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Key features</label>
                    <Textarea value={keyFeatures} onChange={e => setKeyFeatures(e.target.value)} placeholder="List main features (one per line)..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Top benefits</label>
                    <Textarea value={topBenefits} onChange={e => setTopBenefits(e.target.value)} placeholder="What users gain (one per line)..." className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner min-h-[120px] resize-none focus-visible:ring-primary transition-all rounded-xl p-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tone of voice</label>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map(t => (
                      <button key={t} onClick={() => setSelectedTone(t)} className={`px-4 py-2.5 rounded-lg text-sm capitalize font-bold border transition-all duration-300 ${selectedTone === t ? 'bg-primary/20 text-primary border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
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
                <input
                  ref={screenInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleScreenUpload(e.target.files)}
                />
                <div
                  onClick={() => screenInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); handleScreenUpload(e.dataTransfer.files); }}
                  className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-[2rem] p-20 text-center hover:border-primary hover:bg-primary/10 hover:shadow-glow transition-all duration-300 cursor-pointer group"
                >
                  <div className="h-20 w-20 bg-card/90 border border-border rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-elevated">
                    <Upload className="h-8 w-8 text-primary shadow-sm" />
                  </div>
                  <p className="text-xl font-bold text-foreground mb-2">Drop screenshots here</p>
                  <p className="text-sm font-medium text-foreground/40">PNG, JPG up to 10MB each</p>
                </div>

                {uploadedScreens.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Uploaded screens</h3>
                      <span className="text-xs font-bold text-muted-foreground bg-black/5 px-3 py-1.5 rounded-md border border-border">{uploadedScreens.length} files</span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {uploadedScreens.map(screen => (
                        <div key={screen.id} className="aspect-[9/19.5] rounded-xl border border-border bg-card/90 flex flex-col items-center justify-center p-2 shadow-inner relative group hover:border-primary/50 hover:shadow-glow transition-all duration-300">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button variant="destructive" size="icon" onClick={() => removeScreen(screen.id)} className="h-7 w-7 rounded-lg shadow-sm bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-foreground border border-red-500/30">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <img src={screen.preview} alt={screen.tag} className="h-full w-full rounded object-cover mb-2" />
                          <select
                            value={screen.tag}
                            onChange={e => setUploadedScreens(prev => prev.map(s => s.id === screen.id ? { ...s, tag: e.target.value } : s))}
                            className="bg-black/5 border border-border rounded px-2 py-1 text-[10px] font-bold text-muted-foreground w-full"
                          >
                            {screenTags.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                      <div
                        onClick={() => screenInputRef.current?.click()}
                        className="aspect-[9/19.5] rounded-xl border-2 border-dashed border-border bg-card/90 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Plus className="h-8 w-8 text-foreground/20" />
                        <span className="text-xs text-muted-foreground mt-2 font-bold">Add more</span>
                      </div>
                    </div>
                  </div>
                )}
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
                  {(['logo', 'icon', 'mascot'] as const).map(type => {
                    const asset = brandAssets.find(a => a.type === type);
                    return (
                      <div key={type} className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { brandInputRefs.current[type] = el; }}
                          onChange={e => handleBrandUpload(type, e.target.files)}
                        />
                        {asset ? (
                          <div className="border border-primary/30 bg-primary/5 rounded-2xl p-4 text-center relative group shadow-glow">
                            <button onClick={() => removeBrandAsset(type)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center border border-red-500/30">
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <img src={asset.preview} alt={type} className="h-24 w-24 object-contain mx-auto mb-3 rounded-xl" />
                            <p className="text-sm font-bold text-primary capitalize">{type} ✓</p>
                          </div>
                        ) : (
                          <div
                            onClick={() => brandInputRefs.current[type]?.click()}
                            className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group shadow-inner"
                          >
                            <div className="h-14 w-14 bg-black/5 border border-border rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-glow transition-all duration-500">
                              <Upload className="h-6 w-6 text-foreground/30 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground tracking-tight capitalize">Upload {type}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-4 pt-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Brand colors</label>
                  <div className="flex flex-wrap gap-4 p-5 border border-border bg-card/90 rounded-2xl shadow-inner">
                    {brandColors.map((c, i) => (
                      <div key={i} className="relative group">
                        <div className="h-14 w-14 rounded-full border-4 border-black/80 cursor-pointer hover:scale-110 hover:shadow-glow transition-all duration-300 shadow-elevated" style={{ backgroundColor: c }} />
                        <button
                          onClick={() => setBrandColors(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-14 w-14 rounded-full border-2 border-dashed border-border cursor-pointer bg-transparent" />
                      <Button variant="ghost" size="sm" onClick={() => { setBrandColors(prev => [...prev, newColor]); }} className="text-xs font-bold text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Brand font</label>
                  <Input value={brandFont} onChange={e => setBrandFont(e.target.value)} placeholder="e.g. SF Pro, Inter, Montserrat" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 shadow-inner h-12 focus-visible:ring-primary transition-all rounded-xl" />
                </div>
                <div className="space-y-4 pt-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Visual preferences</label>
                  <div className="flex flex-wrap gap-3">
                    {['Keep app UI untouched', 'Allow visual enhancement', 'Use premium preset palette', 'Auto-detect from assets'].map(opt => (
                      <Badge
                        key={opt}
                        onClick={() => {
                          setVisualPreferences(prev =>
                            prev.includes(opt)
                              ? prev.filter(p => p !== opt)
                              : [...prev, opt]
                          );
                        }}
                        className={`font-bold border-border cursor-pointer transition-all duration-300 py-2 px-4 shadow-sm ${visualPreferences.includes(opt)
                            ? 'bg-primary text-black border-primary shadow-glow'
                            : 'bg-card/90 text-muted-foreground hover:bg-primary/20 hover:text-primary hover:border-primary/40'
                          }`}
                      >
                        {opt}
                      </Badge>
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {['Clean SaaS', 'Feature Led', 'Modern Fintech', 'Playful EdTech', 'Dark Cinematic',
                      'Minimal Luxury', 'Neo Brutalism', 'Gradient Flow'].map(name => (
                        <button key={name} onClick={() => setSelectedTemplate(name)} className={`aspect-[3/4] max-h-[160px] rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-300 ${selectedTemplate === name ? 'border-primary bg-primary/10 shadow-glow scale-[1.02]' : 'border-border bg-card/90 hover:border-primary/40 hover:scale-[1.02] shadow-sm'}`}>
                          <div className={`h-12 w-10 rounded-lg mb-3 flex items-center justify-center border transition-all duration-300 ${selectedTemplate === name ? 'bg-primary/20 border-primary/50 shadow-inner' : 'bg-black/5 border-border'}`}>
                            <LayoutGrid className={`h-5 w-5 ${selectedTemplate === name ? 'text-primary' : 'text-foreground/30'}`} />
                          </div>
                          <span className={`text-xs font-bold text-center leading-tight tracking-tight ${selectedTemplate === name ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border border-dashed border-border bg-card/90 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-black/5 transition-all duration-300 cursor-pointer shadow-inner">
                      <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-bold text-muted-foreground tracking-tight">Upload your refererence mockups</p>
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
                    <div className="flex items-center justify-end">
                      <div className="flex items-center gap-3 bg-card/90 px-3 py-1.5 rounded-xl border border-border shadow-inner">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slides:</span>
                        <div className="flex gap-1">
                          {[3, 5, 7, 10].map(n => (
                            <button key={n} onClick={() => handleSlideCountChange(n)} className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all duration-300 ${slideCount === n ? 'bg-primary text-black border-primary shadow-glow' : 'bg-black/5 text-muted-foreground border-border hover:border-border hover:text-foreground'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

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
                                <select className="flex-1 bg-card/90 border border-border rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary shadow-inner outline-none transition-all" value={slide.objective} onChange={e => updateSlide(slide.id, 'objective', e.target.value)}>
                                  {slideObjectives.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <Badge className={`shadow-sm px-3 py-1.5 font-bold tracking-tight border ${slide.importance === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : slide.importance === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-black/5 text-muted-foreground border-border'}`}>
                                  {slide.importance}
                                </Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <Input value={slide.headline} onChange={e => updateSlide(slide.id, 'headline', e.target.value)} placeholder="Headline" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-bold shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl" />
                                <Input value={slide.subheadline} onChange={e => updateSlide(slide.id, 'subheadline', e.target.value)} placeholder="Subheadline" className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-medium shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl" />
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                <select className="bg-black/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground outline-none mt-2 focus:ring-1 focus:ring-primary transition-all" value={slide.rawScreenTag} onChange={e => updateSlide(slide.id, 'rawScreenTag', e.target.value)}>
                                  {screenTags.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select className="bg-black/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground outline-none mt-2 focus:ring-1 focus:ring-primary transition-all" value={slide.emphasis} onChange={e => updateSlide(slide.id, 'emphasis', e.target.value)}>
                                  {emphasisOptions.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <div className="flex-1" />
                                <Button variant="ghost" size="sm" className="h-9 text-xs font-bold mt-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg"><Lock className="mr-1.5 h-3.5 w-3.5" />Lock</Button>
                                <Button variant="ghost" size="sm" onClick={() => removeSlide(slide.id)} className="h-9 text-xs font-bold mt-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addSlide} className="w-full rounded-2xl border-dashed border-2 h-14 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Add slide
                      </Button>
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
                            <button key={level} onClick={() => setConsistencyLevel(level)} className={`px-4 py-3.5 rounded-xl text-sm capitalize font-bold border transition-all duration-300 w-full text-left flex justify-between items-center ${consistencyLevel === level ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(245,166,35,0.2)]' : 'bg-card/90 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground shadow-inner'}`}>
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
                      <div className="flex justify-between border-b border-border pb-3"><span>App:</span> <span className="font-bold text-foreground">{appName || 'Not set'}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Platform:</span> <span className="font-bold text-foreground capitalize">{platform}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Tone:</span> <span className="font-bold text-foreground capitalize">{selectedTone}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Template:</span> <span className="font-bold text-foreground">{selectedTemplate || 'Not selected'}</span></div>
                      {(platform === 'ios' || platform === 'both') && (
                        <div className="flex justify-between border-b border-border pb-3"><span>Formats:</span> <span className="font-bold text-foreground">{deviceFormats.join(', ')}</span></div>
                      )}
                      <div className="flex justify-between border-b border-border pb-3"><span>Slides:</span> <span className="font-bold text-foreground">{slideCount}</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Screens:</span> <span className="font-bold text-foreground">{uploadedScreens.length} uploaded</span></div>
                      <div className="flex justify-between border-b border-border pb-3"><span>Brand assets:</span> <span className="font-bold text-foreground">{brandAssets.length} uploaded</span></div>
                      <div className="flex justify-between pb-1"><span>Consistency:</span> <span className="font-bold text-foreground capitalize">{consistencyLevel}</span></div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-elevated space-y-6 hover:border-primary/30 transition-all duration-500">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" /> Slide headlines
                    </h3>
                    <div className="space-y-3">
                      {slides.map(s => (
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
                      <button key={mode.id} onClick={() => setGenerationMode(mode.id as any)} className={`text-left rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 shadow-elevated ${generationMode === mode.id ? 'border-primary bg-primary/10 shadow-[0_5px_20px_rgba(245,166,35,0.2)]' : 'border-border bg-card/90 hover:border-primary/40 hover:bg-black/5'}`}>
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
                          name: projectName || appName || `App Screens`,
                          app_name: appName,
                          app_description: appDescription,
                          platform,
                          template_id: selectedTemplate !== 'reference' ? selectedTemplate.toLowerCase().replace(/\s+/g, '-') : 'clean-saas',
                          consistency_level: consistencyLevel,
                          device_formats: deviceFormats as any,
                          generation_mode: generationMode,
                          status: 'draft',
                          brand_kit: { colors: brandColors, fontFamily: brandFont } as any,
                          config: { primaryGoal, tone: selectedTone, shortDescription, valueProposition, keyFeatures: keyFeatures.split('\n').filter(Boolean), topBenefits: topBenefits.split('\n').filter(Boolean) } as any,
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
                        // Upload assets to storage
                        if (user) {
                          await uploadAssetsToStorage(project.id, user.id);
                        }
                        navigate(`/project/${project.id}/generating`);
                      } catch (e) {
                        console.error("Failed to save project", e);
                        toast({ title: "Erreur", description: "Failed to create project", variant: "destructive" });
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
