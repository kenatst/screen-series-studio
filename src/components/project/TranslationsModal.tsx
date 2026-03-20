import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { DEVICE_FORMAT_LABELS, LANGUAGE_OPTIONS } from '@/lib/localization';

interface TranslationsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    deviceFormats?: string[];
    generatedFormats?: string[];
    onSuccess?: () => void;
}

interface TranslatedSlide {
    slide_number: number;
    imageUrl: string;
}

interface TranslateCopyResponse {
    translations?: TranslatedSlide[];
}

export const TranslationsModal = ({ isOpen, onOpenChange, projectId, deviceFormats = ['iphone-6-5'], generatedFormats = [], onSuccess }: TranslationsModalProps) => {
    const { t } = useTranslation();
    const [language, setLanguage] = useState('');
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedSlides, setTranslatedSlides] = useState<TranslatedSlide[]>([]);
    const [error, setError] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const { toast } = useToast();

    // Available formats = primary format + any resized formats
    const primaryFormat = deviceFormats[0] || 'iphone-6-5';
    const availableFormats = [primaryFormat, ...generatedFormats.filter(f => f !== primaryFormat)];

    const toggleFormat = (fmt: string) => {
        setSelectedFormats(prev =>
            prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
        );
    };

    const handleTranslate = async () => {
        if (!language) return;
        const formatsToTranslate = selectedFormats.length > 0 ? selectedFormats : [primaryFormat];

        setIsTranslating(true);
        setError('');
        setTranslatedSlides([]);
        setProgressPercent(5);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const allTranslated: TranslatedSlide[] = [];
            const totalFormats = formatsToTranslate.length;

            for (let fi = 0; fi < totalFormats; fi++) {
                const fmt = formatsToTranslate[fi];
                const baseProgress = (fi / totalFormats) * 100;
                const formatProgress = (1 / totalFormats) * 100;
                setProgressPercent(Math.round(baseProgress + formatProgress * 0.2));

                const response = await fetch(`${supabaseUrl}/functions/v1/translate-copy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        target_language: language,
                        source_language: 'English',
                        device_format: fmt,
                    }),
                });

                setProgressPercent(Math.round(baseProgress + formatProgress * 0.8));

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Server error' }));
                    throw new Error(errData.error || `Error ${response.status} for ${fmt}`);
                }

                const result = (await response.json()) as TranslateCopyResponse;
                if (result.translations?.length > 0) {
                    allTranslated.push(...result.translations.map((t) => ({
                        ...t,
                        format: fmt,
                    })));
                }
            }

            setProgressPercent(100);

            if (allTranslated.length > 0) {
                setTranslatedSlides(allTranslated);
                const langLabel = LANGUAGE_OPTIONS.find(l => l.value === language)?.label || language;
                toast({
                    title: t('localization.toastSuccessTitle', { language: langLabel }),
                    description: t('localization.toastSuccessDesc', { slides: allTranslated.length, formats: totalFormats }),
                });
                onSuccess?.();
            } else {
                setError(t('localization.noSlidesTranslated'));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('localization.unknownError');
            setError(message || t('localization.failed'));
            toast({ title: t('localization.failed'), description: message || t('localization.unknownError'), variant: 'destructive' });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleDownloadAll = async () => {
        await Promise.all(translatedSlides.map((slide) => handleDownloadTranslated(slide)));
    };

    const handleDownloadTranslated = async (slide: TranslatedSlide) => {
        try {
            const res = await fetch(slide.imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const langSlug = language.toLowerCase().replace(/[^a-z]/g, '');
            a.download = `slide-${slide.slide_number}-${langSlug}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast({ title: t('results.downloadFailed'), variant: 'destructive' });
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setTranslatedSlides([]);
            setError('');
            setLanguage('');
            setSelectedFormats([]);
            setProgressPercent(0);
            setIsTranslating(false);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border/50 text-foreground shadow-strong max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Globe className="h-5 w-5 text-primary" />
                        {t('localization.title')}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {t('localization.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {translatedSlides.length === 0 ? (
                    <>
                        <div className="py-4 space-y-4">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-full bg-secondary border-border/60">
                                    <SelectValue placeholder={t('localization.selectLanguage')} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50">
                                    {LANGUAGE_OPTIONS.map(lang => (
                                        <SelectItem key={lang.value} value={lang.value} className="focus:bg-primary/20 focus:text-primary cursor-pointer">
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {availableFormats.length > 1 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('localization.deviceSizes')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableFormats.map(fmt => {
                                            const isSelected = selectedFormats.includes(fmt) || (selectedFormats.length === 0 && fmt === primaryFormat);
                                            return (
                                                <button
                                                    key={fmt}
                                                    onClick={() => toggleFormat(fmt)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                        isSelected
                                                            ? 'bg-primary/20 text-primary border-primary'
                                                            : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'
                                                    }`}
                                                >
                                                    {DEVICE_FORMAT_LABELS[fmt] || fmt}
                                                    {fmt === primaryFormat && ` (${t('localization.original')})`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {t('localization.formatsSelectedCost', { count: selectedFormats.length || 1 })}
                                    </p>
                                </div>
                            )}

                            {isTranslating && (
                                <div className="space-y-2">
                                    <Progress value={progressPercent} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-center">
                                        {t('localization.translatingTo', { language: LANGUAGE_OPTIONS.find(l => l.value === language)?.label || language })}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                    <p className="text-destructive text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleClose(false)} className="border-border/60">{t('common.cancel')}</Button>
                            <Button onClick={handleTranslate} disabled={!language || isTranslating} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                                {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                                {isTranslating
                                    ? t('localization.translatingBatch')
                                    : t('localization.translateAll', { sizes: selectedFormats.length > 1 ? ` (${selectedFormats.length})` : '' })}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-primary font-bold">
                                <CheckCircle2 className="h-4 w-4" />
                                {t('localization.resultSummary', { count: translatedSlides.length, language: LANGUAGE_OPTIONS.find(l => l.value === language)?.label || language })}
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadAll} className="text-xs rounded-lg">
                                <Download className="h-3 w-3 mr-1" /> {t('localization.downloadAll')}
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {translatedSlides.map(slide => (
                                <div key={slide.slide_number} className="relative group rounded-lg overflow-hidden border border-border aspect-[9/16]">
                                    <img src={slide.imageUrl} alt={`Translated slide ${slide.slide_number}`} className="w-full h-full object-contain" />
                                    <button
                                        onClick={() => handleDownloadTranslated(slide)}
                                        className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Download className="h-5 w-5 text-foreground" />
                                    </button>
                                    <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1 py-0.5 text-[10px] font-bold">{slide.slide_number}</div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleClose(false)}>{t('localization.done')}</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
