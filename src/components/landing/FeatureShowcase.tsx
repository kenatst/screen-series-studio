import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Image as ImageIcon, RefreshCw, Globe, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

import locEn from '@/assets/features/localization-en.webp';
import locJp from '@/assets/features/localization-jp.jpeg';
import weatherSlide1 from '@/assets/features/weather-slide1.png';
import weatherSlide2 from '@/assets/features/weather-slide2.png';
import travelSlide1 from '@/assets/features/travel-slide1.png';
import travelSlide2 from '@/assets/features/travel-slide2.png';
import travelSlide3 from '@/assets/features/travel-slide3.png';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const features = [
    {
        id: 'planner',
        icon: LayoutGrid,
        title: 'The Screenshot Planner',
        description: 'Stop guessing what goes on slide 4. Define the narrative flow, headlines, and emphasis for up to 10 slides before generating anything.',
        visual: (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10 flex flex-col gap-4 p-5 w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-foreground font-bold text-lg">Screenshot set planner</h4>
                            <p className="text-muted-foreground text-xs">Define each slide's content and objective.</p>
                        </div>
                    </div>
                    {/* Slide count chips */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">SLIDES:</span>
                        {[3, 5, 7, 10].map((n, i) => (
                            <div key={n} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-card/50 text-muted-foreground border border-border'}`}>
                                {n}
                            </div>
                        ))}
                    </div>
                    {/* Slide cards */}
                    {[
                        { num: 1, obj: 'Hero / first impression', headline: 'Your big promise here', sub: 'Supporting value proposition', tags: ['home', 'text focused'], importance: 'high' },
                        { num: 2, obj: 'Core benefit', headline: 'The #1 reason to download', sub: 'What makes you unique', tags: ['dashboard', 'UI focused'], importance: 'high' },
                    ].map((slide) => (
                        <div key={slide.num} className="bg-card/30 border border-border rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{slide.num}</div>
                                <div className="flex-1 h-9 bg-card/60 border border-border rounded-lg flex items-center px-3">
                                    <span className="text-sm text-muted-foreground">{slide.obj}</span>
                                </div>
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{slide.importance}</Badge>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-9 bg-card/40 border border-border rounded-lg flex items-center px-3">
                                    <span className="text-xs text-muted-foreground">{slide.headline}</span>
                                </div>
                                <div className="flex-1 h-9 bg-card/40 border border-border rounded-lg flex items-center px-3">
                                    <span className="text-xs text-muted-foreground">{slide.sub}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {slide.tags.map(t => (
                                    <div key={t} className="h-7 px-3 bg-card/40 border border-border rounded-lg flex items-center">
                                        <span className="text-xs text-muted-foreground">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'references',
        icon: ImageIcon,
        title: 'Reference-Based Generation',
        description: 'Upload moodboards or competitor screenshots. ScreenForge extracts the layout, mood, and hierarchy without copying their literal branding.',
        visual: (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-3 w-full">
                    {/* INPUT label */}
                    <div className="flex items-center gap-2 self-start">
                        <Badge className="bg-card/80 text-muted-foreground border-border text-[10px] uppercase tracking-wider">Input</Badge>
                    </div>
                    {/* Input slides */}
                    <div className="flex gap-2 w-full justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-20 sm:w-24 aspect-[9/19.5] rounded-lg border border-border overflow-hidden shadow-lg">
                                <img src={weatherSlide1} alt="Weather slide 1" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] text-muted-foreground">Meet Cloudy</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-20 sm:w-24 aspect-[9/19.5] rounded-lg border border-border overflow-hidden shadow-lg">
                                <img src={weatherSlide2} alt="Weather slide 2" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] text-muted-foreground">Daily Briefing</span>
                        </div>
                    </div>

                    {/* AI Arrow */}
                    <div className="flex items-center gap-2 py-1">
                        <div className="h-px w-8 bg-primary/40" />
                        <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold text-primary">AI</span>
                        </div>
                        <div className="h-px w-8 bg-primary/40" />
                    </div>

                    {/* OUTPUT label */}
                    <div className="flex items-center gap-2 self-start">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase tracking-wider">Output</Badge>
                    </div>
                    {/* Output slides */}
                    <div className="flex gap-2 w-full justify-center">
                        {[
                            { src: travelSlide1, label: 'Meet Tripora' },
                            { src: travelSlide2, label: 'Your Trip' },
                            { src: travelSlide3, label: 'Travel Beautifully' },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className="w-20 sm:w-24 aspect-[9/19.5] rounded-lg border-2 border-primary overflow-hidden shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]">
                                    <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[9px] text-primary font-medium">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'editing',
        icon: RefreshCw,
        title: 'Surgical Slide Editing',
        description: 'Found a typo or want a different layout for slide 3? Regenerate heavily isolated parts without losing the visual connection to slides 1, 2, 4, and 5.',
        visual: (
            <div className="w-full h-full p-6 flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative">
                <div className="flex gap-2 w-full max-w-[280px]">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex-1 aspect-[9/19.5] rounded-lg border ${i === 2 ? 'border-primary ring-2 ring-primary/20 bg-primary/10' : 'border-border bg-black/5'} flex items-center justify-center relative overflow-hidden`}>
                            {i === 2 && (
                                <motion.div
                                    className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,hsl(var(--primary)/0.3)_100%)] animate-spin"
                                    style={{ animationDuration: '3s' }}
                                />
                            )}
                            <div className="h-4 w-4 rounded-full bg-white/20 relative z-10" />
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'localization',
        icon: Globe,
        title: 'Instant Localization',
        description: 'Duplicate a complete 10-slide set and swap the language. The design adapts intelligently to longer typography without breaking the layout.',
        visual: (
            <div className="w-full h-full p-4 flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="relative z-10 flex items-center gap-3 sm:gap-6 h-full justify-center py-4">
                    {/* EN */}
                    <div className="flex flex-col items-center gap-3 h-full justify-center">
                        <div className="relative h-[85%] w-auto aspect-[9/19.5] rounded-xl overflow-hidden border border-border shadow-2xl shrink-0">
                            <img src={locEn} alt="English Version" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">English</span>
                    </div>

                    <div className="text-primary font-bold bg-black/50 p-2 sm:p-3 rounded-full backdrop-blur-md z-20 shadow-xl border border-white/10 shrink-0 mb-8">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* JP */}
                    <div className="flex flex-col items-center gap-3 h-full justify-center">
                        <div className="relative h-[85%] w-auto aspect-[9/19.5] rounded-xl overflow-hidden border-2 border-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] shrink-0">
                            <img src={locJp} alt="Japanese Version" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-bold text-primary">Japanese</span>
                    </div>
                </div>
            </div>
        )
    }
];

export const FeatureShowcase = () => {
    return (
        <section id="product" className="py-24 bg-background relative border-t border-border">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                        Precision tools for <span className="text-primary">perfect outputs</span>.
                    </h2>
                </div>

                <div className="space-y-24 md:space-y-32">
                    {features.map((feature, index) => {
                        const isEven = index % 2 === 0;
                        return (
                            <motion.div
                                key={feature.id}
                                className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${isEven ? '' : 'md:flex-row-reverse'}`}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                variants={fadeUp}
                            >
                                {/* Text Block */}
                                <div className="flex-1 max-w-xl">
                                    <div className="h-12 w-12 rounded-xl bg-black/5 border border-border flex items-center justify-center mb-6">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-4">{feature.title}</h3>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Visual Block */}
                                <div className="flex-1 w-full aspect-[4/3] md:aspect-[3/2] perspective-[1000px]">
                                    <motion.div
                                        className="w-full h-full"
                                        whileHover={{ scale: 1.02, rotateY: isEven ? -5 : 5 }}
                                        transition={{ type: "spring", bounce: 0.4 }}
                                    >
                                        {feature.visual}
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
