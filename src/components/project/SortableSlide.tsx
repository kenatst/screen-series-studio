import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { slideObjectives, emphasisOptions } from "@/lib/demo-data";
import type { SlideItem } from "@/lib/demo-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface UploadedScreen {
    id: string;
    file: File;
    preview: string;
    tag: string;
}

interface SortableSlideProps {
    slide: SlideItem;
    updateSlide: (id: string, field: keyof SlideItem, value: string) => void;
    removeSlide: (id: string) => void;
    getScreenOptions: () => string[];
    uploadedScreens: UploadedScreen[];
}

export const SortableSlide = ({
    slide,
    updateSlide,
    removeSlide,
    getScreenOptions,
    uploadedScreens
}: SortableSlideProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="rounded-2xl border border-border bg-card/90 p-5 shadow-elevated hover:border-primary/40 hover:shadow-glow transition-all duration-300 group">
            <div className="flex items-start gap-4">
                <div {...attributes} {...listeners} className="h-5 w-5 mt-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-foreground/30 opacity-40 group-hover:opacity-100 transition-opacity hover:text-foreground" />
                </div>
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
                    {/* Full-width headline & subheadline with tooltips */}
                    <div className="space-y-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Input
                                    value={slide.headline}
                                    onChange={e => updateSlide(slide.id, 'headline', e.target.value)}
                                    placeholder="Headline — your big hook for this slide"
                                    className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-bold shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl w-full"
                                />
                            </TooltipTrigger>
                            {slide.headline.length > 30 && (
                                <TooltipContent side="top" className="max-w-sm">
                                    <p className="text-sm">{slide.headline}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Input
                                    value={slide.subheadline}
                                    onChange={e => updateSlide(slide.id, 'subheadline', e.target.value)}
                                    placeholder="Subheadline — supporting text"
                                    className="bg-black/5 border-border text-foreground placeholder:text-foreground/30 text-sm font-medium shadow-inner h-11 focus-visible:ring-primary transition-all rounded-xl w-full"
                                />
                            </TooltipTrigger>
                            {slide.subheadline.length > 30 && (
                                <TooltipContent side="top" className="max-w-sm">
                                    <p className="text-sm">{slide.subheadline}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {/* Screen dropdown with thumbnails */}
                        <div className="relative mt-2">
                            <select
                                className="bg-black/5 border border-border rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
                                value={slide.rawScreenTag}
                                onChange={e => updateSlide(slide.id, 'rawScreenTag', e.target.value)}
                            >
                                <option value="">No screen (Text only)</option>
                                {getScreenOptions().map(t => {
                                    const matchingScreen = uploadedScreens.find((s: UploadedScreen) => s.tag === t);
                                    return (
                                        <option key={t} value={t}>
                                            {matchingScreen ? `📱 ${t} (uploaded)` : t}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {/* Show thumbnail of selected screen if exists */}
                        {uploadedScreens.find((s: UploadedScreen) => s.tag === slide.rawScreenTag) && (
                            <div className="mt-2 h-10 w-6 rounded border border-primary/30 overflow-hidden flex-shrink-0">
                                <img
                                    src={uploadedScreens.find((s: UploadedScreen) => s.tag === slide.rawScreenTag)!.preview}
                                    alt={slide.rawScreenTag}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <select className="bg-black/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-muted-foreground outline-none mt-2 focus:ring-1 focus:ring-primary transition-all" value={slide.emphasis} onChange={e => updateSlide(slide.id, 'emphasis', e.target.value)}>
                            {emphasisOptions.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => removeSlide(slide.id)} className="h-9 text-xs font-bold mt-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
