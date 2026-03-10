import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';

const cards = [
    { label: 'Hero', src: '/screenshots/cw-5-security.png' },
    { label: 'Portfolio', src: '/screenshots/cw-2-portfolio.png' },
    { label: 'Send & Receive', src: '/screenshots/cw-4-market.png' },
    { label: 'Market Insights', src: '/screenshots/cw-1-hero.png' },
    { label: 'Security', src: '/screenshots/cw-3-send.png' },
];

export const ConsistencyEngine = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 bg-surface-elevated relative overflow-x-hidden">
            <div className="container mx-auto px-6" ref={ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold uppercase tracking-wider">
                        The Differentiator
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                        The Consistency Engine
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                        ShotApp AI doesn't generate isolated images. It orchestrates a cohesive visual system.
                        One shared creative direction propagates globally across your entire screenshot set.
                    </p>
                </div>

                {/* ── Main Visual ── */}
                <div className="relative w-full max-w-[1100px] mx-auto flex flex-col items-center">

                    {/* ── Règles Globales Node (top) ── */}
                    <motion.div
                        className="relative z-30 bg-zinc-900/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-[0_0_40px_-10px_rgba(245,166,35,0.4)] flex flex-col items-center text-center"
                        initial={{ scale: 0.8, opacity: 0, y: -30 }}
                        animate={isInView ? { scale: 1, opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, type: "spring" }}
                    >
                        <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 border border-primary/40 shadow-inner">
                            <SlidersHorizontal className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                        </div>
                        <span className="text-foreground tracking-tight mb-3 text-lg" style={{ fontFamily: '"Inter", sans-serif', fontWeight: 800 }}>Règles Globales</span>
                        <div className="flex gap-2 mb-2">
                            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                            <div className="h-3 w-3 rounded-full bg-orange-300/50 shadow-[0_0_6px_rgba(200,150,80,0.6)]" />
                            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">font: Inter Bold</span>
                    </motion.div>

                    {/* ── SVG Connecting Lines ── */}
                    <svg className="w-full h-[100px] relative z-10 overflow-visible" viewBox="0 0 1100 100" preserveAspectRatio="xMidYMid meet">
                        {/* Central trunk line from node down */}
                        <motion.line
                            x1="550" y1="0" x2="550" y2="35"
                            stroke="hsl(30, 90%, 50%)" strokeWidth="2" strokeDasharray="4 4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={isInView ? { pathLength: 1, opacity: 0.7 } : {}}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        />
                        {/* Horizontal bar */}
                        <motion.line
                            x1="100" y1="35" x2="1000" y2="35"
                            stroke="hsl(30, 90%, 50%)" strokeWidth="2" strokeDasharray="4 4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={isInView ? { pathLength: 1, opacity: 0.5 } : {}}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        />
                        {/* 5 vertical drops */}
                        {[100, 325, 550, 775, 1000].map((x, i) => (
                            <motion.line
                                key={i}
                                x1={x} y1="35" x2={x} y2="100"
                                stroke="hsl(30, 90%, 50%)" strokeWidth="2" strokeDasharray="4 4"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={isInView ? { pathLength: 1, opacity: 0.5 } : {}}
                                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
                            />
                        ))}
                    </svg>

                    {/* ── 5 Screenshot Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 w-full mt-2 relative z-20">
                        {cards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                className="flex flex-col items-center gap-3"
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 1.2 + i * 0.15, duration: 0.6, type: "spring", bounce: 0.3 }}
                            >
                                <div className="w-full aspect-[9/19.5] rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black group cursor-pointer">
                                    <img
                                        src={card.src}
                                        alt={card.label}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Feature Pills ── */}
                <div className="mt-16 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                    {[
                        'Logique de couleurs partagée',
                        'Typographie synchronisée',
                        'Rythmes de mise en page globaux',
                        'Cohérence slide-à-slide',
                        'Direction créative unique'
                    ].map((feature, i) => (
                        <motion.div
                            key={feature}
                            className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-5 py-2.5 shadow-xl"
                            initial={{ opacity: 0, y: 15 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 2.0 + (i * 0.1), duration: 0.5 }}
                        >
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-white/80">{feature}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
