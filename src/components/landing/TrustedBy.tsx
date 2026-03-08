import { motion } from "framer-motion";

const companies = [
    { name: "Acme Corp", logo: "ACME" },
    { name: "Global Tech", logo: "GLOBAL" },
    { name: "NextGen", logo: "NEXTGEN" },
    { name: "Pioneer", logo: "PIONEER" },
    { name: "Vanguard", logo: "VANGUARD" },
    { name: "Aurora", logo: "AURORA" },
];

export const TrustedBy = () => {
    return (
        <section className="relative py-16 bg-background overflow-hidden border-t items-center border-border/50">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-10">
                    Trusted by Top Agencies and Indie Hackers
                </p>
                <div className="w-full relative overflow-hidden flex flex-nowrap items-center">
                    {/* Fading Edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

                    {/* Marquee Animation */}
                    <motion.div
                        className="flex items-center gap-16 md:gap-32 w-max"
                        animate={{ x: [0, -1000] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 20,
                        }}
                    >
                        {[...companies, ...companies, ...companies].map((company, index) => (
                            <div
                                key={`${company.name}-${index}`}
                                className="text-2xl md:text-3xl font-black text-muted-foreground opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:text-foreground transition-all flex-shrink-0 cursor-default select-none tracking-tight"
                                style={{ fontFamily: "Impact, sans-serif" }}
                            >
                                {company.logo}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
