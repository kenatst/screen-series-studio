import { motion } from 'framer-motion';

export const SocialProof = () => {
    return (
        <section className="py-12 border-b border-border bg-background relative overflow-hidden">
            <div className="container mx-auto px-6 text-center">
                <p className="text-sm font-medium text-foreground/40 uppercase tracking-widest mb-8">
                    Trusted by app founders, studios, and ASO teams
                </p>

                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                    {/* Mock logos utilizing basic shapes/text for premium aesthetic */}
                    {['AppStudio', 'Launchpad', 'GrowthStack', 'Nexus Mobile', 'Conversion AI'].map((name, i) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="flex items-center gap-2 text-muted-foreground font-display font-bold text-xl tracking-tight"
                        >
                            <div className="h-6 w-6 rounded-md bg-white/20" />
                            {name}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
