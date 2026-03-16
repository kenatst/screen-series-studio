import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useSensor, useSensors, PointerSensor, KeyboardSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toneOptions, screenTags, defaultStorylines, demoTemplates, templateMoods } from "@/lib/demo-data";
import type { SlideItem } from "@/lib/demo-data";
import { useCreateProject, useSaveSlides, useUpdateProject, useProject, useProjectSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { getMaxSlides } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UploadedScreen } from "@/components/project/SortableSlide";

export interface BrandAsset {
  type: 'logo' | 'icon' | 'mascot';
  file: File;
  preview: string;
}

export interface ReferenceMockup {
  id: string;
  file: File;
  preview: string;
}

/** Extract dominant colors from an image via canvas sampling */
function extractColorsFromImage(imgSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const colorMap = new Map<string, number>();
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const brightness = (qr + qg + qb) / 3;
        if (brightness < 30 || brightness > 235) continue;
        const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
      const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
      resolve(sorted.slice(0, 5).map(entry => entry[0]));
    };
    img.onerror = () => resolve([]);
    img.src = imgSrc;
  });
}

interface NewProjectContextType {
  // Step navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  next: () => void;
  prev: () => void;

  // Project info
  projectName: string;
  setProjectName: (v: string) => void;
  appName: string;
  setAppName: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  appCategory: string;
  setAppCategory: (v: string) => void;
  targetAudience: string;
  setTargetAudience: (v: string) => void;
  primaryGoal: string;
  setPrimaryGoal: (v: string) => void;
  outputLanguage: string;
  setOutputLanguage: (v: string) => void;
  deviceFormats: string[];
  toggleFormat: (f: string) => void;

  // App info
  appDescription: string;
  setAppDescription: (v: string) => void;
  shortDescription: string;
  setShortDescription: (v: string) => void;
  valueProposition: string;
  setValueProposition: (v: string) => void;
  keyFeatures: string;
  setKeyFeatures: (v: string) => void;
  topBenefits: string;
  setTopBenefits: (v: string) => void;
  selectedTone: string;
  setSelectedTone: (v: string) => void;

  // Screens
  uploadedScreens: UploadedScreen[];
  setUploadedScreens: React.Dispatch<React.SetStateAction<UploadedScreen[]>>;
  handleScreenUpload: (files: FileList | null) => void;
  removeScreen: (id: string) => void;
  screenInputRef: React.RefObject<HTMLInputElement | null>;

  // Reference mockups
  referenceMockups: ReferenceMockup[];
  handleReferenceUpload: (files: FileList | null) => void;
  removeReferenceMockup: (id: string) => void;
  referenceInputRef: React.RefObject<HTMLInputElement | null>;
  inspirationText: string;
  setInspirationText: (v: string) => void;

  // Brand kit
  brandAssets: BrandAsset[];
  setBrandAssets: React.Dispatch<React.SetStateAction<BrandAsset[]>>;
  brandColors: string[];
  setBrandColors: React.Dispatch<React.SetStateAction<string[]>>;
  brandFont: string;
  setBrandFont: (v: string) => void;
  newColor: string;
  setNewColor: (v: string) => void;
  handleBrandUpload: (type: 'logo' | 'icon' | 'mascot', files: FileList | null) => void;
  removeBrandAsset: (type: string) => void;
  handleAutoDetectColors: () => Promise<void>;
  brandInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  visualPreferences: string[];
  setVisualPreferences: React.Dispatch<React.SetStateAction<string[]>>;

  // Style/templates
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  templateMoodFilter: string;
  setTemplateMoodFilter: (v: string) => void;
  templateCategoryFilter: string;
  setTemplateCategoryFilter: (v: string) => void;
  filteredTemplates: typeof demoTemplates;
  templateCategories: string[];

  // Planner
  slides: SlideItem[];
  setSlides: React.Dispatch<React.SetStateAction<SlideItem[]>>;
  slideCount: number;
  handleSlideCountChange: (n: number) => void;
  isAutoFilling: boolean;
  consistencyLevel: 'strict' | 'balanced' | 'exploratory';
  setConsistencyLevel: (level: 'strict' | 'balanced' | 'exploratory') => void;
  sensors: ReturnType<typeof useSensors>;
  handleDragEnd: (event: DragEndEvent) => void;
  handleAutoFillSlides: () => Promise<void>;
  updateSlide: (id: string, field: keyof SlideItem, value: string) => void;
  removeSlide: (id: string) => void;
  addSlide: () => void;
  getScreenOptions: () => string[];
  maxSlides: number;

  // Review (generation mode is always 'full')
  generationMode: string;

  // Save
  isSaving: boolean;
  lastSavedAt: Date | null;
  handleSaveDraft: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  getFinalProjectName: () => string;
  profile: any;
}

const NewProjectContext = createContext<NewProjectContextType | null>(null);

export function useNewProject() {
  const ctx = useContext(NewProjectContext);
  if (!ctx) throw new Error("useNewProject must be used inside ProjectWizardProvider");
  return ctx;
}

export function ProjectWizardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProjectId = searchParams.get('project');
  const { user, profile } = useAuth();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const saveSlides = useSaveSlides();
  const { toast } = useToast();
  const maxSlides = getMaxSlides(profile?.plan || 'free');

  // Core state
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
  const [generationMode] = useState<'full'>('full');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(editProjectId);
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [hydrated, setHydrated] = useState(false);
  const [appCategory, setAppCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [templateMoodFilter, setTemplateMoodFilter] = useState<string>('All');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('All');
  const [uploadedScreens, setUploadedScreens] = useState<UploadedScreen[]>([]);
  const [referenceMockups, setReferenceMockups] = useState<ReferenceMockup[]>([]);
  const [inspirationText, setInspirationText] = useState('');
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandFont, setBrandFont] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [visualPreferences, setVisualPreferences] = useState<string[]>([]);

  const screenInputRef = useRef<HTMLInputElement | null>(null);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);
  const brandInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch existing project data for draft hydration
  const { data: existingProject } = useProject(editProjectId || undefined);
  const { data: existingSlides } = useProjectSlides(editProjectId || undefined);

  // Hydrate state from DB when editing a draft
  useEffect(() => {
    if (hydrated || !editProjectId || !existingProject) return;
    setHydrated(true);
    setAppName(existingProject.app_name || '');
    setProjectName(existingProject.name || '');
    setAppDescription(existingProject.app_description || '');
    setPlatform(existingProject.platform || 'both');
    setSelectedTemplate(existingProject.template_id || '');
    setConsistencyLevel((existingProject.consistency_level as any) || 'balanced');
    setDeviceFormats((existingProject.device_formats as string[]) || ['iphone-6-5', 'iphone-6-9']);
    // generationMode is always 'full'
    setOutputLanguage(existingProject.output_language || 'en');
    const config = existingProject.config as any;
    if (config) {
      setPrimaryGoal(config.primaryGoal || '');
      setSelectedTone(config.tone || 'premium');
      setShortDescription(config.shortDescription || '');
      setValueProposition(config.valueProposition || '');
      setKeyFeatures(Array.isArray(config.keyFeatures) ? config.keyFeatures.join('\n') : '');
      setTopBenefits(Array.isArray(config.topBenefits) ? config.topBenefits.join('\n') : '');
      setAppCategory(config.appCategory || '');
      setTargetAudience(config.targetAudience || '');
      setInspirationText(config.inspirationText || '');
    }
    const brandKit = existingProject.brand_kit as any;
    if (brandKit) {
      setBrandColors(brandKit.colors || []);
      setBrandFont(brandKit.fontFamily || '');
    }

    // Restore step if provided in URL
    const urlStep = searchParams.get('step');
    if (urlStep) {
      const stepNum = parseInt(urlStep);
      if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 7) {
        setCurrentStep(stepNum);
      }
    }
  }, [editProjectId, existingProject, hydrated, searchParams]);

  // Hydrate slides from DB
  useEffect(() => {
    if (!editProjectId || !existingSlides?.length || hydrated === false) return;
    const hydratedSlides: SlideItem[] = existingSlides.map((s) => ({
      id: s.id,
      number: s.slide_number,
      objective: s.objective || 'Feature spotlight',
      headline: s.headline || '',
      subheadline: s.subheadline || '',
      keyMessage: '',
      rawScreenTag: s.raw_screen_tag || 'home',
      emphasis: s.emphasis || 'UI focused',
      importance: (s.importance as any) || 'medium',
      status: (s.status as SlideItem['status']) || 'pending',
      locked: [],
    }));
    setSlides(hydratedSlides);
    setSlideCount(hydratedSlides.length);
  }, [editProjectId, existingSlides, hydrated]);

  // Hydrate assets from DB
  const [assetsHydrated, setAssetsHydrated] = useState(false);
  useEffect(() => {
    if (!editProjectId || !user || assetsHydrated) return;
    const fetchAssets = async () => {
      try {
        const { data: assets, error } = await supabase
          .from('assets')
          .select('id, storage_path, asset_type, tag, filename')
          .eq('project_id', editProjectId);
        if (error) throw error;
        if (!assets || assets.length === 0) { setAssetsHydrated(true); return; }
        const newScreens: UploadedScreen[] = [];
        const newReferences: ReferenceMockup[] = [];
        const newBrandAssets: BrandAsset[] = [];
        const promises = assets.map(async (asset) => {
          const { data } = await supabase.storage.from('raw-uploads').createSignedUrl(asset.storage_path, 3600);
          if (data?.signedUrl) {
            try {
              const res = await fetch(data.signedUrl);
              const blob = await res.blob();
              const file = new File([blob], asset.filename || 'asset.png', { type: blob.type });
              const preview = URL.createObjectURL(file);
              if (asset.asset_type === 'screen' || asset.asset_type === 'raw_screen') {
                newScreens.push({ id: `db-${asset.id}`, file, preview, tag: asset.tag || 'home' });
              } else if (asset.asset_type === 'reference') {
                newReferences.push({ id: `db-ref-${asset.id}`, file, preview });
              } else if (['logo', 'icon', 'mascot'].includes(asset.asset_type)) {
                newBrandAssets.push({ type: asset.asset_type as 'logo' | 'icon' | 'mascot', file, preview });
              }
            } catch (e) { console.error("Failed to reconstruct asset", e); }
          }
        });
        await Promise.all(promises);
        if (newScreens.length > 0) setUploadedScreens(newScreens);
        if (newReferences.length > 0) setReferenceMockups(newReferences);
        if (newBrandAssets.length > 0) setBrandAssets(newBrandAssets);
      } catch (e) { console.error("Failed to hydrate assets", e); }
      finally { setAssetsHydrated(true); }
    };
    fetchAssets();
  }, [editProjectId, user, assetsHydrated]);

  const toggleFormat = (f: string) => {
    setDeviceFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSlideCountChange = (count: number) => {
    const clamped = Math.min(count, maxSlides);
    setSlideCount(clamped);
    const key = clamped <= 5 ? '5-slide' : '10-slide';
    setSlides(defaultStorylines[key].slice(0, clamped));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((s, i) => ({ ...s, number: i + 1 }));
      });
    }
  };

  const updateSlide = (id: string, field: keyof SlideItem, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSlide = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, number: i + 1 })));
    setSlideCount(prev => prev - 1);
  };

  const addSlide = () => {
    if (slides.length >= maxSlides) {
      toast({ title: "Limit reached", description: `Max ${maxSlides} slides for your plan.`, variant: "destructive" });
      return;
    }
    const newSlide: SlideItem = {
      id: `s${Date.now()}`,
      number: slides.length + 1,
      objective: 'Feature spotlight',
      headline: '',
      subheadline: '',
      keyMessage: '',
      rawScreenTag: uploadedScreens.length > 0 ? uploadedScreens[0].tag : 'home',
      emphasis: 'UI focused',
      importance: 'medium',
      status: 'pending',
      locked: [],
    };
    setSlides(prev => [...prev, newSlide]);
    setSlideCount(prev => prev + 1);
  };

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

  useEffect(() => {
    if (uploadedScreens.length === 0) return;

    const availableTags = [...new Set(uploadedScreens.map((screen) => screen.tag).filter(Boolean))];
    if (availableTags.length === 0) return;

    setSlides((prev) => {
      let hasChanges = false;
      const normalized = prev.map((slide, idx) => {
        if (availableTags.includes(slide.rawScreenTag)) return slide;

        const fallbackTag = availableTags[Math.min(idx, availableTags.length - 1)] || availableTags[0];
        if (fallbackTag === slide.rawScreenTag) return slide;

        hasChanges = true;
        return { ...slide, rawScreenTag: fallbackTag };
      });

      return hasChanges ? normalized : prev;
    });
  }, [uploadedScreens]);

  const handleReferenceUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const newRefs: ReferenceMockup[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      newRefs.push({
        id: `ref-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setReferenceMockups(prev => [...prev, ...newRefs]);
  }, []);

  const removeReferenceMockup = (id: string) => {
    setReferenceMockups(prev => {
      const ref = prev.find(r => r.id === id);
      if (ref) URL.revokeObjectURL(ref.preview);
      return prev.filter(r => r.id !== id);
    });
  };

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

  const handleAutoDetectColors = async () => {
    if (uploadedScreens.length === 0 && brandAssets.length === 0) {
      toast({ title: "No assets", description: "Upload screenshots or brand assets first.", variant: "destructive" });
      return;
    }
    const sources = [...uploadedScreens.map(s => s.preview), ...brandAssets.map(a => a.preview)].slice(0, 4);
    const allColors: string[] = [];
    for (const src of sources) {
      const colors = await extractColorsFromImage(src);
      allColors.push(...colors);
    }
    const unique = [...new Set(allColors)].slice(0, 5);
    if (unique.length > 0) {
      setBrandColors(unique);
      toast({ title: "Colors detected", description: `${unique.length} dominant colors extracted from your assets.` });
    } else {
      toast({ title: "No colors found", description: "Could not extract meaningful colors.", variant: "destructive" });
    }
  };

  const handleAutoFillSlides = async () => {
    if (!appName && !appDescription) {
      toast({ title: "Missing info", description: "Fill in app name and description first (Step 2).", variant: "destructive" });
      return;
    }
    setIsAutoFilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Not authenticated", variant: "destructive" }); return; }
      const response = await supabase.functions.invoke('suggest-copy', {
        body: { type: 'storylines', appName, appDescription: appDescription || shortDescription, slideCount, platform },
      });
      const resultData = response.data?.result || response.data;
      if (resultData?.slides) {
        const aiSlides = resultData.slides as Array<{ headline: string; subheadline: string; objective?: string }>;
        setSlides(prev => prev.map((s, i) => {
          const ai = aiSlides[i];
          if (!ai) return s;
          return { ...s, headline: ai.headline || s.headline, subheadline: ai.subheadline || s.subheadline, objective: ai.objective || s.objective };
        }));
        toast({ title: "Slides auto-filled!", description: "AI-generated headlines based on your app info." });
      }
    } catch (e) {
      console.error("Auto-fill failed:", e);
      toast({ title: "Auto-fill failed", description: "Try again or fill manually.", variant: "destructive" });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const getScreenOptions = () => {
    const uploadOptions = [...new Set(uploadedScreens.map((s) => s.tag).filter(Boolean))];
    return uploadOptions.length > 0 ? uploadOptions : screenTags;
  };

  const filteredTemplates = demoTemplates.filter(t => {
    if (templateMoodFilter !== 'All' && t.mood !== templateMoodFilter) return false;
    if (templateCategoryFilter !== 'All' && t.category !== templateCategoryFilter) return false;
    return true;
  });

  const templateCategories = ['All', ...new Set(demoTemplates.map(t => t.category))];

  const getFinalProjectName = () => appName || projectName || 'App Screens';

  const sanitizeFileNameForStorage = (fileName: string) => {
    const normalized = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’'`]/g, '');

    const lastDot = normalized.lastIndexOf('.');
    const rawBase = lastDot > 0 ? normalized.slice(0, lastDot) : normalized;
    const rawExt = lastDot > 0 ? normalized.slice(lastDot + 1) : '';

    const safeBase =
      rawBase
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'file';

    const safeExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    return safeExt ? `${safeBase}.${safeExt}` : safeBase;
  };

  const uploadAssetsToStorage = async (projectId: string, userId: string) => {
    const assets: { storage_path: string; asset_type: string; tag: string; filename: string }[] = [];

    const uploadWithSafeFallback = async (
      folder: 'screens' | 'references' | 'brand',
      file: File,
      prefix: string,
    ) => {
      const safeFileName = sanitizeFileNameForStorage(file.name);
      let storagePath = `${userId}/${projectId}/${folder}/${prefix}-${safeFileName}`;

      const { error } = await supabase.storage.from('raw-uploads').upload(storagePath, file, { upsert: true });

      if (error && /invalid key/i.test(error.message || '')) {
        const ext = safeFileName.includes('.') ? safeFileName.split('.').pop() : '';
        const retryName = `${prefix}-${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
        storagePath = `${userId}/${projectId}/${folder}/${retryName}`;

        const { error: retryError } = await supabase.storage.from('raw-uploads').upload(storagePath, file, { upsert: true });
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      return storagePath;
    };

    for (const screen of uploadedScreens) {
      const storagePath = await uploadWithSafeFallback('screens', screen.file, screen.id);
      assets.push({ storage_path: storagePath, asset_type: 'raw_screen', tag: screen.tag, filename: screen.file.name });
    }

    for (const ref of referenceMockups) {
      const storagePath = await uploadWithSafeFallback('references', ref.file, ref.id);
      assets.push({ storage_path: storagePath, asset_type: 'reference', tag: 'reference', filename: ref.file.name });
    }

    for (const asset of brandAssets) {
      const storagePath = await uploadWithSafeFallback('brand', asset.file, asset.type);
      assets.push({ storage_path: storagePath, asset_type: asset.type, tag: asset.type, filename: asset.file.name });
    }

    if (assets.length === 0) return;

    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('assets')
      .insert(assets.map(a => ({ ...a, project_id: projectId, user_id: userId })));

    if (insertError) throw insertError;
  };

  const buildProjectPayload = () => ({
    name: getFinalProjectName(),
    app_name: appName,
    app_description: appDescription,
    platform,
    template_id: selectedTemplate !== 'reference' ? selectedTemplate.toLowerCase().replace(/\s+/g, '-') : 'clean-saas',
    consistency_level: consistencyLevel,
    device_formats: deviceFormats as any,
    generation_mode: generationMode,
    status: 'draft' as const,
    brand_kit: { colors: brandColors, fontFamily: brandFont } as any,
    config: {
      primaryGoal,
      tone: selectedTone,
      shortDescription,
      valueProposition,
      keyFeatures: keyFeatures.split('\n').filter(Boolean),
      topBenefits: topBenefits.split('\n').filter(Boolean),
      outputLanguage,
      appCategory,
      targetAudience,
      inspirationText,
      visualPreferences,
    } as any,
    output_language: outputLanguage,
  });

  const saveProjectAndSlides = async (): Promise<string> => {
    const payload = buildProjectPayload();
    let projectId: string;
    if (savedProjectId) {
      console.log("[SAVE] Updating existing project:", savedProjectId);
      await updateProject.mutateAsync({ id: savedProjectId, ...payload });
      projectId = savedProjectId;
    } else {
      console.log("[SAVE] Creating new project with payload:", JSON.stringify(payload).slice(0, 200));
      const project = await createProject.mutateAsync(payload);
      projectId = project.id;
      setSavedProjectId(projectId);
      console.log("[SAVE] Created project:", projectId);
    }
    console.log("[SAVE] Saving", slides.length, "slides for project:", projectId);
    const availableScreenTags = [...new Set(uploadedScreens.map((screen) => screen.tag).filter(Boolean))];

    await saveSlides.mutateAsync({
      projectId,
      slides: slides.map((s, i) => {
        const fallbackTag = availableScreenTags[Math.min(i, availableScreenTags.length - 1)] || 'home';
        const normalizedTag = availableScreenTags.length > 0
          ? (availableScreenTags.includes(s.rawScreenTag) ? s.rawScreenTag : fallbackTag)
          : (s.rawScreenTag || 'home');

        return {
          slide_number: i + 1,
          objective: s.objective,
          headline: s.headline,
          subheadline: s.subheadline || '',
          raw_screen_tag: normalizedTag,
          emphasis: s.emphasis,
          importance: s.importance,
          status: 'pending',
        };
      }),
    });
    console.log("[SAVE] Slides saved, uploading assets...");
    if (user) await uploadAssetsToStorage(projectId, user.id);
    console.log("[SAVE] Assets uploaded");
    return projectId;
  };

  const handleSaveDraft = async () => {
    if (!user) { toast({ title: "Not authenticated", variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      await supabase.auth.refreshSession();
      await saveProjectAndSlides();
      setLastSavedAt(new Date());
      toast({ title: "Draft saved ✓", description: `Project "${getFinalProjectName()}" saved.` });
    } catch (e) {
      console.error("Draft save failed:", e);
      toast({ title: "Save failed", description: "Could not save draft.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) { toast({ title: "Not authenticated", variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      // Refresh session to prevent stale JWT causing RLS violations
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn("[GENERATE] Session refresh failed, proceeding anyway:", refreshError.message);
      }
      console.log("[GENERATE] Starting saveProjectAndSlides...");
      console.log("[GENERATE] slides count:", slides.length, "user:", user.id);
      const projectId = await saveProjectAndSlides();
      console.log("[GENERATE] Project saved, id:", projectId);
      // Ensure status is set to generating so the generation page auto-starts
      await updateProject.mutateAsync({ id: projectId, status: 'generating' });
      console.log("[GENERATE] Status set to generating, navigating...");
      navigate(`/project/${projectId}/generating`);
    } catch (e: any) {
      console.error("[GENERATE] Failed to save project:", e?.message, e?.code, e?.details, e);
      toast({ title: "Error", description: `Failed to create project: ${e?.message || 'Unknown error'}`, variant: "destructive" });
      setIsSaving(false);
    }
  };

  const next = () => setCurrentStep(s => Math.min(s + 1, 7));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <NewProjectContext.Provider value={{
      currentStep, setCurrentStep, next, prev,
      projectName, setProjectName, appName, setAppName, platform, setPlatform,
      appCategory, setAppCategory, targetAudience, setTargetAudience,
      primaryGoal, setPrimaryGoal, outputLanguage, setOutputLanguage,
      deviceFormats, toggleFormat,
      appDescription, setAppDescription, shortDescription, setShortDescription,
      valueProposition, setValueProposition, keyFeatures, setKeyFeatures,
      topBenefits, setTopBenefits, selectedTone, setSelectedTone,
      uploadedScreens, setUploadedScreens, handleScreenUpload, removeScreen, screenInputRef,
      referenceMockups, handleReferenceUpload, removeReferenceMockup, referenceInputRef,
      inspirationText, setInspirationText,
      brandAssets, setBrandAssets, brandColors, setBrandColors, brandFont, setBrandFont,
      newColor, setNewColor, handleBrandUpload, removeBrandAsset, handleAutoDetectColors,
      brandInputRefs, visualPreferences, setVisualPreferences,
      selectedTemplate, setSelectedTemplate, templateMoodFilter, setTemplateMoodFilter,
      templateCategoryFilter, setTemplateCategoryFilter, filteredTemplates, templateCategories,
      slides, setSlides, slideCount, handleSlideCountChange, isAutoFilling,
      consistencyLevel, setConsistencyLevel, sensors, handleDragEnd,
      handleAutoFillSlides, updateSlide, removeSlide, addSlide, getScreenOptions, maxSlides,
      generationMode,
      isSaving, lastSavedAt, handleSaveDraft, handleGenerate, getFinalProjectName,
      profile,
    }}>
      {children}
    </NewProjectContext.Provider>
  );
}
