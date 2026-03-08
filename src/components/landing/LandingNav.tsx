import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';

export const LandingNav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Product', href: '#product' },
        { label: 'Workflow', href: '#workflow' },
        { label: 'Examples', href: '#examples' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/70 backdrop-blur-xl border-b border-border py-4 shadow-elevated' : 'bg-transparent py-6'
                    }`}
            >
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="ScreenForge Logo" className="h-8 w-8 rounded-lg shadow-glow object-cover" />
                        <span className="text-xl font-bold tracking-tight text-foreground drop-shadow-md">ScreenForge</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login">
                            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-2">
                                Log in
                            </span>
                        </Link>
                        <Link to="/login">
                            <Button className="bg-white text-black hover:bg-white/90 font-semibold shadow-glow rounded-full px-6 h-10">
                                Start free trial
                            </Button>
                        </Link>
                    </div>

                    <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </motion.nav>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-3xl p-6 flex flex-col pt-20"
                    >
                        <button
                            className="absolute top-6 right-6 text-foreground p-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="flex flex-col gap-6 items-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-2xl font-bold text-foreground/90 hover:text-foreground transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="w-full h-px bg-white/10 my-4" />
                            <Link to="/project/new" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full text-foreground border-border h-14 text-lg">
                                    Log in
                                </Button>
                            </Link>
                            <Link to="/project/new" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-primary text-primary-foreground h-14 text-lg shadow-glow">
                                    Start free trial
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
