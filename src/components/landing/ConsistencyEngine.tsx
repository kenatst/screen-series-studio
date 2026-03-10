import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';

export const ConsistencyEngine = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const cards = [
        { angle: -14, x: -380, y: 100, delay: 0.2, src: "https://storage.googleapis.com/mfc-live-user-files/558c4953-ad47-49e0-ade1-0b5c159bf461/506a7824-2c93-41bb-ad68-07f7c108139b.png" },
        { angle: -7, x: -190, y: 65, delay: 0.4, src: "https://storage.googleapis.com/mfc-live-user-files/558c4953-ad47-49e0-ade1-0b5c159bf461/4769395b-017e-412d-bade-a396e95c4cf8.png" },
        { angle: 0, x: 0, y: 40, delay: 0.6, src: "https://storage.googleapis.com/mfc-live-user-files/558c4953-ad47-49e0-ade1-0b5c159bf461/52e50ad7-9092-411a-823a-f1262d4e7855.png" },
        { angle: 7, x: 190, y: 65, delay: 0.8, src: "https://storage.googleapis.com/mfc-live-user-files/558c4953-ad47-49e0-ade1-0b5c159bf461/1a21643c-6878-43d6-befa-429cbda078b6.png" },
        { angle: 14, x: 380, y: 100, delay: 1.0, src: "https://storage.googleapis.com/mfc-live-user-files/558c4953-ad47-49e0-ade1-0b5c159bf461/c6cce01d-55e2-45a7-93cf-8d9ad7bc9100.png" },
    ];

    return (
        <section className="py-24 bg-surface-elevated relative overflow-hidden">
            <div className="container mx-auto px-6" ref={ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold uppercase tracking-wider">
                        The Differentiator
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                        Le Moteur de Cohérence
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                        ScreenForge doesn't generate isolated images. It orchestrates a cohesive visual system.
                        One shared creative direction propagates globally across your entire screenshot set.
                    </p>
                </div>

                <div className="relative h-[650px] md:h-[750px] w-full max-w-[1200px] mx-auto flex items-center justify-center mt-8 perspective-[1200px]">

                    {/* Central Rule Node - Positioned AT THE TOP */}
                    <motion.div
                        className="absolute z-30 w-56 bg-zinc-900/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-[0_0_40px_-10px_rgba(245,166,35,0.4)] left-1/2 top-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center -mt-[280px] md:-mt-[320px]"
                        initial={{ scale: 0.8, opacity: 0, y: -50 }}
                        animate={isInView ? { scale: 1, opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, type: "spring" }}
                    >
                        <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 border border-primary/40 shadow-inner">
                            <SlidersHorizontal className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                        </div>
                        <span className="text-foreground tracking-tight mb-3 text-lg" style={{ fontFamily: '"Inter", sans-serif', fontWeight: 800 }}>Règles Globales</span>
                        <div className="flex gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                            <div className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                            <div className="h-3 w-3 rounded-full bg-accent shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
                        </div>
                    </motion.div>

                    {/* Surrounding Cards and Connecting Lines */}
                    {cards.map((card, i) => {
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                        const cardX = isMobile ? card.x * 0.45 : card.x;
                        const cardY = isMobile ? (i * 120) - 100 : card.y;

                        // Line calculation relative to card center
                        // Central node bottom Y relative to container center is roughly -220px on desktop
                        const startY = isMobile ? -cardY - 200 : -cardY - 220;
                        const startX = -cardX;
                        const endY = isMobile ? -140 : -160; // top of the card roughly

                        const cpX = startX * 0.5 + 600;
                        const cpY = (startY + endY) * 0.5 + 600;

                        return (
                            <div key={`card-group-${i}`} className="absolute top-1/2 left-1/2 z-20" style={{ transform: `translate(${cardX}px, ${cardY}px)` }}>

                                {/* Connecting SVG Line */}
                                {!isMobile && (
                                    <svg className="absolute top-1/2 left-1/2 w-[1200px] h-[1200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10 overflow-visible">
                                        {/* M startX startY Q CPX CPY endX endY */}
                                        <motion.path
                                            d={`M ${startX + 600} ${startY + 600} Q ${cpX} ${cpY} ${600} ${endY + 600}`}
                                            fill="transparent"
                                            stroke="url(#line-gradient)"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={isInView ? { pathLength: 1, opacity: 0.6 } : {}}
                                            transition={{ delay: card.delay, duration: 1 }}
                                        />
                                        {/* Animated particle moving along the line */}
                                        {isInView && (
                                            <motion.circle
                                                r="4"
                                                fill="#f5a623"
                                                className="drop-shadow-[0_0_8px_rgba(245,166,35,1)]"
                                                initial={{ offsetDistance: "0%", opacity: 0 }}
                                                animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                                                transition={{ delay: card.delay + 0.2, duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    offsetPath: `path('M ${startX + 600} ${startY + 600} Q ${cpX} ${cpY} ${600} ${endY + 600}')`
                                                } as any}
                                            />
                                        )}
                                        <defs>
                                            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                )}

                                {/* The Card */}
                                <motion.div
                                    className="relative w-[140px] md:w-[170px] aspect-[9/19.5] rounded-2xl border border-white/10 shadow-2xl overflow-hidden origin-bottom bg-black"
                                    initial={{ rotateZ: 0, opacity: 0, scale: 0.8, y: 50 }}
                                    animate={isInView ? {
                                        rotateZ: isMobile ? (i % 2 === 0 ? -5 : 5) : card.angle,
                                        opacity: 1,
                                        scale: 1,
                                        y: 0
                                    } : {}}
                                    transition={{ delay: card.delay + 0.3, duration: 0.8, type: "spring", bounce: 0.3 }}
                                >
                                    <img src={card.src} alt={`App Screen ${i}`} className="w-full h-full object-cover rounded-xl border border-black/40" />

                                    {/* Flash effect when rule applies */}
                                    <motion.div
                                        className="absolute inset-0 bg-primary mix-blend-overlay z-10 pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={isInView ? { opacity: [0, 0.4, 0] } : {}}
                                        transition={{ delay: card.delay + 0.8, duration: 0.8 }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent mix-blend-screen z-10 pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={isInView ? { opacity: [0, 0.3, 0] } : {}}
                                        transition={{ delay: card.delay + 0.8, duration: 1.2 }}
                                    />
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto z-30 relative">
                    {[
                        'Shared color logic',
                        'Synchronized typography',
                        'Global layout rhythms',
                        'Slide-to-slide coherence',
                        'Single creative direction'
                    ].map((feature, i) => (
                        <motion.div
                            key={feature}
                            className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-5 py-2.5 shadow-xl"
                            initial={{ opacity: 0, y: 15 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 1.8 + (i * 0.1), duration: 0.5 }}
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
