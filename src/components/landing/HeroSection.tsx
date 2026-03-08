import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Wand2, Layers, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.8, ease: "easeOut" as const } }),
};

export const HeroSection = () => {
    return (
        <section className="relative min-h-[100vh] pt-32 pb-20 overflow-hidden bg-background flex flex-col items-center">
            {/* Cinematic Lighting Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen" />
            <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            <div className="container relative mx-auto px-6 text-center z-10 flex-1 flex flex-col justify-center">
                <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-border backdrop-blur-md shadow-glow">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground/90">Built for App Store & Google Play</span>
                    </div>
                </motion.div>

                <motion.h1
                    className="mx-auto max-w-5xl text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[1.05] text-foreground"
                    initial="hidden" animate="visible" variants={fadeUp} custom={1}
                >
                    Generate screenshot sets that look{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-accent drop-shadow-[0_0_30px_rgba(245,166,35,0.4)]">
                        world-class
                    </span>
                    <br />
                    <span className="opacity-90">— in minutes.</span>
                </motion.h1>

                <motion.p
                    className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed font-medium"
                    initial="hidden" animate="visible" variants={fadeUp} custom={2}
                >
                    Upload your app screens, choose a style, define each slide, and orchestrate up to 10 store-ready visuals in one coherent batch.
                </motion.p>

                <motion.div
                    className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
                    initial="hidden" animate="visible" variants={fadeUp} custom={3}
                >
                    <Link to="/project/new">
                        <Button size="lg" className="w-full sm:w-auto text-base px-10 h-14 bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] rounded-full font-bold">
                            Start free trial
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-10 h-14 border-border bg-black/5 backdrop-blur-md text-foreground hover:bg-white/10 rounded-full font-medium transition-all group">
                        Watch the workflow <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                {/* The Pipeline Animation Showcase */}
                <motion.div
                    className="mx-auto mt-24 relative w-full border border-border rounded-2xl bg-card/90 backdrop-blur-xl shadow-2xl p-4 md:p-8"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" as const }}
                >
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] rounded-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[400px]">
                        {/* Input Phase: Raw Screens */}
                        <div className="flex-1 flex justify-center items-center gap-4 w-full">
                            {[0, 1].map((i) => (
                                <motion.div
                                    key={`raw-${i}`}
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 1 + (i * 0.2), duration: 0.8 }}
                                    className="w-24 md:w-32 aspect-[9/19.5] rounded-xl border border-border bg-black/5 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0"
                                >
                                    <div className="w-full h-full p-2 flex flex-col gap-2 opacity-50">
                                        <div className="w-full h-4 bg-white/10 rounded" />
                                        <div className="w-3/4 h-3 bg-white/10 rounded" />
                                        <div className="flex-1 rounded bg-black/5 mt-2" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* The Forge / Engine */}
                        <motion.div
                            className="flex-shrink-0 relative"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 0.8 }}
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-black to-zinc-900 border border-border shadow-glow flex items-center justify-center z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#f5a623_100%)] animate-spin opacity-20" style={{ animationDuration: '3s' }} />
                                <Cpu className="h-8 w-8 md:h-12 md:w-12 text-primary relative z-10" />
                            </div>

                            {/* Animated paths coming in and out */}
                            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[200px] pointer-events-none -z-10" viewBox="0 0 300 100" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,50 L100,50"
                                    stroke="rgba(245,166,35,0.4)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.path
                                    d="M200,50 L300,50"
                                    stroke="rgba(245,166,35,0.8)"
                                    strokeWidth="2"
                                    initial={{ strokeDashoffset: 100, strokeDasharray: "100 100" }}
                                    animate={{ strokeDashoffset: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </svg>
                        </motion.div>

                        {/* Output Phase: Coherent Set */}
                        <div className="flex-1 flex justify-center items-center w-full relative h-[300px] md:h-auto">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={`out-${i}`}
                                    className="absolute w-32 md:w-48 aspect-[9/19.5] rounded-[1.5rem] border border-border bg-gradient-to-b from-zinc-800 to-black shadow-elevated overflow-hidden"
                                    style={{
                                        zIndex: 3 - i,
                                    }}
                                    initial={{ scale: 0.8, x: -100, opacity: 0, rotateY: 0 }}
                                    animate={{
                                        scale: 1 - (i * 0.05),
                                        x: i * 60,
                                        y: i * 15,
                                        opacity: 1 - (i * 0.15),
                                        rotateY: -15
                                    }}
                                    transition={{ delay: 2 + (i * 0.2), duration: 0.8, type: "spring", bounce: 0.4 }}
                                >
                                    {/* Premium mockup visual */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent p-4 flex flex-col">
                                        <div className="h-8 w-8 rounded-full bg-white/10 mb-2 backdrop-blur-md" />
                                        <div className="h-4 w-3/4 rounded-full bg-white/90 mb-2" />
                                        <div className="h-3 w-1/2 rounded-full bg-white/50 mb-6" />
                                        <div className="flex-1 rounded-lg bg-zinc-900 shadow-inner border border-border" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
