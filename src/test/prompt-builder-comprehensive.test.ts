import { describe, expect, it } from "vitest";
import { buildSlidePrompt, DEVICE_DIMENSIONS } from "../../supabase/functions/generate-screenshots/prompt-builder";

const baseSlide = {
  slide_number: 1,
  headline: "Track Your Habits",
  subheadline: "Build better routines daily",
  objective: "Hero",
  emphasis: "visual-impact",
  importance: "high",
};

const baseProject = {
  app_name: "HabitFlow",
  name: "HabitFlow",
  output_language: "en",
  app_description: "A habit tracking app for daily routines",
  config: { appCategory: "Health & Fitness" },
};

const baseBrandKit = {
  colors: ["#FF6B6B", "#4ECDC4"],
  fontFamily: "Poppins",
};

const baseTemplateSetAnalysis = {
  totalSlides: 5,
  overallStyle: "Clean gradient with centered phone mockup",
  colorPalette: "#FF6B6B, #4ECDC4",
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
      decorativeElements: ["floating-shapes"],
      mood: "energetic",
      detailedComposition: "Centered phone with headline at top 15%",
    },
  ],
};

const baseSlideLayout = baseTemplateSetAnalysis.slides[0];

describe("buildSlidePrompt – template-based (isBeyondTemplate=false)", () => {
  it("generates prompt for template-based slide", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: baseSlideLayout,
      isFirstSlide: true,
      totalSlides: 5,
      hasPreviousSlides: false,
      hasRawScreen: true,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("Track Your Habits");
    expect(prompt).toContain("Build better routines daily");
    expect(prompt).toContain("HabitFlow");
    expect(prompt).toContain("Health & Fitness");
    expect(prompt).toContain("#FF6B6B");
    expect(prompt).toContain("Poppins");
    expect(prompt).toContain("LANGUAGE: All text on the screenshot must be in English");
    expect(prompt).toContain("1242 × 2688");
    expect(prompt).toContain("RAW APP SCREEN");
    expect(prompt).toContain("QUALITY RULES");
  });

  it("includes visual continuity section when hasPreviousSlides is true", () => {
    const prompt = buildSlidePrompt({
      slide: { ...baseSlide, slide_number: 3 },
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: baseSlideLayout,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("VISUAL CONTINUITY");
  });

  it("omits visual continuity section for first slide", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: baseSlideLayout,
      isFirstSlide: true,
      totalSlides: 5,
      hasPreviousSlides: false,
      hasRawScreen: true,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).not.toContain("VISUAL CONTINUITY");
  });

  it("handles no raw screen scenario", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: baseSlideLayout,
      isFirstSlide: true,
      totalSlides: 5,
      hasPreviousSlides: false,
      hasRawScreen: false,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("NO RAW SCREEN");
    expect(prompt).not.toContain("Composite this REAL app screenshot");
  });

  it("includes decorative elements when present", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: { ...baseSlideLayout, decorativeElements: ["sparkles", "icons", "gradients"] },
      isFirstSlide: true,
      totalSlides: 5,
      hasPreviousSlides: false,
      hasRawScreen: true,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("sparkles, icons, gradients");
  });

  it("handles mascot in template", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: { ...baseSlideLayout, hasMascot: true, mascotDescription: "A friendly robot" },
      isFirstSlide: true,
      totalSlides: 5,
      hasPreviousSlides: false,
      hasRawScreen: true,
      isBeyondTemplate: false,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("A friendly robot");
  });
});

describe("buildSlidePrompt – beyond template (isBeyondTemplate=true)", () => {
  it("generates continuation prompt", () => {
    const prompt = buildSlidePrompt({
      slide: { ...baseSlide, slide_number: 6 },
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 8,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("NO specific template layout");
    expect(prompt).toContain("VISUAL CONTINUITY");
    expect(prompt).toContain("Track Your Habits");
    expect(prompt).toContain("LANGUAGE: All text on the screenshot must be in English");
  });

  it("handles no raw screen in beyond-template mode", () => {
    const prompt = buildSlidePrompt({
      slide: { ...baseSlide, slide_number: 6 },
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 8,
      hasPreviousSlides: true,
      hasRawScreen: false,
      isBeyondTemplate: true,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("NO RAW SCREEN");
  });
});

describe("buildSlidePrompt – device format variations", () => {
  for (const [format, expectedDims] of Object.entries(DEVICE_DIMENSIONS)) {
    it(`uses correct dimensions for ${format}`, () => {
      const prompt = buildSlidePrompt({
        slide: baseSlide,
        project: baseProject,
        brandKit: baseBrandKit,
        templateSetAnalysis: baseTemplateSetAnalysis,
        slideLayout: null,
        isFirstSlide: false,
        totalSlides: 5,
        hasPreviousSlides: true,
        hasRawScreen: true,
        isBeyondTemplate: true,
        deviceFormats: [format],
      });

      expect(prompt).toContain(`${expectedDims.width} × ${expectedDims.height}`);
      expect(prompt).toContain(expectedDims.label);
    });
  }

  it("defaults to iPhone 6.5\" for unknown format", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      deviceFormats: ["unknown-format"],
    });

    expect(prompt).toContain("1242 × 2688");
  });
});

describe("buildSlidePrompt – user feedback injection", () => {
  it("includes user feedback with high priority marker", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      userFeedback: "Make the text bigger and change color to blue",
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("USER REDESIGN INSTRUCTION (HIGHEST PRIORITY)");
    expect(prompt).toContain("Make the text bigger and change color to blue");
  });

  it("omits feedback section when no feedback provided", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: baseBrandKit,
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).not.toContain("USER REDESIGN INSTRUCTION");
  });
});

describe("buildSlidePrompt – brand kit variations", () => {
  it("handles empty brand kit", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: {},
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).not.toContain("Brand colors:");
    expect(prompt).not.toContain("Brand font:");
  });

  it("includes multiple brand colors", () => {
    const prompt = buildSlidePrompt({
      slide: baseSlide,
      project: baseProject,
      brandKit: { colors: ["#FF0000", "#00FF00", "#0000FF"] },
      templateSetAnalysis: baseTemplateSetAnalysis,
      slideLayout: null,
      isFirstSlide: false,
      totalSlides: 5,
      hasPreviousSlides: true,
      hasRawScreen: true,
      isBeyondTemplate: true,
      deviceFormats: ["iphone-6-5"],
    });

    expect(prompt).toContain("#FF0000, #00FF00, #0000FF");
  });
});
