import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';

export const ConsistencyEngine = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const cards = [
        { angle: -40, x: -250, y: -40, delay: 0.2 },
        { angle: -20, x: -120, y: 10, delay: 0.4 },
        { angle: 0, x: 0, y: 30, delay: 0.6 },
        { angle: 20, x: 120, y: 10, delay: 0.8 },
        { angle: 40, x: 250, y: -40, delay: 1.0 },
    ];

    return (
        <section className="py-24 bg-surface-elevated relative overflow-hidden">
            <div className="container mx-auto px-6" ref={ref}>
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold uppercase tracking-wider">
                        The Differentiator
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                        The Consistency Engine
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                        ScreenForge doesn't generate isolated images. It orchestrates a cohesive visual system.
                        One shared creative direction propagates globally across your entire screenshot set.
                    </p>
                </div>

                <div className="relative h-[500px] md:h-[600px] w-full max-w-5xl mx-auto flex items-center justify-center mt-12 perspective-[1000px]">

                    {/* Central Rule Node */}
                    <motion.div
                        className="absolute z-20 w-48 bg-zinc-900/90 backdrop-blur-md border border-border rounded-2xl p-5 shadow-glow left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : {}}
                        transition={{ duration: 0.6, type: "spring" }}
                    >
                        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                            <SlidersHorizontal className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-foreground font-bold tracking-tight mb-2">Règles Globales</span>
                        <div className="flex gap-2 mb-3">
                            <div className="h-4 w-4 rounded-full bg-primary" />
                            <div className="h-4 w-4 rounded-full bg-orange-500" />
                            <div className="h-4 w-4 rounded-full bg-accent" />
                        </div>
                    </motion.div>

                    {/* Surrounding Cards and Connecting Lines */}
                    {cards.map((card, i) => {
                        // Calculate line endpoints from center to card position
                        // The center of the container is (0,0) based on flex positioning.
                        // Cards are absolutely positioned relative to center.
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                        const cardX = isMobile ? card.x * 0.5 : card.x;
                        const cardY = isMobile ? card.y * 0.8 - 150 + (i * 60) : card.y - 120;

                        return (
                            <div key={`card-group-${i}`} className="absolute top-1/2 left-1/2" style={{ transform: `translate(${cardX}px, ${cardY}px)` }}>

                                {/* Connecting SVG Line */}
                                {!isMobile && (
                                    <svg className="absolute top-0 left-0 w-[400px] h-[400px] pointer-events-none -z-10 overflow-visible" style={{ transform: `translate(${-card.x}px, ${-card.y + 120}px)` }}>
                                        <motion.path
                                            d={`M 0 0 Q ${card.x * 0.5} ${card.y * 0.5} ${card.x} ${card.y - 120}`}
                                            fill="transparent"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={isInView ? { pathLength: 1, opacity: 0.4 } : {}}
                                            transition={{ delay: card.delay, duration: 0.8 }}
                                        />
                                        {/* Animated particle moving along the line */}
                                        <motion.circle
                                            r="3"
                                            fill="hsl(var(--primary))"
                                            initial={{ offsetDistance: "0%", opacity: 0 }}
                                            animate={isInView ? { offsetDistance: "100%", opacity: [0, 1, 0] } : {}}
                                            transition={{ delay: card.delay + 0.2, duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                offsetPath: `path('M 0 0 Q ${card.x * 0.5} ${card.y * 0.5} ${card.x} ${card.y - 120}')`
                                            } as any}
                                        />
                                    </svg>
                                )}

                                {/* The Card */}
                                <motion.div
                                    className="relative w-[120px] md:w-[160px] aspect-[9/19.5] bg-zinc-800 rounded-2xl border border-border shadow-elevated overflow-hidden origin-bottom"
                                    initial={{ rotateZ: 0, opacity: 0, scale: 0.8 }}
                                    animate={isInView ? {
                                        rotateZ: isMobile ? 0 : card.angle,
                                        opacity: 1,
                                        scale: 1
                                    } : {}}
                                    transition={{ delay: card.delay + 0.3, duration: 0.7, type: "spring", bounce: 0.4 }}
                                >
                                    {/* Card UI elements that "receive" the rules */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 p-3 md:p-4 flex flex-col justify-end">
                                        <motion.div
                                            className="h-6 w-full rounded bg-white/10 mb-2"
                                            animate={isInView ? { backgroundColor: "rgba(255,255,255,0.9)" } : {}}
                                            transition={{ delay: card.delay + 0.8, duration: 0.5 }}
                                        />
                                        <motion.div
                                            className="h-3 w-3/4 rounded bg-black/5 mb-4"
                                            animate={isInView ? { backgroundColor: "rgba(255,255,255,0.6)" } : {}}
                                            transition={{ delay: card.delay + 0.9, duration: 0.5 }}
                                        />
                                        <div className="w-full flex-1 rounded bg-card/90 border border-border flex items-center justify-center relative overflow-hidden">
                                            <motion.div
                                                className="absolute inset-0 bg-black/5"
                                                animate={isInView ? { backgroundColor: "hsl(var(--primary) / 0.2)" } : {}}
                                                transition={{ delay: card.delay + 1, duration: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Flash effect when rule applies */}
                                    <motion.div
                                        className="absolute inset-0 bg-primary z-10"
                                        initial={{ opacity: 0 }}
                                        animate={isInView ? { opacity: [0, 0.5, 0] } : {}}
                                        transition={{ delay: card.delay + 0.8, duration: 0.6 }}
                                    />
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                    {[
                        'Shared color logic',
                        'Synchronized typography',
                        'Global layout rhythms',
                        'Slide-to-slide coherence',
                        'Single creative direction'
                    ].map((feature, i) => (
                        <motion.div
                            key={feature}
                            className="flex items-center gap-2 bg-black/5 border border-border rounded-full px-5 py-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 1.5 + (i * 0.1), duration: 0.4 }}
                        >
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">{feature}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
