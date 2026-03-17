import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download, RefreshCw, Globe, Loader2, Wand2, Send, Lock, Sparkles, ImageDown, ChevronLeft, ChevronRight, Coins, CheckCircle2, Smartphone, Tablet
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
import { resizeImageForDevice, DEVICE_DIMENSIONS } from "@/lib/image-resize";
import { isStoragePath, resolveSignedUrl } from "@/lib/storage-utils";
import { DEVICE_FORMAT_LABELS, FORMAT_SUFFIX, LANGUAGE_LABELS } from "@/lib/localization";

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

interface ResizedFormatSlide {
  slide_number: number;
  imageUrl: string;
  storagePath: string;
}

const Results = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { profile, refreshProfile, user } = useAuth();
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
  const [resizedFormats, setResizedFormats] = useState<Record<string, ResizedFormatSlide[]>>({});
  const [activeFormatTab, setActiveFormatTab] = useState<string | null>(null);
  const resolvedImagesRef = useRef<Record<string, string>>({});

  const userPlan = (profile?.plan || 'free') as any;
  const userCredits = profile?.credits ?? 0;
  const { handleUpgrade: billingUpgrade, isOpeningPortal } = useBilling();
  const [showWatermarkWarning, setShowWatermarkWarning] = useState(false);

  useEffect(() => {
    resolvedImagesRef.current = resolvedImages;
  }, [resolvedImages]);

  // Resolve storage paths to signed URLs
  const resolveImages = useCallback(async () => {
    if (!slides?.length) return;
    const toResolve = slides.filter(
      (slide) => slide.image_url && isStoragePath(slide.image_url) && !resolvedImagesRef.current[slide.id],
    );
    if (toResolve.length === 0) return;

    const resolvedEntries = await Promise.all(
      toResolve.map(async (slide) => {
        const signed = await resolveSignedUrl("generated-outputs", slide.image_url);
        if (!signed) return null;
        return [slide.id, signed] as const;
      }),
    );

    const newResolved = Object.fromEntries(resolvedEntries.filter(Boolean) as Array<readonly [string, string]>);
    if (Object.keys(newResolved).length > 0) {
      setResolvedImages((prev) => ({ ...prev, ...newResolved }));
    }
  }, [slides]);

  useEffect(() => {
    void resolveImages();
  }, [resolveImages]);

  const refreshResizedFormatUrls = useCallback(async () => {
    const entries = Object.entries(resizedFormats);
    if (entries.length === 0) return;

    const refreshed = await Promise.all(
      entries.map(async ([format, slidesForFormat]) => {
        const refreshedSlides = await Promise.all(
          slidesForFormat.map(async (slide) => {
            const signed = await resolveSignedUrl("generated-outputs", slide.storagePath);
            return {
              ...slide,
              imageUrl: signed || slide.imageUrl,
            };
          }),
        );
        return [format, refreshedSlides] as const;
      }),
    );

    setResizedFormats(Object.fromEntries(refreshed));
  }, [resizedFormats]);

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
      const withUrls = await Promise.all(
        data.map(async (tr: any) => ({
          ...tr,
          signedUrl: (await resolveSignedUrl("generated-outputs", tr.storage_path)) || "",
        })),
      );
      setSavedTranslations(withUrls);
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => {
    void fetchSavedTranslations();
  }, [fetchSavedTranslations]);

  const refreshSignedAssets = useCallback(async () => {
    setResolvedImages({});
    await Promise.all([fetchSavedTranslations(), refreshResizedFormatUrls()]);
  }, [fetchSavedTranslations, refreshResizedFormatUrls]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSignedAssets();
    }, 90 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refreshSignedAssets]);

  useEffect(() => {
    const onFocus = () => {
      void refreshSignedAssets();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSignedAssets]);

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
    const formats = [...new Set(langTranslations.map((t) => t.device_format || "iphone-6-5"))];
    await Promise.all(
      formats.map(async (fmt) => {
        const fmtSlug = fmt.replace(/[^a-z0-9-]/g, "");
        const folderName = formats.length > 1 ? `${appLabel}-${langSlug}-${fmtSlug}` : `${appLabel}-${langSlug}`;
        const folder = zip.folder(folderName);
        if (!folder) return;

        const fmtTranslations = langTranslations.filter((t) => (t.device_format || "iphone-6-5") === fmt);
        const files = await Promise.all(
          fmtTranslations.map(async (tr) => {
            const res = await fetch(tr.signedUrl!);
            if (!res.ok) return null;
            const blob = await res.blob();
            return { slide: tr.slide_number, blob };
          }),
        );

        files.filter(Boolean).forEach((file) => {
          folder.file(`slide-${String(file!.slide).padStart(2, "0")}-${langSlug}.png`, file!.blob);
        });
      }),
    );

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
    "iphone-6-5": '6.5"',
    "iphone-6-9": '6.9"',
    "ipad-12-9": '12.9" iPad',
  };

  const FORMAT_LABELS: Record<string, { label: string; icon: typeof Smartphone }> = {
    "iphone-6-5": { label: DEVICE_FORMAT_LABELS["iphone-6-5"], icon: Smartphone },
    "iphone-6-9": { label: DEVICE_FORMAT_LABELS["iphone-6-9"], icon: Smartphone },
    "ipad-12-9": { label: DEVICE_FORMAT_LABELS["ipad-12-9"], icon: Tablet },
  };

  const projectFormats = (project?.device_formats as string[]) || ['iphone-6-5'];
  const primaryFormat = projectFormats[0] || 'iphone-6-5';
  const additionalFormats = projectFormats.filter(f => f !== primaryFormat);

  const resolvePersistedFormat = useCallback(async (format: string): Promise<ResizedFormatSlide[]> => {
    if (!projectId || !slides?.length || !user?.id) return [];
    const suffix = FORMAT_SUFFIX[format];
    if (!suffix) return [];

    const resolved = await Promise.all(
      slides.map(async (slide) => {
        const storagePath = `${user.id}/${projectId}/slide-${slide.slide_number}-${suffix}.png`;
        const signed = await resolveSignedUrl("generated-outputs", storagePath);
        if (!signed) return null;
        return {
          slide_number: slide.slide_number,
          imageUrl: signed,
          storagePath,
        };
      }),
    );

    return resolved.filter(Boolean) as ResizedFormatSlide[];
  }, [projectId, slides, user?.id]);

  useEffect(() => {
    const persistedFormats = (project?.config as any)?.resized_formats as string[] | undefined;
    if (!persistedFormats?.length) return;
    const missingFormats = persistedFormats.filter((format) => !resizedFormats[format]);
    if (missingFormats.length === 0) return;

    void (async () => {
      const loaded = await Promise.all(
        missingFormats.map(async (format) => [format, await resolvePersistedFormat(format)] as const),
      );
      const entries = loaded.filter(([, slidesForFormat]) => slidesForFormat.length > 0);
      if (entries.length === 0) return;
      setResizedFormats((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
  }, [project?.config, resolvePersistedFormat, resizedFormats]);

  const handleResizeFormat = async (targetFormat: string) => {
    if (!projectId || isResizing) return;
    const slideCount = slides?.length || 0;
    if (!checkCredits(slideCount * CREDIT_COSTS.resizeSlide)) return;

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
        const resized = result.slides.map((slide: any) => ({
          slide_number: slide.slide_number,
          imageUrl: slide.imageUrl,
          storagePath: slide.storage_path,
        })) as ResizedFormatSlide[];

        setResizedFormats(prev => ({ ...prev, [targetFormat]: resized }));
        setActiveFormatTab(targetFormat);
        toast({ title: `${FORMAT_LABELS[targetFormat]?.label || targetFormat} format generated!`, description: `${result.slides.length} slide(s) resized.` });
        const existingConfig = (project?.config as any) || {};
        const existingFormats = (existingConfig.resized_formats as string[] | undefined) || [];
        if (!existingFormats.includes(targetFormat)) {
          await supabase
            .from("projects")
            .update({
              config: {
                ...existingConfig,
                resized_formats: [...existingFormats, targetFormat],
              },
            })
            .eq("id", projectId);
        }
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
      const dims = DEVICE_DIMENSIONS[primaryFormat];
      const folderLabel = dims ? `${appLabel}-${primaryFormat}-${dims.width}x${dims.height}` : `${appLabel}-${primaryFormat}`;

      // Original format slides — resized to exact App Store dimensions
      const originalFolder = zip.folder(folderLabel);
      let count = 0;
      if (originalFolder) {
        for (const slide of slides) {
          const url = getImageUrl(slide);
          if (!url) continue;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            let blob = await res.blob();
            // Resize to exact App Store pixel dimensions
            blob = await resizeImageForDevice(blob, primaryFormat);
            originalFolder.file(`slide-${String(slide.slide_number).padStart(2, '0')}.png`, blob);
            count++;
          } catch { /* skip */ }
        }
      }

      // Include resized format slides in separate subfolders
      for (const [fmt, fmtSlides] of Object.entries(resizedFormats)) {
        if (!fmtSlides?.length) continue;
        const fmtDims = DEVICE_DIMENSIONS[fmt];
        const fmtFolderLabel = fmtDims ? `${appLabel}-${fmt}-${fmtDims.width}x${fmtDims.height}` : `${appLabel}-${fmt}`;
        const fmtFolder = zip.folder(fmtFolderLabel);
        if (!fmtFolder) continue;
        for (const slide of fmtSlides) {
          try {
            const res = await fetch(slide.imageUrl);
            if (!res.ok) continue;
            let blob = await res.blob();
            // Resize to exact App Store pixel dimensions
            blob = await resizeImageForDevice(blob, fmt);
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
    if (!window.confirm(t("results.regenAllConfirm", { cost: totalCost }))) return;
    setIsRegenerating(true);
    try {
      if (!projectId) return;
      const existingConfig = (project?.config as any) || {};
      await supabase.from('projects').update({
        status: 'generating',
        config: { ...existingConfig, resized_formats: [] },
      }).eq('id', projectId);
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

  const primaryDims = DEVICE_DIMENSIONS[primaryFormat];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{project.app_name || project.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {t('results.slides', { count: slides.length })}
              </Badge>
              <Badge variant="outline" className="text-xs">{project.platform}</Badge>
              {primaryDims && (
                <Badge variant="outline" className="text-xs font-mono">
                  <Smartphone className="h-3 w-3 mr-1" /> {primaryDims.width}&times;{primaryDims.height}px
                </Badge>
              )}
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

        {/* Device Format Tabs + Gallery */}
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Format tabs bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 overflow-x-auto">
            <Button
              variant={activeFormatTab === null ? 'default' : 'ghost'}
              size="sm"
              className="rounded-lg text-xs shrink-0"
              onClick={() => setActiveFormatTab(null)}
            >
              <Smartphone className="h-3.5 w-3.5 mr-1.5" />
              {FORMAT_LABELS[primaryFormat]?.label || primaryFormat}
              {primaryDims && <span className="ml-1 text-[10px] opacity-70">{primaryDims.width}&times;{primaryDims.height}</span>}
            </Button>
            {additionalFormats.map(fmt => {
              const hasGenerated = !!resizedFormats[fmt]?.length;
              const FormatIcon = FORMAT_LABELS[fmt]?.icon || Smartphone;
              const fmtDims = DEVICE_DIMENSIONS[fmt];
              return (
                <div key={fmt} className="flex gap-1 shrink-0">
                  {hasGenerated ? (
                    <>
                      <Button
                        variant={activeFormatTab === fmt ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => setActiveFormatTab(fmt)}
                      >
                        <FormatIcon className="h-3.5 w-3.5 mr-1.5" />
                        {FORMAT_LABELS[fmt]?.label || fmt}
                        {fmtDims && <span className="ml-1 text-[10px] opacity-70">{fmtDims.width}&times;{fmtDims.height}</span>}
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs h-8 w-8 p-0" onClick={() => handleDownloadFormat(fmt)}>
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
                      {isResizing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <FormatIcon className="h-3.5 w-3.5 mr-1.5" />}
                      {FORMAT_LABELS[fmt]?.label || fmt}
                      <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">{slides?.length || 0} cr</Badge>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slides gallery */}
          <div className="p-4">
            {activeFormatTab === null ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {slides.map((slide, index) => {
                  const imgUrl = getImageUrl(slide);
                  const locked = isFreePlan && index > 0;
                  return (
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => setSelectedIndex(index)}
                      className={`relative ${primaryFormat.includes('ipad') ? 'aspect-[3/4]' : 'aspect-[9/16]'} rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group ${selectedIndex === index ? 'border-primary ring-2 ring-primary/30 shadow-glow' : 'border-border/50 hover:border-primary/40'}`}
                    >
                      {imgUrl && !locked ? (
                        <img src={imgUrl} alt={`Slide ${slide.slide_number}`} className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" loading="lazy" />
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
            ) : resizedFormats[activeFormatTab] ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {resizedFormats[activeFormatTab].map((slide) => (
                  <div
                    key={slide.slide_number}
                    className={`relative rounded-xl border-2 border-border/50 overflow-hidden ${activeFormatTab.includes('ipad') ? 'aspect-[3/4]' : 'aspect-[9/16]'}`}
                  >
                    <img src={slide.imageUrl} alt={`Slide ${slide.slide_number} - ${activeFormatTab}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                      <span className="text-[10px] font-black text-foreground">{slide.slide_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Selected slide detail */}
        {selectedSlide && activeFormatTab === null && (
          <motion.div
            key={selectedSlide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image preview */}
              <div className="flex-shrink-0 w-full md:w-64">
                <div className={`w-full ${primaryFormat.includes('ipad') ? 'aspect-[3/4]' : 'aspect-[9/16]'} rounded-xl overflow-hidden border border-border bg-muted`}>
                  {selectedImageUrl && !isSlideLocked ? (
                    <img src={selectedImageUrl} alt={`Slide ${selectedSlide.slide_number}`} className="w-full h-full object-cover" />
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
                  {selectedSlide.objective && <Badge variant="outline" className="text-xs">{selectedSlide.objective}</Badge>}
                  {selectedSlide.emphasis && <Badge variant="outline" className="text-xs">{selectedSlide.emphasis}</Badge>}
                  {primaryDims && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {primaryDims.width}&times;{primaryDims.height}px
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                {!isSlideLocked && (
                  <div className="space-y-3 pt-2">
                    {selectedImageUrl && (
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={async () => {
                        try {
                          const res = await fetch(selectedImageUrl);
                          let blob = await res.blob();
                          blob = await resizeImageForDevice(blob, primaryFormat);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          const dims = DEVICE_DIMENSIONS[primaryFormat];
                          const dimSuffix = dims ? `-${dims.width}x${dims.height}` : '';
                          a.download = `${project.app_name || project.name}-slide-${selectedSlide.slide_number}${dimSuffix}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch { toast({ title: t('results.downloadFailed'), variant: "destructive" }); }
                      }}>
                        <ImageDown className="mr-1.5 h-3.5 w-3.5" /> {t('results.saveSlide')}
                        {primaryDims && <span className="ml-1 text-[10px] opacity-60">{primaryDims.width}&times;{primaryDims.height}</span>}
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

        {/* Saved Translations Section */}
        {translationLanguages.length > 0 && (
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" /> {t("results.translations")}
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
                              const fmtDims = DEVICE_DIMENSIONS[fmt];

                              return (
                                <div key={fmt}>
                                  {langFormats.length > 1 && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-[10px] font-bold">{FORMAT_SHORT[fmt] || fmt}</Badge>
                                      {fmtDims && <span className="text-[10px] text-muted-foreground font-mono">{fmtDims.width}&times;{fmtDims.height}</span>}
                                      <span className="text-[10px] text-muted-foreground">{fmtTranslations.length} slide(s)</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                    {fmtTranslations.map(tr => (
                                      <div key={tr.id} className={`relative group rounded-lg overflow-hidden border border-border/50 ${isIpad ? 'aspect-[3/4]' : 'aspect-[9/16]'}`}>
                                        {tr.signedUrl ? (
                                          <img src={tr.signedUrl} alt={`Slide ${tr.slide_number} - ${lang} - ${fmt}`} className="w-full h-full object-cover" loading="lazy" />
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
        )}
      </div>

      <TranslationsModal
        isOpen={isTranslationModalOpen}
        onOpenChange={setIsTranslationModalOpen}
        projectId={projectId || ''}
        deviceFormats={projectFormats}
        generatedFormats={Object.keys(resizedFormats).filter(f => resizedFormats[f]?.length > 0)}
        onSuccess={() => {
          void refetchSlides();
          void refreshProfile();
          void refreshSignedAssets();
        }}
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
