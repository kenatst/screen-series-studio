import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

type FaqItem = { q: string; a: string };

export const FaqSection = () => {
    const { t } = useTranslation();
    const localizedFaqs = t("faq.items", { returnObjects: true }) as FaqItem[];
    const faqs = Array.isArray(localizedFaqs) ? localizedFaqs : [];
    return (
        <section id="faq" className="py-24 bg-background border-t border-border">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4">
                        {t('faq.title')}
                    </h2>
                    <p className="text-muted-foreground">{t('faq.subtitle')}</p>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border border-border bg-black/5 rounded-xl px-6 data-[state=open]:border-primary/50 data-[state=open]:bg-white/10 transition-colors">
                            <AccordionTrigger className="text-foreground hover:no-underline hover:text-primary text-left text-lg font-medium py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};
