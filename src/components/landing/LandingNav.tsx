import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

export const LandingNav = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: t('nav.workflow'), href: '#workflow' },
        { label: t('nav.examples'), href: '#examples' },
        { label: t('nav.pricing'), href: '#pricing' },
        { label: t('nav.faq'), href: '#faq' },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-background/80 backdrop-blur-xl border-b border-border py-4 shadow-elevated'
                    : 'bg-background/30 backdrop-blur-sm border-b border-white/5 py-6'
                    }`}
            >
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="ShotApp AI Logo" className="h-8 w-8 rounded-lg shadow-glow object-cover" />
                        <span className="text-xl font-bold tracking-tight text-foreground drop-shadow-md">ShotApp AI</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSelector />
                        <ThemeToggle />
                        <Link to="/login" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1">
                                {t('nav.login')}
                            </span>
                        </Link>
                        <Link to="/login">
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-glow rounded-full px-6 h-10">
                                {t('nav.start')}
                            </Button>
                        </Link>
                    </div>

                    <button className="md:hidden text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1" onClick={() => setMobileMenuOpen(true)}>
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
                                    key={link.href}
                                    href={link.href}
                                    className="text-2xl font-bold text-foreground/90 hover:text-foreground transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="w-full h-px bg-white/10 my-2" />
                            <div className="flex items-center gap-3">
                                <LanguageSelector />
                                <ThemeToggle />
                            </div>
                            <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full text-foreground border-border h-14 text-lg">
                                    {t('nav.login')}
                                </Button>
                            </Link>
                            <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-primary text-primary-foreground h-14 text-lg shadow-glow">
                                    {t('nav.start')}
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
