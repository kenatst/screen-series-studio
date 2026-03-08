import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const steps = [
    {
        id: 1,
        title: 'Upload raw app screens',
        description: 'No more messing with Figma layers. Just drag and drop your raw iOS or Android screenshots directly into the forge.',
    },
    {
        id: 2,
        title: 'Inject your Brand Kit',
        description: 'Upload your logo, define your primary colors, and select your typography. ScreenForge locks these in as global variables.',
    },
    {
        id: 3,
        title: 'Pick templates or references',
        description: 'Choose from our premium template library, or upload moodboard images as visual references for the AI to match.',
    },
    {
        id: 4,
        title: 'Plan the storyline',
        description: 'Define the objective, headline, and emphasis for each slide. The consistency engine ensures they all belong to the same family.',
    },
    {
        id: 5,
        title: 'Batch generate instantly',
        description: 'Hit generate. Watch as the AI builds up to 10 store-ready screenshots simultaneously, perfectly aligned and styled.',
    },
    {
        id: 6,
        title: 'Export the full set',
        description: 'Download the entire high-resolution screenshot set as a ZIP, ready to upload directly to App Store Connect.',
    }
];

export const WorkflowScrollytelling = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    const [activeStep, setActiveStep] = useState(0);

    // Derive the active step from scroll progress
    useEffect(() => {
        return scrollYProgress.onChange((latest) => {
            // Divide the scroll progress (0 to 1) into roughly equal segments for each step
            const stepIndex = Math.min(
                Math.max(0, Math.floor(latest * steps.length)),
                steps.length - 1
            );
            if (stepIndex !== activeStep) {
                setActiveStep(stepIndex);
            }
        });
    }, [scrollYProgress, activeStep]);

    return (
        <section id="workflow" ref={containerRef} className="relative bg-background" style={{ height: '300vh' }}>
            {/* Sticky container that stays in view while scrolling */}
            <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
                {/* Decorative background glow that shifts based on step */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none mix-blend-screen opacity-20"
                    animate={{
                        backgroundColor: ['#f5a623', '#1e3a8a', '#e11d48', '#f5a623', '#10b981', '#1e3a8a'][activeStep]
                    }}
                    transition={{ duration: 1 }}
                />

                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 lg:gap-24 relative z-10 w-full">

                    {/* Left Side: Text Content */}
                    <div className="flex flex-col justify-center h-full max-w-xl py-20">
                        <div className="mb-4 inline-block">
                            <span className="text-primary font-bold tracking-widest uppercase text-sm">The Workflow</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight mb-12">
                            From raw screens to cohesive sets.
                        </h2>

                        <div className="relative pl-8">
                            {/* Progress Line */}
                            <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-white/10">
                                <motion.div
                                    className="absolute top-0 left-0 w-full bg-primary"
                                    style={{ height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
                                />
                            </div>

                            <div className="space-y-12">
                                {steps.map((step, index) => {
                                    const isActive = index === activeStep;
                                    const isPast = index < activeStep;

                                    return (
                                        <div
                                            key={step.id}
                                            className={`relative transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}
                                        >
                                            <div className={`absolute -left-8 top-1 h-2.5 w-2.5 rounded-full ring-4 ${isActive ? 'bg-primary ring-primary/30' : isPast ? 'bg-primary/50 ring-transparent' : 'bg-white/20 ring-transparent'} transition-all duration-500`} />
                                            <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Visuals tied to activeStep */}
                    <div className="hidden md:flex flex-col justify-center h-full relative perspective-[2000px]">
                        <div className="relative w-full aspect-square max-h-[600px] max-w-[600px] rounded-3xl bg-zinc-900/50 border border-border backdrop-blur-xl shadow-2xl overflow-hidden flex items-center justify-center p-8">
                            <AnimatePresence mode="popLayout">
                                {/* Step 1 Visual: Upload */}
                                {activeStep === 0 && (
                                    <motion.div
                                        key="step-0"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-black/5"
                                    >
                                        <div className="grid grid-cols-2 gap-4 w-3/4">
                                            <div className="aspect-[9/19.5] bg-zinc-800 rounded-xl shadow-lg border border-border flex items-center justify-center -rotate-6 translate-y-4">
                                                <div className="h-10 w-10 border-4 border-border rounded-full" />
                                            </div>
                                            <div className="aspect-[9/19.5] bg-zinc-800 rounded-xl shadow-lg border border-border flex items-center justify-center rotate-6 -translate-y-4">
                                                <div className="w-10 h-2 bg-white/10 rounded-full" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2 Visual: Brand Kit */}
                                {activeStep === 1 && (
                                    <motion.div
                                        key="step-1"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full flex flex-col items-center justify-center gap-6"
                                    >
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-glow flex items-center justify-center border border-border">
                                            <span className="text-foreground text-3xl font-bold">Acme</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-600 border border-border shadow-md" />
                                            <div className="w-12 h-12 rounded-full bg-indigo-600 border border-border shadow-md" />
                                            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-border shadow-md" />
                                        </div>
                                        <div className="w-48 h-12 rounded-lg bg-white/10 border border-border flex items-center px-4 font-mono text-muted-foreground">
                                            "Inter", sans-serif
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3 Visual: Templates */}
                                {activeStep === 2 && (
                                    <motion.div
                                        key="step-2"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full grid grid-cols-2 gap-4 p-4"
                                    >
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`rounded-xl border ${i === 1 ? 'border-primary ring-2 ring-primary/20 bg-primary/10' : 'border-border bg-black/5'} p-4 flex flex-col gap-2`}>
                                                <div className="w-full h-24 rounded bg-white/10" />
                                                <div className="w-1/2 h-3 rounded bg-white/20" />
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 4 Visual: Plan */}
                                {activeStep === 3 && (
                                    <motion.div
                                        key="step-3"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full flex flex-col gap-4 justify-center"
                                    >
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-full bg-black/5 border border-border rounded-xl p-4 flex items-center gap-4">
                                                <div className="h-12 w-8 bg-zinc-800 rounded border border-border" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="w-3/4 h-3 bg-white/20 rounded" />
                                                    <div className="w-1/2 h-2 bg-white/10 rounded" />
                                                </div>
                                                <div className="px-3 py-1 rounded bg-primary/20 text-primary text-xs font-medium border border-primary/20">High</div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 5 Visual: Generate */}
                                {activeStep === 4 && (
                                    <motion.div
                                        key="step-4"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full flex items-center justify-center relative"
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "60%" }}
                                                    transition={{ delay: i * 0.2, duration: 0.8, ease: "easeOut" }}
                                                    className="w-24 bg-gradient-to-b from-primary to-orange-600 rounded-xl border border-border shadow-glow overflow-hidden relative"
                                                >
                                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 animate-pulse" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 6 Visual: Export */}
                                {activeStep === 5 && (
                                    <motion.div
                                        key="step-5"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="w-full h-full flex flex-col items-center justify-center gap-6"
                                    >
                                        <div className="w-32 h-32 rounded-3xl bg-white/10 border border-border backdrop-blur-md flex items-center justify-center shadow-elevated">
                                            <div className="text-5xl">📦</div>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-foreground font-bold text-xl mb-2">ScreenForge-Set.zip</h4>
                                            <p className="text-muted-foreground">10 High-Res PNGs (10.4 MB)</p>
                                        </div>
                                        <div className="px-6 py-2 rounded-full bg-primary/20 border border-primary/50 text-foreground font-medium flex items-center gap-2">
                                            Ready for App Store Connect
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
