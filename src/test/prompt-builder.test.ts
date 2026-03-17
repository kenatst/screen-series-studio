import { describe, expect, it } from "vitest";
import { buildSlidePrompt } from "../../supabase/functions/generate-screenshots/prompt-builder";

describe("buildSlidePrompt", () => {
  it("injects language and feedback directives", () => {
    const prompt = buildSlidePrompt({
      slide: {
        slide_number: 4,
        headline: "Track every expense",
        subheadline: "Stay in control",
      },
      project: {
        app_name: "FinanceFlow",
        name: "FinanceFlow",
        output_language: "fr",
        config: { appCategory: "Business" },
      },
      brandKit: {
        colors: ["#111111", "#22cc88"],
        fontFamily: "Inter",
      },
      templateSetAnalysis: {
        totalSlides: 3,
        overallStyle: "Dark premium gradient",
        colorPalette: "#111111, #22cc88",
        slides: [],
      },
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 6,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      userFeedback: "Move headline higher",
      deviceFormats: ["iphone-6-9"],
    });

    expect(prompt).toContain("LANGUAGE: All text on the screenshot");
    expect(prompt).toContain("Move headline higher");
    expect(prompt).toContain("1320 × 2868");
    expect(prompt).toContain("Track every expense");
  });
});
