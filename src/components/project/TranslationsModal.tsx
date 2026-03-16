import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, CheckCircle2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslationsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onSuccess?: () => void;
}

const LANGUAGES = [
    { value: 'fr', label: 'French (Français)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'de', label: 'German (Deutsch)' },
    { value: 'ja', label: 'Japanese (日本語)' },
    { value: 'pt', label: 'Portuguese (Português)' },
    { value: 'zh', label: 'Chinese (Simplified)' },
    { value: 'ko', label: 'Korean (한국어)' },
    { value: 'it', label: 'Italian (Italiano)' },
    { value: 'ar', label: 'Arabic (العربية)' },
    { value: 'ru', label: 'Russian (Русский)' },
];

interface TranslatedSlide {
    slide_number: number;
    imageUrl: string;
}

export const TranslationsModal = ({ isOpen, onOpenChange, projectId, onSuccess }: TranslationsModalProps) => {
    const [language, setLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedSlides, setTranslatedSlides] = useState<TranslatedSlide[]>([]);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleTranslate = async () => {
        if (!language) return;
        setIsTranslating(true);
        setError('');
        setTranslatedSlides([]);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/translate-copy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({ project_id: projectId, target_language: language }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errData.error || `Error ${response.status}`);
            }

            const result = await response.json();

            if (result.translations?.length > 0) {
                setTranslatedSlides(result.translations);
                const langLabel = LANGUAGES.find(l => l.value === language)?.label || language;
                toast({ title: `Translation to ${langLabel} completed!`, description: `${result.translations.length} slide(s) translated.` });
                onSuccess?.();
            } else {
                setError('No slides were translated. Make sure you have completed slides with images.');
            }
        } catch (err: any) {
            console.error('Translation error:', err);
            setError(err.message || 'Translation failed');
            toast({ title: 'Translation failed', description: err.message || 'Unknown error', variant: 'destructive' });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleDownloadTranslated = async (slide: TranslatedSlide) => {
        try {
            const res = await fetch(slide.imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slide-${slide.slide_number}-${language}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast({ title: 'Download failed', variant: 'destructive' });
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setTranslatedSlides([]);
            setError('');
            setLanguage('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border/50 text-foreground shadow-strong max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Globe className="h-5 w-5 text-primary" />
                        1-Click Localization
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        Select a target language. Translation costs 1 credit per slide.
                    </DialogDescription>
                </DialogHeader>

                {translatedSlides.length === 0 ? (
                    <>
                        <div className="py-4">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-full bg-secondary border-border/60">
                                    <SelectValue placeholder="Select target language" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50">
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang.value} value={lang.value} className="focus:bg-primary/20 focus:text-primary cursor-pointer">
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleClose(false)} className="border-border/60">Cancel</Button>
                            <Button onClick={handleTranslate} disabled={!language || isTranslating} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                                {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isTranslating ? 'Translating...' : 'Translate Instantly'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-2 text-sm text-primary font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            {translatedSlides.length} slide(s) translated to {LANGUAGES.find(l => l.value === language)?.label}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {translatedSlides.map(slide => (
                                <div key={slide.slide_number} className="relative group rounded-lg overflow-hidden border border-border aspect-[9/19.5]">
                                    <img src={slide.imageUrl} alt={`Translated slide ${slide.slide_number}`} className="w-full h-full object-cover" />
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
                            <Button variant="outline" onClick={() => handleClose(false)}>Done</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
