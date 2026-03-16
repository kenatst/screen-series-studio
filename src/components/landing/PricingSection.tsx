import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, useNavigate } from 'react-router-dom';
import { PLANS } from '@/lib/plans';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const PricingSection = () => {
    const { session, profile } = useAuth();
    const { toast } = useToast();
    const { handleUpgrade, isUpgrading } = useBilling();
    const { t } = useTranslation();

    const handleCta = async (planId: string) => {
        if (planId === 'free') {
            window.location.href = '/login';
            return;
        }
        if (!session) {
            window.location.href = '/login';
            return;
        }

        await handleUpgrade(planId, window.location.pathname);
    };

    return (
        <section id="pricing" className="py-24 bg-surface-elevated relative z-10 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{t('pricing.badge')}</Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        {t('pricing.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {PLANS.map((plan, i) => {
                        const isCurrentPlan = profile?.plan === plan.id;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className={`relative rounded-3xl p-7 flex flex-col ${plan.popular
                                    ? 'bg-card border-2 border-primary shadow-glow'
                                    : isCurrentPlan
                                        ? 'bg-card border-2 border-green-500/50'
                                        : 'bg-card/50 border border-border'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider py-1 px-4 rounded-full">
                                        {t('pricing.mostPopular')}
                                    </div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white font-bold text-xs uppercase tracking-wider py-1 px-4 rounded-full">
                                        {t('pricing.yourPlan')}
                                    </div>
                                )}

                                <div className="mb-5">
                                    <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>

                                <div className="mb-2">
                                    <span className="text-4xl font-black text-foreground">{plan.price}</span>
                                    {plan.priceValue > 0 && <span className="text-muted-foreground text-sm ml-1">/mo</span>}
                                </div>
                                <div className="mb-6 flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground">{plan.monthlyCredits} {t('pricing.creditsPerMonth')}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                                            <p className="font-semibold mb-1">How credits work</p>
                                            <ul className="space-y-0.5 text-muted-foreground">
                                                <li>• Generate a slide: 1 credit</li>
                                                <li>• Regenerate a slide: 1 credit</li>
                                                <li>• Translate a slide: 1 credit</li>
                                                <li>• Export: free</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground text-sm">{f}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map(f => (
                                        <div key={f} className="flex gap-2.5 opacity-40">
                                            <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground text-sm">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => handleCta(plan.id)}
                                    disabled={isCurrentPlan}
                                    className={`w-full h-11 rounded-xl font-bold text-sm transition-all mt-auto ${plan.popular
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]'
                                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    {isCurrentPlan ? t('pricing.currentPlan') : plan.cta}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
