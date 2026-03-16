import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    return (
        <section className="py-24 bg-surface-elevated relative overflow-x-hidden">
            <div className="container mx-auto px-6" ref={ref}>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 shadow-sm font-semibold uppercase tracking-wider">
                        {t('consistency.badge')}
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                        {t('consistency.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                        {t('consistency.subtitle')}
                    </p>
                </div>

                {/* ── Main Visual ── */}
                <div className="relative w-full max-w-[1200px] mx-auto flex flex-col items-center">

                    {/* ── Global Rules Node (top) ── */}
                    <motion.div
                        className="relative z-30 bg-[#18181B] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center w-[280px]"
                        initial={{ scale: 0.8, opacity: 0, y: -30 }}
                        animate={isInView ? { scale: 1, opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, type: "spring" }}
                    >
                        <div className="h-12 w-12 bg-[#FF9500]/10 rounded-full flex items-center justify-center mb-4">
                            <SlidersHorizontal className="h-6 w-6 text-[#FF9500]" />
                        </div>
                        <span className="text-white tracking-tight mb-4 text-xl" style={{ fontFamily: '"Inter", sans-serif', fontWeight: 800 }}>{t('consistency.rulesLabel')}</span>
                        <div className="flex gap-3 mb-4">
                            <div className="h-4 w-4 rounded-full bg-[#FF9500]" />
                            <div className="h-4 w-4 rounded-full border border-white/20 bg-transparent" />
                            <div className="h-4 w-4 rounded-full bg-[#FF3B30]" />
                        </div>
                        <div className="bg-[#111111] border border-white/5 rounded px-3 py-1.5 w-full">
                            <span className="text-sm text-[#A1A1AA] font-mono">font: Inter Bold</span>
                        </div>
                    </motion.div>

                    {/* ── SVG Connecting Lines ── */}
                    <div className="w-full relative h-[120px] -mt-2 z-10">
                        <svg className="w-full h-full absolute inset-0 preserve-3d" preserveAspectRatio="none">
                            <motion.path
                                d="M 600,0 L 600,120"
                                stroke="#FF9500" strokeWidth="1.5" fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={isInView ? { pathLength: 1, opacity: 0.7 } : {}}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            />
                            {[150, 375, 825, 1050].map((x, i) => (
                                <motion.path
                                    key={i}
                                    d={`M 600,0 C 600,60 ${x},60 ${x},120`}
                                    stroke="#FF9500" strokeWidth="1.5" fill="none"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={isInView ? { pathLength: 1, opacity: 0.7 } : {}}
                                    transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                                />
                            ))}
                        </svg>
                    </div>

                    {/* ── 5 Screenshot Cards ── */}
                    <div className="flex justify-between w-full relative z-20 gap-3">
                        {cards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer"
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 1.2 + i * 0.15, duration: 0.6, type: "spring", bounce: 0.3 }}
                                whileHover={{ y: -5, boxShadow: "0 20px 50px -15px rgba(255,149,0,0.2)" }}
                            >
                                <img
                                    src={card.src}
                                    alt={card.label}
                                    className="w-full h-auto object-cover"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Feature Pills ── */}
                <div className="mt-20 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                    {[
                        t('consistency.features.colors'),
                        t('consistency.features.typography'),
                        t('consistency.features.layout'),
                        t('consistency.features.coherence'),
                        t('consistency.features.direction'),
                    ].map((feature, i) => (
                        <motion.div
                            key={feature}
                            className="flex items-center gap-2.5 bg-[#18181B] border border-white/5 rounded-full px-6 py-3 shadow-md"
                            initial={{ opacity: 0, y: 15 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 2.0 + (i * 0.1), duration: 0.5 }}
                        >
                            <CheckCircle2 className="h-4 w-4 text-[#FF9500]" />
                            <span className="text-sm font-medium text-[#D4D4D8]">{feature}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
