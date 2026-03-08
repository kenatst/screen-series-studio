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
You are an expert ${platformLabel} screenshot designer creating premium, conversion-optimized marketing screenshots.

=== APP INFO ===
App: ${project.appName}
Description: ${project.appDescription}
Platform: ${platformLabel}
Primary goal: ${project.primaryGoal || 'Drive downloads and conversions'}

=== BRAND KIT ===
${brandBlock || 'Use a professional, premium color palette.'}

=== TEMPLATE STYLE ===
${templateStyleGuide || 'Premium gradient style with clean typography and subtle shadows.'}

=== SLIDE ${slide.number} OF ${slide.totalSlides} ===
Objective: ${slide.objective}
Headline text: "${slide.headline}"
Subheadline text: "${slide.subheadline}"
Visual emphasis: ${slide.emphasis}
Raw app screen to include: ${slide.rawScreenTag}
Importance: ${slide.importance}

=== INSTRUCTIONS ===
Generate a polished, premium ${platformLabel} screenshot in 9:16 portrait format.

Key requirements:
1. The headline "${slide.headline}" must be prominently displayed as large, bold text.
2. The subheadline "${slide.subheadline}" should appear below the headline in a smaller, lighter weight.
3. Include a realistic phone mockup (${project.platform === 'android' ? 'Android device' : 'iPhone'}) showing the app's "${slide.rawScreenTag}" screen.
4. The visual emphasis should be: ${slide.emphasis}.
5. The background must match the template style provided.
6. The overall design should feel premium, polished, and conversion-focused.

=== QUALITY METRICS & SEMANTIC PRESERVATION (CRITICAL) ===
7. PREVENT SEMANTIC LEAKAGE: Do NOT invent, hallucinate, or insert UI elements, features, or text that are not present in the provided raw App Screen. The core app UI must be preserved faithfully.
8. BRAND & MASCOT CONSISTENCY: If a mascot, logo, or distinct brand character is provided in the references, its exact visual identity (colors, proportions, style) MUST be strictly preserved across all slides. Do not mutate the character.
9. EXACT COMPOSITING: If a raw app screenshot is provided as a reference, composite it INTO the phone mockup screen naturally without distorting its aspect ratio.
10. CLEAN OUTPUT: Do NOT include any App Store UI chrome, status bars outside the mockup, or store branding on the canvas.

${consistencyBlock}
`.trim();
}
