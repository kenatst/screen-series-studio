export interface ConsistencyRules {
    level: 'strict' | 'balanced' | 'exploratory';
    brandColors: string[];
    fontFamily?: string;
    tone?: string;
}

/**
 * Build consistency instructions that get injected into every slide prompt.
 * Ensures visual coherence across the entire screenshot set.
 */
export function buildConsistencyBlock(rules: ConsistencyRules, slideNumber: number, totalSlides: number): string {
    const { level, brandColors, fontFamily, tone } = rules;

    const colorPalette = brandColors.length > 0
        ? `Color palette: ${brandColors.join(', ')}. Use these colors consistently.`
        : 'Use a harmonious, professional color palette throughout.';

    const fontRule = fontFamily
        ? `Typography: Use "${fontFamily}" or a visually similar font for all text.`
        : 'Typography: Use a clean, modern sans-serif font consistently.';

    const toneRule = tone
        ? `Visual tone: ${tone}.`
        : '';

    let consistencyDirective = '';

    switch (level) {
        case 'strict':
            consistencyDirective = `
STRICT CONSISTENCY MODE:
- Every slide MUST use the exact same background style, gradient direction, and color scheme.
- Phone mockup placement, size, and shadow style must be identical across slides.
- Text positioning (headline at top, subheadline below) must follow the same grid.
- Badge/label styling must be uniform.
- The overall feel should be as if all slides were designed in a single Figma frame.`;
            break;

        case 'balanced':
            consistencyDirective = `
BALANCED CONSISTENCY MODE:
- Maintain the same color palette and typography across all slides.
- Background style should be cohesive but can have subtle variations (e.g., gradient shifts).
- Phone mockup style should be consistent (same device frame, shadow).
- Layout can vary slightly to match each slide's objective.
- The set should feel unified but not monotonous.`;
            break;

        case 'exploratory':
            consistencyDirective = `
EXPLORATORY MODE:
- Colors and typography should remain loosely related but each slide can explore different layouts.
- The brand identity should be recognizable but creative freedom is encouraged.
- Different background treatments are acceptable.
- The set should feel like a creative collection from the same brand.`;
            break;
    }

    return `
--- CONSISTENCY ENGINE ---
Slide ${slideNumber} of ${totalSlides}.
${colorPalette}
${fontRule}
${toneRule}
${consistencyDirective}
--- END CONSISTENCY ---
`.trim();
}
