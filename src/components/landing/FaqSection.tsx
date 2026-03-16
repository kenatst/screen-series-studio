import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const faqs = [
    {
        q: "Do I need design skills to use ShotApp AI?",
        a: "Not at all. ShotApp AI is built specifically to automate the design process. You provide the app screenshots and text, and our Engine handles layout, consistency, lighting, and typography."
    },
    {
        q: "Can I use my own fonts and brand colors?",
        a: "Yes. On the Pro and Agency plans, you can upload your full Brand Kit, including custom TTF/OTF fonts and exact hex codes. The engine will lock these in across your entire screenshot set."
    },
    {
        q: "How does the AI ensure consistency?",
        a: "Unlike generic image generators, ShotApp AI uses a deterministic layout and styling pipeline governed by the Consistency Engine. It applies a global style graph across all slides in a set simultaneously, rather than rendering them individually."
    },
    {
        q: "What format do I get the final screenshots in?",
        a: "You receive a perfectly sized, high-resolution ZIP file containing PNGs optimized for immediate upload to App Store Connect and Google Play Console."
    },
    {
        q: "Can I regenerate just one slide?",
        a: "Yes. Our surgical editing feature lets you regenerate a single slide without breaking the visual coherence of the entire batch."
    },
    {
        q: "How does the credit system work?",
        a: "Each slide generation or regeneration costs 1 credit. Translating a slide costs 1 credit per language. Credits are replenished monthly based on your plan, and unused credits roll over for 30 days."
    },
    {
        q: "How many slides does a typical screenshot set have?",
        a: "A standard App Store set contains 5–10 screenshots. ShotApp AI generates a complete, cohesive 5–10 slide set in a single session. The Free plan gives you a preview of the first slide; paid plans unlock the full set."
    },
    {
        q: "Which platforms are supported?",
        a: "We support both Apple App Store (iOS/iPadOS) and Google Play Store (Android). Each platform has specific aspect ratio requirements, and our engine handles them automatically."
    },
    {
        q: "Is there a free trial?",
        a: "Yes. The Free plan includes 3 credits to try the full generation workflow. No credit card required to start."
    },
    {
        q: "What is your refund policy?",
        a: "We offer a 7-day no-questions-asked refund on your first subscription payment. For subsequent billing cycles, refunds are handled case-by-case. Contact support@shotapp.ai within 48 hours of your billing date."
    }
];

export const FaqSection = () => {
    const { t } = useTranslation();
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
