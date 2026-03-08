import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Image as ImageIcon, RefreshCw, Globe, CheckCircle2, ArrowRight } from 'lucide-react';

import locEn from '@/assets/features/localization-en.webp';
import locJp from '@/assets/features/localization-jp.jpeg';

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
            <div className="w-full h-full p-6 flex flex-col gap-4 bg-zinc-900 border border-border rounded-2xl shadow-elevated">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-foreground font-semibold">Slide 1 of 5</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30">Feature Splash</Badge>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="h-3 w-20 bg-white/20 rounded" />
                        <div className="h-10 w-full bg-card/90 border border-border rounded-lg flex items-center px-4">
                            <span className="text-muted-foreground font-medium">Track your daily progress</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center p-3 bg-black/5 rounded-xl border border-border">
                        <div className="h-12 w-8 bg-zinc-800 rounded flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 bg-white/30 rounded" />
                            <div className="h-2 w-1/4 bg-white/10 rounded" />
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
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
            <div className="w-full h-full p-6 flex items-center justify-center bg-zinc-900 border border-border rounded-2xl shadow-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                <div className="relative z-10 flex gap-4">
                    {/* Reference Image */}
                    <div className="w-32 aspect-[9/19.5] rounded-xl border-2 border-dashed border-border bg-black/5 flex flex-col items-center justify-center p-2 opacity-60">
                        <ImageIcon className="h-8 w-8 text-foreground/30 mb-2" />
                        <span className="text-[10px] text-muted-foreground text-center">Inspiration.jpg</span>
                    </div>

                    {/* Output Image matching layout but using brand colors */}
                    <div className="w-32 aspect-[9/19.5] rounded-xl border border-primary bg-zinc-800 flex flex-col items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
                        <div className="w-full h-full p-2 flex flex-col gap-2">
                            <div className="w-full h-4 bg-primary/20 rounded" />
                            <div className="w-3/4 h-3 bg-primary/20 rounded" />
                            <div className="flex-1 rounded bg-gradient-to-b from-primary/30 to-black/50 mt-2 border border-border" />
                        </div>
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
                <div className="relative z-10 flex items-center gap-3 sm:gap-6 h-[90%] justify-center">
                    {/* EN */}
                    <div className="relative h-full w-auto aspect-[9/19.5] rounded-xl overflow-hidden border border-border shadow-2xl shrink-0">
                        <img src={locEn} alt="English Version" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 scale-75 sm:scale-100 origin-top-left">
                             <Badge className="bg-black/60 text-white backdrop-blur-md border-white/10">English</Badge>
                        </div>
                    </div>

                    <div className="text-primary font-bold bg-black/50 p-2 sm:p-3 rounded-full backdrop-blur-md z-20 shadow-xl border border-white/10 shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* JP */}
                    <div className="relative h-full w-auto aspect-[9/19.5] rounded-xl overflow-hidden border-2 border-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] shrink-0">
                        <img src={locJp} alt="Japanese Version" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 scale-75 sm:scale-100 origin-top-left">
                             <Badge className="bg-primary text-primary-foreground backdrop-blur-md border-primary-foreground/20">Japanese</Badge>
                        </div>
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
