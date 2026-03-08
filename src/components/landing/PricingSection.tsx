import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
    {
        name: 'Free Trial',
        price: 'Free',
        desc: 'Test the power of ScreenForge.',
        features: ['1 slide limit', 'Standard templates', 'Watermarked export'],
        notIncluded: ['Full screenshot sets', 'Brand Kit integration', 'Translation & Redesign'],
        popular: false,
    },
    {
        name: 'Starter',
        price: '€49',
        period: '',
        desc: 'Perfect for launching one app.',
        features: ['1 Unique Project', 'Up to 10 slides per set', 'Consistency Engine enabled', 'High-res export (No watermark)'],
        notIncluded: ['Unlimited Redesigns', '1-Click Translations'],
        popular: false,
    },
    {
        name: 'Pro',
        price: '€99',
        period: '',
        desc: 'For builders shipping multiple apps.',
        features: ['3 Projects included', '1-Click Translations', 'Unlimited Redesigns', 'Full Brand Kit control'],
        notIncluded: ['Unlimited projects'],
        popular: true,
    },
    {
        name: 'Unlimited',
        price: '€399',
        period: '',
        desc: 'No limits for premium ASO teams.',
        features: ['Unlimited Projects', '1-Click Translations to Any Language', 'Unlimited Redesigns', 'Priority API & Generation queue'],
        notIncluded: [],
        popular: false,
    }
];

export const PricingSection = () => {
    return (
        <section id="pricing" className="py-24 bg-surface-elevated relative z-10 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        Simple, transparent pricing.
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Stop paying thousands for manual screenshot production.
                        Automate perfection at a fraction of the cost.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`relative rounded-3xl p-8 flex flex-col ${plan.popular
                                ? 'bg-zinc-900 border-2 border-primary shadow-[0_0_50px_-12px_rgba(245,166,35,0.4)]'
                                : 'bg-zinc-900/50 border border-border'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black font-bold text-xs uppercase tracking-wider py-1 px-4 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.desc}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-black text-foreground">{plan.price}</span>
                                {plan.period && <span className="text-foreground/40">{plan.period}</span>}
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.features.map(f => (
                                    <div key={f} className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                        <span className="text-muted-foreground text-sm">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map(f => (
                                    <div key={f} className="flex gap-3 opacity-40">
                                        <X className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground text-sm">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link to="/project/new" className="mt-auto">
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold text-base transition-all ${plan.popular
                                        ? 'bg-primary text-black hover:bg-primary/90 hover:scale-105'
                                        : 'bg-white/10 text-foreground hover:bg-white/20'
                                        }`}
                                >
                                    Get started
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
