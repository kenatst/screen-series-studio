import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TranslationsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
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

export const TranslationsModal = ({ isOpen, onOpenChange, projectId }: TranslationsModalProps) => {
    const [language, setLanguage] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!language) return;
        setIsTranslating(true);
        try {
            await api.translateProject(projectId, language);
            toast.success(`Translation to ${LANGUAGES.find(l => l.value === language)?.label} completed successfully!`);
            // Normally we would redirect or reload the translated project
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to translate project');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50 text-foreground shadow-strong">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Globe className="h-5 w-5 text-primary" />
                        1-Click Localization
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        Select a target language. Our engine will instantly translate all slide headlines and subheadlines, adapting layout logic. (Gemini generation coming soon).
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/60 text-foreground hover:bg-secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleTranslate} disabled={!language || isTranslating} className="bg-primary text-black hover:bg-primary/90 shadow-glow">
                        {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isTranslating ? 'Translating...' : 'Translate Instantly'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
