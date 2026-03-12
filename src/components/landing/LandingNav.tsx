import * as React from 'react';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const LanguageSwitcher = forwardRef<HTMLDivElement>((props, ref) => {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const innerRef = useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement | null) => {
        (innerRef as any).current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
    };

    const currentLang = LANGUAGES.find(l => l.code === i18n.language.split('-')[0]) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={combinedRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
            >
                <Globe className="h-4 w-4" />
                <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-white/5 ${i18n.language.startsWith(lang.code) ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground'}`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';

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
                        <LanguageSwitcher />
                        <Link to="/login" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1">
                                {t('nav.login')}
                            </span>
                        </Link>
                        <Link to="/login">
                            <Button className="bg-white text-black hover:bg-white/90 font-semibold shadow-glow rounded-full px-6 h-10">
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
                            <LanguageSwitcher />
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
