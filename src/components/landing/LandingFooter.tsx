import { forwardRef } from 'react';
import appLogo from '@/assets/logo-shotapp.png';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LandingFooter = forwardRef<HTMLElement>((_, ref) => {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-border bg-background relative overflow-hidden pt-24 pb-12">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[200px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 max-w-2xl">
                    {t('footer.cta')}
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-xl">
                    {t('footer.ctaSubtitle')}
                </p>
                <Link to="/project/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg h-14 px-10 rounded-full shadow-glow transition-all hover:scale-105">
                        {t('footer.ctaButton')}
                    </Button>
                </Link>
                <p className="mt-4 text-sm text-foreground/40">{t('footer.noCard')}</p>

                <div className="w-full h-px bg-black/5 my-16" />

                <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src={appLogo} alt="ShotApp AI" className="h-7 w-7 rounded-lg object-cover" />
                        <span className="text-sm font-medium text-muted-foreground">&copy; {new Date().getFullYear()} ShotApp AI. {t('footer.rights')}</span>
                    </div>
                    <div className="flex gap-6 text-sm text-foreground/40">
                        <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
                        <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
});

LandingFooter.displayName = 'LandingFooter';
