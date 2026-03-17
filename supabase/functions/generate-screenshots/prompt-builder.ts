import type { SlideLayoutAnalysis, TemplateSetAnalysis } from "./template-analysis.ts";

export const DEVICE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  "iphone-6-5": { width: 1242, height: 2688, label: '6.5" iPhone (1242×2688)' },
  "iphone-6-9": { width: 1320, height: 2868, label: '6.9" iPhone (1320×2868)' },
  "ipad-12-9": { width: 2048, height: 2732, label: '12.9" iPad (2048×2732)' },
};

interface BuildSlidePromptParams {
  slide: {
    slide_number: number;
    headline?: string | null;
    subheadline?: string | null;
    objective?: string | null;
    emphasis?: string | null;
    importance?: string | null;
    total_slides?: number;
  };
  project: {
    app_name?: string | null;
    name?: string | null;
    output_language?: string | null;
    app_description?: string | null;
    config?: Record<string, unknown> | null;
  };
  brandKit: {
    colors?: string[];
    fontFamily?: string;
  };
  templateSetAnalysis: TemplateSetAnalysis | null;
  slideLayout: SlideLayoutAnalysis | null;
  isFirstSlide: boolean;
  totalSlides: number;
  hasPreviousSlides: boolean;
  hasRawScreen: boolean;
  isBeyondTemplate: boolean;
  userFeedback?: string;
  deviceFormats: string[];
}

export function buildSlidePrompt(params: BuildSlidePromptParams): string {
  const {
    slide,
    project,
    brandKit,
    templateSetAnalysis,
    slideLayout,
    isFirstSlide,
    totalSlides,
    hasPreviousSlides,
    hasRawScreen,
    isBeyondTemplate,
    userFeedback,
    deviceFormats: _deviceFormats,
  } = params;

  const config = (project.config as Record<string, unknown>) || {};
  const appName = project.app_name || project.name || "App";

  const brandBlock = [
    brandKit?.colors?.length ? `Brand colors: ${brandKit.colors.join(", ")}` : "",
    brandKit?.fontFamily ? `Brand font: ${brandKit.fontFamily}` : "",
  ].filter(Boolean).join("\n");

  // Base generation is ALWAYS in English. Translation to other languages
  // happens post-generation via the translate-copy edge function.
  const langDirective = "";

  const feedbackBlock = userFeedback
    ? `\n\n=== USER REDESIGN INSTRUCTION (HIGHEST PRIORITY) ===\nYou MUST incorporate the following feedback exactly: "${userFeedback}"\n=== END USER INSTRUCTION ===`
    : "";

  // Always target 6.5" iPhone for base generation — other sizes via resize-slides
  const dims = DEVICE_DIMENSIONS["iphone-6-5"];
  const aspectStr = `9:16 (iPhone portrait — target: ${dims.width}×${dims.height}px)`;

  const appCategory = (config.appCategory as string) || "Not specified";
  const appDescription = (config.appDescription as string) || project.app_description || "";

  if (!isBeyondTemplate && slideLayout && templateSetAnalysis) {
    return `
You are an elite-tier App Store screenshot designer — your work rivals the best studios on Dribbble and Behance.

=== YOUR MISSION ===
IMAGE #1 is a TEMPLATE SET showing ${templateSetAnalysis.totalSlides} slides side by side.
You are generating slide ${slide.slide_number} of ${totalSlides} for a "${appCategory}" app called "${appName}".
Your job: recreate the DESIGN STRUCTURE of SLIDE #${slideLayout.slidePosition} (counting left to right) from the template, but fully adapted to the new app's theme and content.

=== CRITICAL: THEME ADAPTATION ===
The template was designed for a DIFFERENT app. You MUST adapt ALL visual elements to match "${appName}" (${appCategory}):
- DO NOT copy the template's mascots, characters, or brand-specific icons literally
- DO NOT copy the template's background scenery if it's app-specific (e.g., lavender fields for a lifestyle app → replace with weather-themed visuals for a weather app)
- DO adapt decorative elements to match the app's category: ${appCategory}${appDescription ? ` — ${appDescription.slice(0, 150)}` : ""}
- DO keep the template's LAYOUT STRUCTURE (positions, proportions, spacing, visual hierarchy)
- DO keep the template's DESIGN QUALITY (gradient richness, shadow depth, typography style)
- Think of it as: same designer, same skill level, but designing for a completely different app

=== TEMPLATE SET STYLE (design DNA to keep) ===
${templateSetAnalysis.overallStyle}
Color palette: ${templateSetAnalysis.colorPalette}

=== TARGET SLIDE LAYOUT (slide #${slideLayout.slidePosition} from the template) ===
${slideLayout.detailedComposition}

Layout structure to reproduce:
- Device mockup: ${slideLayout.hasDeviceMockup ? `YES — positioned ${slideLayout.devicePosition}, scale ${slideLayout.deviceScale}. Match the EXACT device angle, shadow, and frame style.` : "NO device mockup — DO NOT add one."}
- Text placement: ${slideLayout.textPosition} — match the EXACT position and spacing proportions
- Headline style: ${slideLayout.headlineStyle}, large and impactful
- Background TYPE: ${slideLayout.backgroundType} — keep the same TYPE but adapt the THEME to ${appCategory}
${slideLayout.decorativeElements.length > 0 ? `- Decorative elements in template: ${slideLayout.decorativeElements.join(", ")} — adapt these to ${appCategory}-themed equivalents` : ""}
- 3D elements: ${slideLayout.has3DElements ? `YES — create 3D elements relevant to ${appCategory} (NOT the template's original 3D objects)` : "NO — keep flat/2D"}
${slideLayout.hasMascot ? `- Template has mascot: "${slideLayout.mascotDescription}" — create a NEW mascot/character relevant to ${appCategory} in the SAME position and scale, OR replace with a thematic icon/illustration` : ""}
- Mood: ${slideLayout.mood}

=== APP CONTENT ===
App: "${appName}" | Category: "${appCategory}"
>>> HEADLINE (render EXACTLY): "${slide.headline || ""}" <<<
>>> SUBHEADLINE (render EXACTLY): "${slide.subheadline || ""}" <<<
${brandBlock ? `\n=== BRAND IDENTITY ===\n${brandBlock}` : ""}
Color adaptation: ${brandKit?.colors?.length ? `Use ${brandKit.colors.join(", ")} as primary/accent colors, adapting the template's gradient style and contrast ratios.` : "Create a color palette appropriate for ${appCategory}, inspired by the template's color relationships."}

${hasRawScreen ? `=== RAW APP SCREEN (next image after template) ===
Composite this REAL app screenshot INTO the device frame as-is. Preserve EVERY pixel.` : `=== NO RAW SCREEN ===
${slideLayout.hasDeviceMockup ? "Include a phone mockup with a generic branded screen matching the app's color scheme." : "Focus on headline, subheadline, and background visual energy."}`}

=== SLIDE CONTEXT ===
Slide ${slide.slide_number} of ${totalSlides} | Objective: ${slide.objective || "Feature spotlight"} | Emphasis: ${slide.emphasis || "balanced"} | Format: ${aspectStr}

${!isFirstSlide && hasPreviousSlides ? `=== VISUAL CONTINUITY (CRITICAL) ===
Previously generated slides from THIS SET are attached after the template and raw screen.
- LAYOUT: Follow the template slide #${slideLayout.slidePosition}'s composition (IMAGE #1)
- VISUAL IDENTITY: Match the exact color palette, typography, device frames, background treatment, and lighting from the previously generated slides
- Think of it as: ONE designer, ONE Figma file, ONE session — each slide has a different layout but shares the same visual DNA
` : ""}=== TARGET DISPLAY ===
This screenshot is for an Apple App Store ${dims.label} display.
Target pixel dimensions: ${dims.width} × ${dims.height} pixels.
Design all text, UI elements, and device mockups at a scale appropriate for this exact resolution.
Headlines should be large and readable at this resolution — typically 60-90pt equivalent.

=== QUALITY RULES ===
1. Text pixel-perfect, crisp, perfectly kerned — zero artifacts
2. Render the EXACT headline/subheadline strings — NO placeholders
3. INDISTINGUISHABLE from the template's professional quality
4. Match proportions, spacing, and visual weight from the target template slide
5. Rich backgrounds with proper depth and lighting
6. Photorealistic device frames with proper shadows
${langDirective}${feedbackBlock}

Generate the image now.
`.trim();
  }

  return `
You are an elite-tier App Store screenshot designer — your work rivals the best studios on Dribbble and Behance.

=== YOUR MISSION ===
You are generating slide ${slide.slide_number} of ${totalSlides} for the app "${appName}".
There is NO specific template layout for this slide position — the template set only had ${templateSetAnalysis?.totalSlides || 0} slides.
The previously generated slides (attached) are your PRIMARY VISUAL REFERENCE.
Your job: continue the set with the EXACT same visual DNA — same quality, same style, same attention to detail.
It must be IMPOSSIBLE to tell where the template-based slides end and the continuity slides begin.

${templateSetAnalysis ? `=== SET IDENTITY (from template) ===
${templateSetAnalysis.overallStyle}
Color palette: ${templateSetAnalysis.colorPalette}` : ""}

=== APP CONTENT TO INSERT ===
App name: "${appName}" | Category: "${(config.appCategory as string) || "Not specified"}"
>>> HEADLINE (render EXACTLY): "${slide.headline || ""}" <<<
>>> SUBHEADLINE (render EXACTLY): "${slide.subheadline || ""}" <<<
${brandBlock ? `\n=== BRAND IDENTITY ===\n${brandBlock}` : ""}

${hasRawScreen ? `=== RAW APP SCREEN ===
This is the REAL app screenshot. Composite it INTO the device frame EXACTLY as-is.
- Preserve EVERY pixel — do NOT redesign or modify the UI
- Match the device frame style from previously generated slides` : `=== NO RAW SCREEN ===
Include a phone mockup with a clean branded screen matching the app's color scheme, using the same device frame style as previous slides.`}

=== SLIDE CONTEXT ===
Slide ${slide.slide_number} of ${totalSlides} | Objective: ${slide.objective || "Feature spotlight"} | Emphasis: ${slide.emphasis || "balanced"} | Importance: ${slide.importance || "high"} | Format: ${aspectStr}

=== VISUAL CONTINUITY (THIS IS YOUR #1 PRIORITY) ===
The previously generated slides are attached — they are your ONLY layout reference.
Match EVERYTHING from them:
- Exact color palette, gradient directions, and color ratios
- Typography: same font style, weight, size proportions, kerning
- Device frame: same model, angle, shadow, reflection style
- Background treatment: same gradient type, texture, depth, lighting
- Decorative elements: same floating shapes, particles, or patterns if present
- Spacing: same margins, padding, text-to-device ratios
ONE designer, ONE Figma file, ONE session — this slide must feel like a natural continuation.
${langDirective}${feedbackBlock}

=== TARGET DISPLAY ===
This screenshot is for an Apple App Store ${dims.label} display.
Target pixel dimensions: ${dims.width} × ${dims.height} pixels.
Design all text, UI elements, and device mockups at a scale appropriate for this exact resolution.

=== QUALITY RULES ===
1. Text pixel-perfect, crisp, perfectly kerned — zero artifacts
2. Render the EXACT headline/subheadline strings — NO placeholders
3. INDISTINGUISHABLE from the previously generated slides in style and quality
4. Vary the LAYOUT slightly (different text position, different device angle) to keep the set dynamic
5. Rich backgrounds with proper depth and lighting

Generate the image now. Continue the set seamlessly.`.trim();
}
