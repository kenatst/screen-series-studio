import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
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
            </div>
        </section>
    );
};
