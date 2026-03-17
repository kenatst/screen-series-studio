export interface SlideLayoutAnalysis {
  slidePosition: number;
  hasDeviceMockup: boolean;
  devicePosition: string;
  deviceScale: string;
  textPosition: string;
  headlineStyle: string;
  backgroundType: string;
  has3DElements: boolean;
  hasMascot: boolean;
  mascotDescription: string | null;
  decorativeElements: string[];
  mood: string;
  detailedComposition: string;
}

export interface TemplateSetAnalysis {
  totalSlides: number;
  overallStyle: string;
  colorPalette: string;
  slides: SlideLayoutAnalysis[];
}

const DEFAULT_TEMPLATE_ANALYSIS: TemplateSetAnalysis = {
  totalSlides: 1,
  overallStyle: "Clean, professional App Store screenshot design with centered phone mockup.",
  colorPalette: "Gradient background with accent colors",
  slides: [
    {
      slidePosition: 1,
      hasDeviceMockup: true,
      devicePosition: "center",
      deviceScale: "large",
      textPosition: "top",
      headlineStyle: "bold-sans",
      backgroundType: "gradient",
      has3DElements: false,
      hasMascot: false,
      mascotDescription: null,
      decorativeElements: [],
      mood: "premium",
      detailedComposition: "Standard centered layout with large phone mockup and headline text above.",
    },
  ],
};

export async function analyzeTemplateSet(
  ai: {
    models: {
      generateContent: (input: unknown) => Promise<{
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      }>;
    };
  },
  imageBase64: string,
  mimeType: string,
): Promise<TemplateSetAnalysis> {
  try {
    console.log("[ANALYSIS] Analyzing full template set (composite image)...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: { mimeType, data: imageBase64 },
        },
        {
          text: `This image shows a SET of App Store screenshot templates displayed side by side (like a portfolio showcase). Each individual screenshot/slide in this set is a separate design that will be recreated with different app content.

Your task: Analyze EACH individual slide/screenshot visible in this composite image, from LEFT to RIGHT.

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:

{
  "totalSlides": <number of individual slides visible in the image>,
  "overallStyle": "A 2-3 sentence description of the overall visual identity, design language, and artistic direction that ties all slides together. Describe the shared color scheme, typography approach, device frame style, background treatment, and any recurring visual motifs.",
  "colorPalette": "List the dominant colors used across the set (e.g. '#1A1A2E deep navy, #E94560 coral accent, #F5F5F5 light background')",
  "slides": [
    {
      "slidePosition": 1,
      "hasDeviceMockup": boolean,
      "devicePosition": "center" | "left" | "right" | "angled",
      "deviceScale": "small" | "medium" | "large" | "full",
      "textPosition": "top" | "bottom" | "left" | "right" | "overlay",
      "headlineStyle": "bold-serif" | "bold-sans" | "script" | "condensed",
      "backgroundType": "gradient" | "solid" | "photo" | "3d-scene" | "pattern" | "aurora",
      "has3DElements": boolean,
      "hasMascot": boolean,
      "mascotDescription": "description of mascot/character if present, null otherwise",
      "decorativeElements": ["list", "of", "visual", "elements", "like", "floating-shapes", "particles", "icons"],
      "mood": "one-word-or-hyphenated mood descriptor",
      "detailedComposition": "A 3-4 sentence PRECISE description of THIS SPECIFIC slide's spatial layout. Include: exact element positions (e.g. 'headline at top 15%, phone centered at 40-85%, subheadline at bottom 10%'), device angle and shadow direction, text alignment, background gradient direction, decorative element placement, and any unique aspects that distinguish this slide from the others in the set."
    }
  ]
}

IMPORTANT:
- Count and describe EVERY individual slide visible, from left to right
- Each slide's detailedComposition must describe what makes THAT slide unique within the set
- The overallStyle should capture what makes these slides look like they belong together
- Be extremely precise about spatial positions, proportions, and visual hierarchy`,
        },
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    const rawText = response.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text || "{}";

    const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      totalSlides?: number;
      overallStyle?: string;
      colorPalette?: string;
      slides?: Array<Partial<SlideLayoutAnalysis>>;
    };

    const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    const totalSlidesFromPayload = Number(parsed.totalSlides);
    const normalizedTotalSlides = Number.isFinite(totalSlidesFromPayload) && totalSlidesFromPayload > 0
      ? Math.round(totalSlidesFromPayload)
      : slides.length;

    const normalizedSlides: SlideLayoutAnalysis[] = slides
      .slice(0, normalizedTotalSlides || slides.length)
      .map((slide, index) => ({
        slidePosition: Number(slide.slidePosition) > 0 ? Number(slide.slidePosition) : index + 1,
        hasDeviceMockup: Boolean(slide.hasDeviceMockup),
        devicePosition: slide.devicePosition || "center",
        deviceScale: slide.deviceScale || "large",
        textPosition: slide.textPosition || "top",
        headlineStyle: slide.headlineStyle || "bold-sans",
        backgroundType: slide.backgroundType || "gradient",
        has3DElements: Boolean(slide.has3DElements),
        hasMascot: Boolean(slide.hasMascot),
        mascotDescription: slide.mascotDescription || null,
        decorativeElements: Array.isArray(slide.decorativeElements) ? slide.decorativeElements : [],
        mood: slide.mood || "premium",
        detailedComposition: slide.detailedComposition || DEFAULT_TEMPLATE_ANALYSIS.slides[0].detailedComposition,
      }));

    const analysis: TemplateSetAnalysis = {
      totalSlides: normalizedSlides.length || DEFAULT_TEMPLATE_ANALYSIS.totalSlides,
      overallStyle: parsed.overallStyle || DEFAULT_TEMPLATE_ANALYSIS.overallStyle,
      colorPalette: parsed.colorPalette || DEFAULT_TEMPLATE_ANALYSIS.colorPalette,
      slides: normalizedSlides.length > 0 ? normalizedSlides : DEFAULT_TEMPLATE_ANALYSIS.slides,
    };

    console.log(`[ANALYSIS] ✅ Template set analysis complete: ${analysis.totalSlides} slides detected, style: ${(analysis.overallStyle || "").slice(0, 100)}...`);
    return analysis;
  } catch (error: unknown) {
    console.error("[ANALYSIS] ❌ Template set analysis failed:", error instanceof Error ? error.message : String(error));
    return DEFAULT_TEMPLATE_ANALYSIS;
  }
}
