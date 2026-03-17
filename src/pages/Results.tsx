import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download, RefreshCw, Globe, Loader2, Wand2, Send, Lock, Sparkles, ImageDown, ChevronLeft, ChevronRight, Coins, CheckCircle2, Smartphone, Tablet, Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject, useProjectSlides } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TranslationsModal } from "@/components/project/TranslationsModal";
import { canTranslate, CREDIT_COSTS } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";
import { useBilling } from "@/hooks/useBilling";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";

const isStoragePath = (value: string | null) => {
  if (!value) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
};

interface SavedTranslation {
  id: string;
  slide_number: number;
  target_language: string;
  source_language: string;
  storage_path: string;
  device_format: string;
  created_at: string;
  signedUrl?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  French: 'French (Fran\u00e7ais)',
  Spanish: 'Spanish (Espa\u00f1ol)',
  German: 'German (Deutsch)',
  Japanese: 'Japanese (\u65e5\u672c\u8a9e)',
  Portuguese: 'Portuguese (Portugu\u00eas)',
  Chinese: 'Chinese (\u4e2d\u6587)',
  Korean: 'Korean (\ud55c\uad6d\uc5b4)',
  Italian: 'Italian (Italiano)',
  Arabic: 'Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629)',
  Russian: 'Russian (\u0420\u0443\u0441\u0441\u043a\u0438\u0439)',
  Turkish: 'Turkish (T\u00fcrk\u00e7e)',
  Hindi: 'Hindi (\u0939\u093f\u0928\u094d\u0926\u0940)',
};

const Results = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: project } = useProject(projectId);
  const { data: slides, refetch: refetchSlides } = useProjectSlides(projectId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingSlideId, setRegeneratingSlideId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [showRegenPrompt, setShowRegenPrompt] = useState(false);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizedFormats, setResizedFormats] = useState<Record<string, { slide_number: number; imageUrl: string }[]>>({});
  const [activeFormatTab, setActiveFormatTab] = useState<string | null>(null);

  const userPlan = (profile?.plan || 'free') as any;
  const userCredits = profile?.credits ?? 0;
  const { handleUpgrade: billingUpgrade, isOpeningPortal } = useBilling();
  const [showWatermarkWarning, setShowWatermarkWarning] = useState(false);

  // Resolve storage paths to signed URLs
  const resolveImages = useCallback(async () => {
    if (!slides?.length) return;
    const toResolve = slides.filter(s => s.image_url && isStoragePath(s.image_url) && !resolvedImages[s.id]);
    if (toResolve.length === 0) return;

    const newResolved: Record<string, string> = {};
    await Promise.all(toResolve.map(async (slide) => {
      try {
        const { data } = await supabase.storage.from("generated-outputs").createSignedUrl(slide.image_url!, 60 * 60 * 2);
        if (data?.signedUrl) newResolved[slide.id] = data.signedUrl;
      } catch { /* skip */ }
    }));

    if (Object.keys(newResolved).length > 0) {
      setResolvedImages(prev => ({ ...prev, ...newResolved }));
    }
  }, [slides, resolvedImages]);

  useEffect(() => { resolveImages(); }, [resolveImages]);

  // Fetch saved translations from DB
  const fetchSavedTranslations = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('project_translations')
        .select('*')
        .eq('project_id', projectId)
        .order('target_language')
        .order('slide_number');
      if (error || !data) return;

      // Resolve signed URLs for all translations
      const withUrls = await Promise.all(data.map(async (tr: any) => {
        try {
          const { data: signed } = await supabase.storage.from('generated-outputs').createSignedUrl(tr.storage_path, 60 * 60 * 2);
          return { ...tr, signedUrl: signed?.signedUrl || '' };
        } catch {
          return { ...tr, signedUrl: '' };
        }
      }));
      setSavedTranslations(withUrls);
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { fetchSavedTranslations(); }, [fetchSavedTranslations]);

  const handleDownloadTranslation = async (tr: SavedTranslation) => {
    if (!tr.signedUrl) return;
    try {
      const res = await fetch(tr.signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const langSlug = tr.target_language.toLowerCase().replace(/[^a-z]/g, '');
      a.download = `slide-${tr.slide_number}-${langSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleDownloadTranslationSet = async (lang: string) => {
    const langTranslations = savedTranslations.filter(t => t.target_language === lang && t.signedUrl);
    if (langTranslations.length === 0) return;

    const zip = new JSZip();
    const langSlug = lang.toLowerCase().replace(/[^a-z]/g, '');
    const appLabel = project?.app_name || 'export';
    const formats = [...new Set(langTranslations.map(t => t.device_format || 'iphone-6-5'))];

    for (const fmt of formats) {
      const fmtSlug = fmt.replace(/[^a-z0-9-]/g, '');
      const folderName = formats.length > 1 ? `${appLabel}-${langSlug}-${fmtSlug}` : `${appLabel}-${langSlug}`;
      const folder = zip.folder(folderName);
      if (!folder) continue;

      const fmtTranslations = langTranslations.filter(t => (t.device_format || 'iphone-6-5') === fmt);
      for (const tr of fmtTranslations) {
        try {
          const res = await fetch(tr.signedUrl!);
          const blob = await res.blob();
          folder.file(`slide-${String(tr.slide_number).padStart(2, '0')}-${langSlug}.png`, blob);
        } catch { /* skip */ }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${appLabel}-${langSlug}.zip`);
  };

  // Group translations by language + format
  const translationsByLangFormat = savedTranslations.reduce<Record<string, SavedTranslation[]>>((acc, tr) => {
    const key = `${tr.target_language}|||${tr.device_format || 'iphone-6-5'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tr);
    return acc;
  }, {});

  // Also group just by language for the accordion headers
  const translationLanguages = [...new Set(savedTranslations.map(tr => tr.target_language))];

  const FORMAT_SHORT: Record<string, string> = {
    'iphone-6-5': '6.5"',
    'iphone-6-9': '6.9"',
    'ipad-12-9': '12.9" iPad',
  };

  const FORMAT_LABELS: Record<string, { label: string; icon: typeof Smartphone }> = {
    'iphone-6-5': { label: '6.5"', icon: Smartphone },
    'iphone-6-9': { label: '6.9"', icon: Smartphone },
    'ipad-12-9': { label: '12.9" iPad', icon: Tablet },
  };

  const projectFormats = (project?.device_formats as string[]) || ['iphone-6-5'];
  const primaryFormat = projectFormats[0] || 'iphone-6-5';
  const additionalFormats = projectFormats.filter(f => f !== primaryFormat);

  const handleResizeFormat = async (targetFormat: string) => {
    if (!projectId || isResizing) return;
    const slideCount = slides?.length || 0;
    if (!checkCredits(slideCount * CREDIT_COSTS.regenerateSlide)) return;

    setIsResizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/resize-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ project_id: projectId, target_format: targetFormat }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      if (result.slides?.length > 0) {
        setResizedFormats(prev => ({ ...prev, [targetFormat]: result.slides }));
        setActiveFormatTab(targetFormat);
        toast({ title: `${FORMAT_LABELS[targetFormat]?.label || targetFormat} format generated!`, description: `${result.slides.length} slide(s) resized.` });
        await refreshProfile();
      }
    } catch (err: any) {
      toast({ title: 'Resize failed', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsResizing(false);
    }
  };

  const handleDownloadFormat = async (format: string) => {
    const formatSlides = resizedFormats[format];
    if (!formatSlides?.length) return;

    const zip = new JSZip();
    const formatSlug = format.replace(/[^a-z0-9-]/g, '');
    const folder = zip.folder(`${project?.app_name || 'export'}-${formatSlug}`);
    if (!folder) return;

    for (const slide of formatSlides) {
      try {
        const res = await fetch(slide.imageUrl);
        const blob = await res.blob();
        folder.file(`slide-${String(slide.slide_number).padStart(2, '0')}-${formatSlug}.png`, blob);
      } catch { /* skip */ }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${project?.app_name || 'export'}-${formatSlug}.zip`);
  };

  const getImageUrl = (slide: any) => {
    if (!slide?.image_url) return null;
    if (resolvedImages[slide.id]) return resolvedImages[slide.id];
    if (!isStoragePath(slide.image_url)) return slide.image_url;
    return null;
  };

  const selectedSlide = slides?.[selectedIndex] || slides?.[0];
  const selectedImageUrl = selectedSlide ? getImageUrl(selectedSlide) : null;
  const isFreePlan = userPlan === 'free';
  const isSlideLocked = isFreePlan && selectedIndex > 0;

  const handleUpgrade = () => billingUpgrade('starter', `/project/${projectId}/results`);

  const checkCredits = (cost: number): boolean => {
    if (userCredits < cost) {
      toast({ title: t('results.insufficientCredits'), description: `You need ${cost} credit(s). Current balance: ${userCredits}.`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleDownloadClick = () => {
    if (userPlan === 'free') setShowWatermarkWarning(true);
    else executeDownload();
  };

  const executeDownload = async () => {
    if (!projectId || !slides?.length) return;
    setIsExporting(true);
    setShowWatermarkWarning(false);
    try {
      const zip = new JSZip();
      const appLabel = project?.app_name || project?.name || 'export';

      // Original format slides
      const originalFolder = zip.folder(`${appLabel}-${primaryFormat}`);
      let count = 0;
      if (originalFolder) {
        for (const slide of slides) {
          const url = getImageUrl(slide);
          if (!url) continue;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const blob = await res.blob();
            const ext = blob.type.includes('png') ? 'png' : 'jpg';
            originalFolder.file(`slide-${String(slide.slide_number).padStart(2, '0')}.${ext}`, blob);
            count++;
          } catch { /* skip */ }
        }
      }

      // Include resized format slides in separate subfolders
      for (const [fmt, fmtSlides] of Object.entries(resizedFormats)) {
        if (!fmtSlides?.length) continue;
        const fmtFolder = zip.folder(`${appLabel}-${fmt}`);
        if (!fmtFolder) continue;
        for (const slide of fmtSlides) {
          try {
            const res = await fetch(slide.imageUrl);
            if (!res.ok) continue;
            const blob = await res.blob();
            fmtFolder.file(`slide-${String(slide.slide_number).padStart(2, '0')}.png`, blob);
            count++;
          } catch { /* skip */ }
        }
      }

      if (count === 0) { toast({ title: t('results.noImages'), variant: "destructive" }); return; }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${appLabel}.zip`);
      toast({ title: isFreePlan ? t('results.exportWatermark') : t('results.exportComplete') });
    } catch (e) {
      toast({ title: t('results.exportFailed'), variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerateAll = async () => {
    const totalCost = (slides?.length || 0) * CREDIT_COSTS.regenerateSlide;
    if (!checkCredits(totalCost)) return;
    setIsRegenerating(true);
    try {
      if (!projectId) return;
      await supabase.from('projects').update({ status: 'generating' }).eq('id', projectId);
      await supabase.from('project_slides').update({ status: 'pending', image_url: null }).eq('project_id', projectId);
      navigate(`/project/${projectId}/generating`);
    } catch {
      toast({ title: t('results.regenFailed'), variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateSingle = async (slideId: string) => {
    if (!checkCredits(CREDIT_COSTS.regenerateSlide)) return;
    setRegeneratingSlideId(slideId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !projectId) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-screenshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ project_id: projectId, single_slide_id: slideId, user_prompt: regenPrompt || undefined, idempotency_key: crypto.randomUUID() }),
      });

      if (response.ok) {
        // Consume the SSE stream
        const reader = response.body?.getReader();
        if (reader) { while (true) { const { done } = await reader.read(); if (done) break; } }
        await refetchSlides();
        await refreshProfile();
        // Clear resolved cache for this slide to force re-resolve
        setResolvedImages(prev => { const next = { ...prev }; delete next[slideId]; return next; });
        setRegenPrompt('');
        setShowRegenPrompt(false);
        toast({ title: t('results.slideRegenerated') });
      } else {
        const errBody = await response.json().catch(() => ({ error: "Unknown error" }));
        toast({ title: t('results.regenFailed'), description: errBody.error || "Server error", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: t('results.regenFailed'), description: e.message || "Network error", variant: "destructive" });
    } finally {
      setRegeneratingSlideId(null);
    }
  };

  if (!project || !slides) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{project.app_name || project.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {t('results.slides', { count: slides.length })}
              </Badge>
              <Badge variant="outline" className="text-xs">{project.platform}</Badge>
              <Badge variant="outline" className="text-xs">
                <Coins className="h-3 w-3 mr-1" /> {userCredits} {t('generating.credits')}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canTranslate(userPlan) && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsTranslationModalOpen(true)}>
                <Globe className="mr-1.5 h-3.5 w-3.5" /> {t('results.translate')}
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleRegenerateAll} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              {t('results.regenerateAll')}
            </Button>
            <Button size="sm" className="rounded-xl" onClick={handleDownloadClick} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
              {t('results.exportZip')}
            </Button>
          </div>
        </motion.div>

        {/* Main grid: slides gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {slides.map((slide, index) => {
            const imgUrl = getImageUrl(slide);
            const locked = isFreePlan && index > 0;

            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-[9/16] rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group ${selectedIndex === index ? 'border-primary ring-2 ring-primary/30 shadow-glow' : 'border-border hover:border-primary/40'}`}
              >
                {imgUrl && !locked ? (
                  <img src={imgUrl} alt={`Slide ${slide.slide_number}`} className="w-full h-full object-contain transition-transform group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {locked ? (
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-bold">{t('common.upgrade')}</span>
                      </div>
                    ) : (
                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] font-black text-foreground">{slide.slide_number}</span>
                </div>
                {regeneratingSlideId === slide.id && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Multi-format resize section */}
        {additionalFormats.length > 0 && (
          <div className="mb-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" /> Device Formats
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFormatTab === null ? 'default' : 'outline'}
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => setActiveFormatTab(null)}
              >
                <Smartphone className="h-3 w-3 mr-1" />
                {FORMAT_LABELS[primaryFormat]?.label || primaryFormat} (original)
              </Button>
              {additionalFormats.map(fmt => {
                const hasGenerated = !!resizedFormats[fmt]?.length;
                const FormatIcon = FORMAT_LABELS[fmt]?.icon || Smartphone;
                return (
                  <div key={fmt} className="flex gap-1">
                    {hasGenerated ? (
                      <>
                        <Button
                          variant={activeFormatTab === fmt ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-lg text-xs"
                          onClick={() => setActiveFormatTab(fmt)}
                        >
                          <FormatIcon className="h-3 w-3 mr-1" />
                          {FORMAT_LABELS[fmt]?.label || fmt}
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="rounded-lg text-xs h-8 px-2"
                          onClick={() => handleDownloadFormat(fmt)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs border-dashed"
                        onClick={() => handleResizeFormat(fmt)}
                        disabled={isResizing}
                      >
                        {isResizing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FormatIcon className="h-3 w-3 mr-1" />}
                        Generate {FORMAT_LABELS[fmt]?.label || fmt}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">{slides?.length || 0} cr</Badge>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show resized slides when a format tab is active */}
            {activeFormatTab && resizedFormats[activeFormatTab] && (
              <div className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {resizedFormats[activeFormatTab].map((slide) => (
                    <div
                      key={slide.slide_number}
                      className={`relative rounded-xl border-2 border-border overflow-hidden ${activeFormatTab.includes('ipad') ? 'aspect-[3/4]' : 'aspect-[9/16]'}`}
                    >
                      <img src={slide.imageUrl} alt={`Slide ${slide.slide_number} - ${activeFormatTab}`} className="w-full h-full object-contain" loading="lazy" />
                      <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                        <span className="text-[10px] font-black text-foreground">{slide.slide_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected slide detail */}
        {selectedSlide && (
          <motion.div
            key={selectedSlide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image preview */}
              <div className="flex-shrink-0 relative">
                <div className="w-full max-w-xs mx-auto md:mx-0 aspect-[9/16] rounded-xl overflow-hidden border border-border bg-muted">
                  {selectedImageUrl && !isSlideLocked ? (
                    <img src={selectedImageUrl} alt={`Slide ${selectedSlide.slide_number}`} className="w-full h-full object-contain" />
                  ) : isSlideLocked ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Lock className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">{t('results.upgradeToUnlock')}</p>
                      <p className="text-xs text-muted-foreground">{t('results.freePreview')}</p>
                      <Button size="sm" onClick={handleUpgrade} disabled={isOpeningPortal} className="mt-2 rounded-xl">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {t('common.upgrade')}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    </div>
                  )}
                </div>

                {/* Slide navigation */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={selectedIndex === 0} onClick={() => setSelectedIndex(i => i - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-black text-muted-foreground">{selectedIndex + 1} / {slides.length}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={selectedIndex === slides.length - 1} onClick={() => setSelectedIndex(i => i + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Slide info & actions */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedSlide.headline || `Slide ${selectedSlide.slide_number}`}</h3>
                  {selectedSlide.subheadline && <p className="text-sm text-muted-foreground mt-1">{selectedSlide.subheadline}</p>}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{selectedSlide.objective}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedSlide.emphasis}</Badge>
                </div>

                {/* Actions */}
                {!isSlideLocked && (
                  <div className="space-y-3 pt-2">
                    {selectedImageUrl && (
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={async () => {
                        try {
                          const res = await fetch(selectedImageUrl);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${project.app_name || project.name}-slide-${selectedSlide.slide_number}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch { toast({ title: t('results.downloadFailed'), variant: "destructive" }); }
                      }}>
                        <ImageDown className="mr-1.5 h-3.5 w-3.5" /> {t('results.saveSlide')}
                      </Button>
                    )}

                    {showRegenPrompt ? (
                      <div className="space-y-2">
                        <Textarea
                          value={regenPrompt}
                          onChange={e => setRegenPrompt(e.target.value)}
                          placeholder={t('results.describeChanges')}
                          className="bg-card border-border text-sm min-h-[70px] resize-none rounded-xl p-3"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRegenerateSingle(selectedSlide.id)} disabled={regeneratingSlideId === selectedSlide.id} className="rounded-lg">
                            {regeneratingSlideId === selectedSlide.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                            {t('results.regenerateCredit')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowRegenPrompt(false); setRegenPrompt(''); }} className="rounded-lg text-muted-foreground">{t('common.cancel')}</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowRegenPrompt(true)} className="rounded-lg w-full">
                        <Wand2 className="mr-2 h-4 w-4 text-primary" /> {t('results.regeneratePrompt')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Saved Translations Section */}
      {translationLanguages.length > 0 && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto -mt-4">
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" /> Translations
            </h3>
            <div className="space-y-3">
              {translationLanguages.map(lang => {
                const langTranslations = savedTranslations.filter(tr => tr.target_language === lang);
                const langFormats = [...new Set(langTranslations.map(tr => tr.device_format || 'iphone-6-5'))];

                return (
                  <div key={lang} className="border border-border/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedLang(expandedLang === lang ? null : lang)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">{LANGUAGE_LABELS[lang] || lang}</span>
                        <Badge variant="outline" className="text-xs">{langTranslations.length} slide(s)</Badge>
                        {langFormats.length > 1 && (
                          <Badge variant="outline" className="text-xs">{langFormats.length} sizes</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost" size="sm" className="text-xs h-7 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); handleDownloadTranslationSet(lang); }}
                        >
                          <Download className="h-3 w-3 mr-1" /> ZIP
                        </Button>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedLang === lang ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedLang === lang && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 space-y-4">
                            {langFormats.map(fmt => {
                              const fmtKey = `${lang}|||${fmt}`;
                              const fmtTranslations = translationsByLangFormat[fmtKey] || [];
                              const isIpad = fmt.includes('ipad');

                              return (
                                <div key={fmt}>
                                  {langFormats.length > 1 && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-[10px] font-bold">{FORMAT_SHORT[fmt] || fmt}</Badge>
                                      <span className="text-[10px] text-muted-foreground">{fmtTranslations.length} slide(s)</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {fmtTranslations.map(tr => (
                                      <div key={tr.id} className={`relative group rounded-lg overflow-hidden border border-border ${isIpad ? 'aspect-[3/4]' : 'aspect-[9/16]'}`}>
                                        {tr.signedUrl ? (
                                          <img src={tr.signedUrl} alt={`Slide ${tr.slide_number} - ${lang} - ${fmt}`} className="w-full h-full object-contain" loading="lazy" />
                                        ) : (
                                          <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                          </div>
                                        )}
                                        <button
                                          onClick={() => handleDownloadTranslation(tr)}
                                          className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                          <Download className="h-5 w-5 text-foreground" />
                                        </button>
                                        <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1 py-0.5 text-[10px] font-bold">{tr.slide_number}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <TranslationsModal
        isOpen={isTranslationModalOpen}
        onOpenChange={setIsTranslationModalOpen}
        projectId={projectId || ''}
        deviceFormats={projectFormats}
        generatedFormats={Object.keys(resizedFormats).filter(f => resizedFormats[f]?.length > 0)}
        onSuccess={() => { refetchSlides(); refreshProfile(); fetchSavedTranslations(); }}
      />

      <Dialog open={showWatermarkWarning} onOpenChange={setShowWatermarkWarning}>
        <DialogContent className="sm:max-w-md bg-card/95 border border-primary/20 shadow-glow backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground">
              <Lock className="h-5 w-5 text-primary" /> {t('results.watermarkTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-3">
              {t('results.watermarkDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={executeDownload} disabled={isExporting} className="w-full sm:w-auto">
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {t('results.downloadAnyway')}
            </Button>
            <Button onClick={handleUpgrade} disabled={isOpeningPortal} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {t('common.upgrade')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Results;
