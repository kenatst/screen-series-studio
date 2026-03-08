import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        q: "Do I need design skills to use ScreenForge?",
        a: "Not at all. ScreenForge is built specifically to automate the design process. You provide the app screenshots and text, and our Engine handles layout, consistency, lighting, and typography."
    },
    {
        q: "Can I use my own fonts and brand colors?",
        a: "Yes. On the Pro and Agency plans, you can upload your full Brand Kit, including custom TTF/OTF fonts and exact hex codes. The engine will lock these in across your entire screenshot set."
    },
    {
        q: "How does the AI ensure consistency?",
        a: "Unlike generic image generators, ScreenForge uses a deterministic layout and styling pipeline governed by the Consistency Engine. It applies a global style graph across all slides in a set simultaneously, rather than rendering them individually."
    },
    {
        q: "What format do I get the final screenshots in?",
        a: "You receive a perfectly sized, high-resolution ZIP file containing PNGs optimized for immediate upload to App Store Connect and Google Play Console."
    },
    {
        q: "Can I regenerate just one slide?",
        a: "Yes. Our surgical editing feature lets you regenerate a single slide without breaking the visual coherence of the entire batch."
    }
];

export const FaqSection = () => {
    return (
        <section id="faq" className="py-24 bg-background border-t border-border">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-muted-foreground">Everything you need to know about ScreenForge.</p>
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
