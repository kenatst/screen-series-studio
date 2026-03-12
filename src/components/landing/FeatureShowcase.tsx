import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Image as ImageIcon, RefreshCw, Globe, ArrowRight, Cpu } from 'lucide-react';

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

/* ─── Planner Visual ─── */
const PlannerVisual = () => (
    <div className="w-full h-full flex items-start justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-3 p-4 sm:p-5 w-full overflow-y-auto max-h-full">
            <div>
                <h4 className="text-foreground font-bold text-sm sm:text-base">Screenshot Planner</h4>
                <p className="text-muted-foreground text-[10px] sm:text-xs">Define the content and goal of each slide.</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground">SLIDES:</span>
                {[3, 5, 7, 10].map((n, i) => (
                    <div key={n} className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-card/50 text-muted-foreground border border-border'}`}>
                        {n}
                    </div>
                ))}
            </div>
            {[
                { num: 1, obj: 'Hero / first impression', headline: 'Your big promise here', sub: 'Value proposition', tags: ['home', 'text focus'], importance: 'high' },
                { num: 2, obj: 'Main benefit', headline: 'The #1 reason to download', sub: 'What makes you unique', tags: ['dashboard', 'UI focus'], importance: 'high' },
            ].map((slide) => (
                <div key={slide.num} className="bg-card/30 border border-border rounded-xl p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">{slide.num}</div>
                        <div className="flex-1 min-w-0 h-7 sm:h-8 bg-card/60 border border-border rounded-lg flex items-center px-2">
                            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{slide.obj}</span>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] sm:text-[10px] px-1.5 flex-shrink-0">{slide.importance}</Badge>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="flex-1 min-w-0 h-7 bg-card/40 border border-border rounded-lg flex items-center px-2">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{slide.headline}</span>
                        </div>
                        <div className="flex-1 min-w-0 h-7 bg-card/40 border border-border rounded-lg flex items-center px-2">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{slide.sub}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {slide.tags.map(t => (
                            <div key={t} className="h-6 px-2 bg-card/40 border border-border rounded-lg flex items-center">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* ─── Reference-Based Generation Visual ─── */
const ReferenceVisual = () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />

        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-4 w-full px-3 sm:px-5 py-4">
            {/* INPUT — 2 weather slides */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
                {[
                    { src: weatherSlide1, label: 'Meet Cloudy' },
                    { src: weatherSlide2, label: 'Daily Briefing' },
                ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-16 sm:w-22 md:w-28 aspect-[9/19.5] rounded-xl border border-border/60 overflow-hidden shadow-lg bg-black">
                            <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Arrow → AI Chip → Arrow */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="h-px w-3 sm:w-6 lg:w-10 bg-gradient-to-r from-transparent to-primary/60" />
                <div className="relative">
                    <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-xl" />
                    <div className="relative h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]">
                        <Cpu className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                    </div>
                </div>
                <div className="h-px w-3 sm:w-6 lg:w-10 bg-gradient-to-r from-primary/60 to-transparent" />
            </div>

            {/* OUTPUT — 3 travel slides */}
            <div className="flex shrink-0 relative">
                {[
                    { src: travelSlide1, label: 'Meet Tripora', z: 10, rotate: -3, offset: 0 },
                    { src: travelSlide2, label: 'Your Trip', z: 20, rotate: 0, offset: -10 },
                    { src: travelSlide3, label: 'Travel Beautifully', z: 30, rotate: 3, offset: -20 },
                ].map((s, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center gap-1.5"
                        style={{ zIndex: s.z, marginLeft: i > 0 ? `${s.offset}px` : 0, transform: `rotate(${s.rotate}deg)` }}
                    >
                        <div className="w-16 sm:w-22 md:w-28 aspect-[9/19.5] rounded-xl border-2 border-primary/60 overflow-hidden shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)] bg-black">
                            <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-primary font-medium">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* ─── Surgical Editing Visual — 3 NutriTrack screenshots ─── */
const EditingVisual = () => {
    const slides = [
        { src: '/screenshots/nt-1-calories.png', label: 'Slide 1', active: false },
        { src: '/screenshots/nt-2-meals.png', label: 'Slide 2', active: true },
        { src: '/screenshots/nt-3-nutrition.png', label: 'Slide 3', active: false },
    ];

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden p-4 sm:p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="relative z-10 flex gap-3 sm:gap-4 items-end justify-center w-full">
                {slides.map((slide, i) => (
                    <motion.div
                        key={i}
                        className="flex flex-col items-center gap-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.5 }}
                    >
                        <div className={`relative w-20 sm:w-28 md:w-32 aspect-[9/19.5] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${slide.active
                            ? 'border-2 border-primary ring-4 ring-primary/20 scale-105 shadow-[0_0_40px_-8px_rgba(245,166,35,0.5)]'
                            : 'border border-white/10 opacity-70 scale-95'
                            }`}>
                            <img
                                src={slide.src}
                                alt={slide.label}
                                className="w-full h-full object-cover"
                            />
                            {slide.active && (
                                <motion.div
                                    className="absolute inset-0 bg-primary/10 mix-blend-overlay pointer-events-none"
                                    animate={{ opacity: [0, 0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </div>
                        <span className={`text-xs font-medium ${slide.active ? 'text-primary' : 'text-muted-foreground'}`}>
                            {slide.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/* ─── Localization Visual ─── */
const LocalizationVisual = () => (
    <div className="w-full h-full p-4 flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative z-10 flex items-center gap-3 sm:gap-6 h-full justify-center py-4">
            <div className="flex flex-col items-center gap-3 h-full justify-center">
                <div className="relative h-[85%] w-auto aspect-[9/19.5] rounded-xl overflow-hidden border border-border shadow-2xl shrink-0">
                    <img src={locEn} alt="English Version" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">English</span>
            </div>
            <div className="text-primary font-bold bg-black/50 p-2 sm:p-3 rounded-full backdrop-blur-md z-20 shadow-xl border border-white/10 shrink-0 mb-8">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col items-center gap-3 h-full justify-center">
                <div className="relative h-[85%] w-auto aspect-[9/19.5] rounded-xl overflow-hidden border-2 border-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] shrink-0">
                    <img src={locJp} alt="Japanese Version" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-primary">Japanese</span>
            </div>
        </div>
    </div>
);

const features = [
    {
        id: 'planner',
        icon: LayoutGrid,
        title: 'The Screenshot Planner',
        description: 'Stop guessing what goes on slide 4. Define the narrative flow, headlines, and emphasis for up to 10 slides before generating anything.',
        visual: <PlannerVisual />,
    },
    {
        id: 'references',
        icon: ImageIcon,
        title: 'Reference-Based Generation',
        description: "Import moodboards or competitor screenshots. ShotApp AI extracts the layout, mood, and hierarchy without copying their visual identity.",
        visual: <ReferenceVisual />,
    },
    {
        id: 'editing',
        icon: RefreshCw,
        title: 'Surgical Editing',
        description: "Found a typo or need a different layout for slide 3? Regenerate isolated parts without losing visual consistency with slides 1, 2, 4, and 5.",
        visual: <EditingVisual />,
    },
    {
        id: 'localization',
        icon: Globe,
        title: 'Instant Localization',
        description: 'Duplicate a complete 10-slide set and swap the language. The design adapts intelligently to longer typography without breaking the layout.',
        visual: <LocalizationVisual />,
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
                                <div className="flex-1 w-full min-h-[400px] lg:min-h-[500px] perspective-[1000px]">
                                    <motion.div
                                        className="w-full h-full flex items-center justify-center p-4 sm:p-0"
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
