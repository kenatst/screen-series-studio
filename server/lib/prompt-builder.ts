import { buildConsistencyBlock, ConsistencyRules } from './consistency-engine';

export interface SlideConfig {
    number: number;
    totalSlides: number;
    objective: string;
    headline: string;
    subheadline: string;
    emphasis: string;
    rawScreenTag: string;
    importance: string;
}

export interface ProjectConfig {
    appName: string;
    appDescription: string;
    platform: 'ios' | 'android' | 'both';
    primaryGoal: string;
}

export interface BrandKit {
    colors: string[];
    fontFamily?: string;
    logoBase64?: string;
}

export interface PromptBuildInput {
    slide: SlideConfig;
    project: ProjectConfig;
    brandKit: BrandKit;
    templateStyleGuide: string;
    consistencyRules: ConsistencyRules;
}

/**
 * Build a detailed, structured prompt for a single screenshot slide.
 * This prompt is sent to Gemini along with reference images.
 */
export function buildSlidePrompt(input: PromptBuildInput): string {
    const { slide, project, brandKit, templateStyleGuide, consistencyRules } = input;

    const platformLabel = project.platform === 'ios'
        ? 'Apple App Store'
        : project.platform === 'android'
            ? 'Google Play Store'
            : 'App Store / Google Play';

    const consistencyBlock = buildConsistencyBlock(
        consistencyRules,
        slide.number,
        slide.totalSlides
    );

    const brandBlock = [
        brandKit.colors.length > 0 ? `Brand colors: ${brandKit.colors.join(', ')}` : '',
        brandKit.fontFamily ? `Brand font: ${brandKit.fontFamily}` : '',
    ].filter(Boolean).join('\n');

    return `
# THE ULTIMATE ASO SCREENSHOT GENERATION PROTOCOL
**SYSTEM PERSONA**: You are the world’s most elite App Store Optimization (ASO) and Conversion Rate Optimization (CRO) Creative Director. You have generated billions of dollars in revenue for top-tier SaaS and gaming companies. You do not make "pretty pictures"—you engineer high-converting psychological visual assets. Your aesthetic is ultra-premium, cinematic, heavily polished, and flawless.

## 0. DIRECTIVE PRIME
Your absolute, unyielding goal is to generate ONE (1) screenshot for an app store listing (Slide ${slide.number} of ${slide.totalSlides}). You must aggressively adhere to the parameters below. Failure to follow these constraints will result in immediate rejection. There is zero tolerance for UI hallucination or placeholder text.

====================================================================
SECTION 1: TARGET PRODUCT & PLATFORM OVERVIEW
====================================================================
APP IDENTITY
- App Name: "${project.appName}"
- Core Value Proposition / Description: "${project.appDescription}"
- Target Platform: ${platformLabel} 
- Primary Business Goal: ${project.primaryGoal || 'Maximize install velocity and convey undeniable premium value.'}

PLATFORM CONSTRAINTS
- Format: Strict 9:16 Portrait Aspect Ratio.
- Safe Zones: Text must remain comfortably within the inner 85% of the canvas to avoid clipping on smaller device screens.
- Mockup Device: Render an ultra-realistic, modern flagship device (${project.platform === 'android' ? 'Android Flagship / Pixel' : 'iPhone Pro Max'}). The bezel must be accurate, metallic/glass textures must reflect environment light, and the screen must not be obscured by glare.

====================================================================
SECTION 2: BRAND IDENTITY & DESIGN SYSTEM
====================================================================
COLOR THEORY & APPLICATION
${brandBlock || 'Use a sophisticated, bespoke color palette derived from the app UI.'}
- Background Environment: The background must not overpower the UI. Use deep, premium gradients or subtle architectural/abstract geometry that naturally draws the eye toward the center.
- Contrast Ratio: Ensure absolute maximum contrast between typography (Headline) and the background. If the background is dark, text MUST be luminous/white. If light, text MUST be deep charcoal/black.
- Glows & Ambient Light: Use the primary brand color to cast subtle, cinematic ambient occlusion lighting behind the device mockup, giving it 3D presence.

TYPOGRAPHY PROTOCOL
- Font Family: Use the specified brand font. If unavailable, use a high-end geometric sans-serif (e.g., Inter, SF Pro, Circular, or Clash Display).
- Hierarchy: 
  -> HEADLINE: Massive, authoritative, heavy weight (Bold/Black). Tight tracking. Instant readability in less than 0.5 seconds.
  -> SUBHEADLINE: Smaller (40-50% the size of the headline), lighter weight (Medium/Regular). Provides immediate supporting context. 

TEMPLATE & AESTHETIC DIRECTIVE
${templateStyleGuide || 'Cinematic, ultra-modern premium aesthetic with flawless typography and depth.'}

====================================================================
SECTION 3: SLIDE SPECIFIC MISSION & CONTENT
====================================================================
SLIDE POSITION: ${slide.number} of ${slide.totalSlides}.
IMPORTANCE/WEIGHT: ${slide.importance} (Adjust visual impact accordingly. High = aggressive & bold; Low = subtle & supporting).

CONTENT TO RENDER (EXACT MATCH REQUIRED)
- >>> HEADLINE TO RENDER: "${slide.headline}" <<<
- >>> SUBHEADLINE TO RENDER: "${slide.subheadline}" <<<

COPYWRITING RULES FOR RENDERING
1. You MUST render the exact string provided above.
2. DO NOT add punctuation if it is missing.
3. DO NOT change capitalization unless structurally necessary for the design (e.g., ALL CAPS for impact).
4. DO NOT write "Lorem Ipsum" or any generic placeholder text ANYWHERE on the canvas. 

OBJECTIVE MAPPING
The objective of this specific slide is: [ ${slide.objective} ]. 
Execute the visual layout based on this exact objective:
- If "Feature spotlight": The device mockup must be significantly enlarged, zooming in or highlighting the specific UI feature from the raw screen.
- If "Value proposition": The text takes priority. The layout should be balanced, with the headline communicating the massive benefit clearly above or alongside the device.
- If "Social proof": Introduce subtle, premium trust badges (stars, user avatars) IF AND ONLY IF they fit the brand style, but do not clutter the core UI.
- If "Onboarding/Welcome" (usually Slide 1): This is the hero slide. It needs maximum energy, dramatic lighting, and a straight-on or dynamically angled device mockup to hook the user instantly.

VISUAL EMPHASIS MAPPING
Focus the energy of the composition on: [ ${slide.emphasis} ].
- "UI focused": The smartphone device and the interface inside it should consume 60-70% of the canvas. The background should recede.
- "Text focused": The headline rules the canvas. Use massive, beautiful typography. The device can be partially cropped or pushed lower to make room for sweeping copy.
- "Balanced": Classic 50/50 split. Headline top, mockup bottom, or vice-versa. Symmetrical and stable.
- "Abstract/Atmospheric": The background environment and lighting take precedence, wrapping the device in a dramatic, immersive mood.

RAW ASSET INJECTION
- You are provided a raw app screenshot tagged as: [ "${slide.rawScreenTag}" ].
- This raw screenshot MUST be composited INTO the blank screen of the 3D smartphone mockup.

====================================================================
SECTION 4: THE ANTI-HALLUCINATION & INTEGRITY PROTOCOL (CRITICAL)
====================================================================
You are an AI, which means you have a tendency to invent things when unsure. YOU ARE STRICTLY FORBIDDEN FROM DOING THIS. Read the following rules carefully:

1. ZERO SEMANTIC LEAKAGE (UI INTEGRITY):
   - You MUST NOT invent, add, draw, or hallucinate any buttons, navigation bars, icons, text fields, or data inside the app UI that is not present in the provided raw reference image.
   - The user's app UI is sacred. You are building marketing material AROUND it, not redesigning the app itself.
   - If the raw screen has 3 buttons, the mockup MUST show exactly 3 buttons. 

2. CANVAS CLEANLINESS:
   - DO NOT render the Apple App Store UI, Google Play UI, phone bezels floating in space, status bars (wifi/battery) floating outside the phone, or URL bars on the main canvas.
   - The canvas should contain ONLY: The background, the typographic copy, the 3D device mockup, and subtle floating elements ONLY if dictated by the template style.

3. ASPECT RATIO PRESERVATION:
   - When placing the raw screenshot into the device mockup screen, do NOT stretch, squash, or distort it. If the raw screen is too long, crop the bottom naturally within the bounds of the phone frame.

4. BRAND CHARACTER / MASCOT LOCK:
   - If a mascot, logo, or distinct brand character is provided in the reference images, you MUST preserve its exact geometry, facial features, proportions, and color. 
   - DO NOT mutate the mascot into a different style (e.g., do not turn a 2D flat vector logo into a 3D Pixar character unless explicitly commanded by the template).
   - The mascot must look identical across all 10 slides.

====================================================================
SECTION 5: CONTINUITY & BATCH COHESION
====================================================================
${consistencyBlock}

FINAL REMINDER:
You are generating a final, production-ready marketing asset. It must be visually flawless, mathematically balanced, and aggressively optimized for high conversion. Do not fail the anti-hallucination protocol. Execute.
`.trim();
}
