import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export const BatchGenerationGrid = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // 10 slides
    const slides = Array.from({ length: 10 }, (_, i) => i);

    return (
        <section className="py-32 bg-surface-elevated relative overflow-hidden flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none z-10" />

            <div className="container relative mx-auto px-6 text-center z-20 mb-16" ref={ref}>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
                    Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">10 store-ready</span> visuals at once.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                    Why build one by one when the engine understands your entire narrative?
                    ScreenForge creates the full batch simultaneously.
                </p>
            </div>

            <div className="relative z-0 w-full max-w-[1400px] mx-auto px-6 perspective-[2000px]">
                <motion.div
                    className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6"
                    initial={{ rotateX: 0, rotateY: 0, scale: 1 }}
                    animate={isInView ? { rotateX: 10, rotateY: -5, scale: 0.95 } : {}}
                    transition={{ delay: 2.5, duration: 1.5, type: "spring", bounce: 0.2 }}
                >
                    {slides.map((i) => {
                        // We want them to "generate" sequentially from left to right
                        const delay = i * 0.15;

                        return (
                            <motion.div
                                key={i}
                                className="relative w-[80px] sm:w-[100px] md:w-[140px] lg:w-[180px] aspect-[9/19.5] rounded-xl md:rounded-2xl border border-border bg-zinc-900 overflow-hidden shadow-elevated"
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay, duration: 0.5, ease: "easeOut" }}
                            >
                                {/* "Generating" State (Pulse) */}
                                <motion.div
                                    className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center p-2 md:p-4 gap-2 border border-primary/30"
                                    initial={{ opacity: 1 }}
                                    animate={isInView ? { opacity: 0 } : {}}
                                    transition={{ delay: delay + 1.2, duration: 0.3 }}
                                >
                                    <div className="w-1/2 h-1/2 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-50 max-w-[30px] max-h-[30px]" />
                                    <div className="h-1 lg:h-2 w-full bg-primary/30 rounded-full mt-auto overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: "0%" }}
                                            animate={isInView ? { width: "100%" } : {}}
                                            transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeInOut" }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Generated Result State */}
                                <motion.div
                                    className="absolute inset-0 bg-zinc-800 flex flex-col p-2 lg:p-4"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ delay: delay + 1.2, duration: 0.4, type: "spring" }}
                                >
                                    {/* The "Generated Image" mockup */}
                                    <div className="h-4 lg:h-6 w-8 lg:w-12 rounded-full bg-white/10 mb-2" />
                                    <div className="h-2 lg:h-3 w-3/4 bg-white/50 rounded mb-1" />
                                    <div className="h-2 lg:h-3 w-1/2 bg-white/30 rounded mb-4 lg:mb-6" />
                                    <div className="flex-1 rounded-md lg:rounded-lg bg-zinc-950 border border-border flex items-center justify-center relative shadow-inner">
                                        {/* Fake UI inside the phone mockup */}
                                        <div className="absolute top-4 left-2 right-2 flex flex-col gap-2 opacity-50">
                                            <div className="h-4 lg:h-8 w-full bg-white/10 rounded" />
                                            <div className="h-4 lg:h-8 w-full bg-white/10 rounded" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Final flash */}
                                <motion.div
                                    className="absolute inset-0 bg-white z-10 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={isInView ? { opacity: [0, 0.8, 0] } : {}}
                                    transition={{ delay: delay + 1.2, duration: 0.5 }}
                                />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};
