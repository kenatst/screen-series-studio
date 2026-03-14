import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const CREDIT_COST_PER_SLIDE = 1;
const QUALITY_SCORE_MIN = 78;

// ── Template metadata (mirrors frontend demoTemplates) ──
const TEMPLATE_CATALOG: Record<string, {
  tags: string[];
  tone: string;
  mood: string;
  bestFor: string;
  complexity: string;
  conversionAngle: string;
  category: string;
  layoutDescription: string;
}> = {
  "habit-tracker": { tags: ["minimal", "professional", "clean"], tone: "corporate", mood: "light", bestFor: "Productivity, habit apps", complexity: "simple", conversionAngle: "Trust & clarity", category: "Lifestyle", layoutDescription: "Clean white background with soft rounded cards, progress rings, and a centered phone mockup. Minimal text with generous whitespace. Pastel accent colors." },
  "ai-coach": { tags: ["vibrant", "energetic", "dynamic"], tone: "bold", mood: "dark", bestFor: "Coaching, fitness apps", complexity: "medium", conversionAngle: "Motivation", category: "Entertainment", layoutDescription: "Dark gradient background with neon accent glows. Bold typography with strong contrast. Phone angled dynamically with energy lines or particles." },
  "map-explorer": { tags: ["clean", "geographic", "social"], tone: "minimalist", mood: "light", bestFor: "Travel, maps, social apps", complexity: "medium", conversionAngle: "Discovery", category: "Lifestyle", layoutDescription: "Light airy background with map-like subtle patterns. Phone showing map UI with pin markers. Clean sans-serif typography with earth-tone accents." },
  "subscription-manager": { tags: ["premium", "gradient", "sleek"], tone: "premium", mood: "dark", bestFor: "Finance, subscription apps", complexity: "complex", conversionAngle: "Cost savings", category: "Business", layoutDescription: "Deep dark gradient (navy to black) with glassmorphism cards. Premium metallic phone frame. Sophisticated typography with gold/purple accents. Data visualizations visible." },
  "hydration": { tags: ["playful", "colorful", "friendly"], tone: "playful", mood: "colorful", bestFor: "Health, wellness apps", complexity: "simple", conversionAngle: "Fun & health", category: "Lifestyle", layoutDescription: "Bright colorful background with water/liquid-themed illustrations. Rounded friendly UI elements. Playful bouncy typography with blue/cyan dominant palette." },
  "sugar-free": { tags: ["organic", "warm", "aspirational"], tone: "minimalist", mood: "light", bestFor: "Diet, nutrition apps", complexity: "simple", conversionAngle: "Lifestyle change", category: "Lifestyle", layoutDescription: "Warm cream/beige background with organic shapes. Food photography integration. Elegant serif + sans-serif type pairing. Natural green accents." },
  "aura-mood": { tags: ["luxury", "minimal", "elegant"], tone: "premium", mood: "dark", bestFor: "Meditation, mindfulness", complexity: "simple", conversionAngle: "Inner peace", category: "Luxury", layoutDescription: "Deep purple/indigo gradient with soft aurora borealis effects. Centered phone with meditation UI. Thin elegant typography. Ambient glow effects around device." },
  "scribe-notes": { tags: ["structured", "feature-focused", "clear"], tone: "corporate", mood: "light", bestFor: "Note-taking, productivity", complexity: "medium", conversionAngle: "Feature showcase", category: "Business", layoutDescription: "Clean white/light gray background with structured grid layout. Multiple UI callouts pointing to specific features. Professional sans-serif type. Blue/gray accent palette." },
  "personal-trainer": { tags: ["bold", "energetic", "dynamic"], tone: "bold", mood: "dark", bestFor: "Fitness, workout apps", complexity: "complex", conversionAngle: "Transformation", category: "Entertainment", layoutDescription: "High-contrast dark background with fiery orange/red accents. Athletic photography integration. Bold condensed uppercase headlines. Phone showing workout stats with dynamic angle." },
  "stackr-finance": { tags: ["premium", "gradient", "data-driven"], tone: "premium", mood: "dark", bestFor: "Fintech, investment apps", complexity: "complex", conversionAngle: "Financial growth", category: "Business", layoutDescription: "Dark navy/charcoal gradient with green accent for gains. Data charts and financial graphs visible in UI. Premium metallic device frame. Clean monospace numbers mixed with sans-serif headlines." },
  "trainer-ai": { tags: ["futuristic", "bold", "tech"], tone: "bold", mood: "dark", bestFor: "AI-powered fitness", complexity: "complex", conversionAngle: "Smart training", category: "Entertainment", layoutDescription: "Futuristic dark background with circuit/AI-themed subtle patterns. Neon cyan/electric blue accents. Bold geometric typography. Phone showing AI-generated workout plans." },
  "stackr-yellow": { tags: ["vibrant", "modern", "bold"], tone: "bold", mood: "colorful", bestFor: "Finance, crypto apps", complexity: "medium", conversionAngle: "Bold positioning", category: "Business", layoutDescription: "Vibrant yellow/gold dominant palette on dark background. Strong geometric shapes. Ultra-bold sans-serif headlines. High energy composition with crypto/finance UI." },
  "vow-couples": { tags: ["romantic", "warm", "elegant"], tone: "premium", mood: "light", bestFor: "Dating, relationship apps", complexity: "medium", conversionAngle: "Emotional connection", category: "Lifestyle", layoutDescription: "Soft pink/rose gradient background with gentle blur effects. Romantic warm lighting. Elegant script + sans-serif type pairing. Heart-shaped elements subtly integrated." },
  "rpg-gaming": { tags: ["gaming", "immersive", "dramatic"], tone: "bold", mood: "dark", bestFor: "Games, RPG apps", complexity: "complex", conversionAngle: "Excitement & adventure", category: "Entertainment", layoutDescription: "Epic dark fantasy background with dramatic lighting. Game UI elements (health bars, inventory). Bold fantasy-inspired typography. Phone showing immersive game world." },
  "cram-study": { tags: ["playful", "educational", "colorful"], tone: "playful", mood: "colorful", bestFor: "Study, flashcard apps", complexity: "medium", conversionAngle: "Learning made easy", category: "Education", layoutDescription: "Bright multi-color background with stacked card/flashcard motifs. Friendly rounded typography. Emoji and icon accents. Phone showing study interface with progress indicators." },
  "adblock-shield": { tags: ["tech", "minimal", "powerful"], tone: "corporate", mood: "dark", bestFor: "Utility, security apps", complexity: "simple", conversionAngle: "Protection", category: "Business", layoutDescription: "Dark background with shield/security iconography. Minimal layout with centered phone. Strong blue/green accent for 'protected' status. Clean corporate typography." },
  "drift-meditation": { tags: ["calm", "minimal", "serene"], tone: "minimalist", mood: "dark", bestFor: "Meditation, sleep apps", complexity: "simple", conversionAngle: "Relaxation", category: "Luxury", layoutDescription: "Deep navy/midnight blue gradient with soft star-like particles. Ultra-minimal layout. Thin light typography. Phone showing calming meditation timer UI. Ambient soft glow." },
  "life-coaching": { tags: ["professional", "warm", "inspiring"], tone: "corporate", mood: "light", bestFor: "Coaching, self-improvement", complexity: "medium", conversionAngle: "Personal growth", category: "Education", layoutDescription: "Warm white/cream background with subtle geometric patterns. Professional but approachable typography. Orange/amber accent colors. Phone showing coaching dashboard with progress." },
  "tape-recorder": { tags: ["retro", "creative", "unique"], tone: "bold", mood: "dark", bestFor: "Audio, music apps", complexity: "medium", conversionAngle: "Nostalgia & creativity", category: "Media", layoutDescription: "Retro-inspired dark background with cassette tape/vinyl textures. Vintage color palette (amber, brown, cream). Retro-modern typography mix. Phone showing audio waveform UI." },
  "solo-travel": { tags: ["adventurous", "organic", "free"], tone: "minimalist", mood: "light", bestFor: "Travel, adventure apps", complexity: "medium", conversionAngle: "Freedom & discovery", category: "Lifestyle", layoutDescription: "Light background with travel photography integration (mountains, beaches). Organic hand-drawn accent elements. Clean modern typography. Phone showing itinerary/map UI." },
  "minddrop-journal": { tags: ["calm", "minimal", "thoughtful"], tone: "minimalist", mood: "neutral", bestFor: "Journaling, mental health", complexity: "simple", conversionAngle: "Self-reflection", category: "Lifestyle", layoutDescription: "Soft neutral background (warm gray/beige). Minimal centered layout with generous margins. Thoughtful serif headlines. Phone showing journaling interface with clean typography." },
  "meal-planner": { tags: ["fresh", "colorful", "friendly"], tone: "playful", mood: "colorful", bestFor: "Meal prep, recipe apps", complexity: "medium", conversionAngle: "Healthy lifestyle", category: "Lifestyle", layoutDescription: "Bright fresh background with food photography accents. Green/orange vibrant palette. Friendly rounded sans-serif type. Phone showing recipe cards and meal calendar UI." },
  "vault-security": { tags: ["dark", "premium", "secure"], tone: "premium", mood: "dark", bestFor: "Password, security apps", complexity: "medium", conversionAngle: "Trust & safety", category: "Business", layoutDescription: "Ultra-dark background with vault/lock iconography. Green/cyan matrix-like accent colors. Strong bold typography. Phone showing encrypted password vault UI with biometric elements." },
  "linguaflow": { tags: ["playful", "educational", "colorful"], tone: "playful", mood: "colorful", bestFor: "Language learning apps", complexity: "medium", conversionAngle: "Fun learning", category: "Education", layoutDescription: "Colorful gradient background with flag/language-themed elements. Playful rounded typography with multiple script samples. Phone showing lesson interface with progress streaks." },
  "nestle-wellness": { tags: ["organic", "clean", "premium"], tone: "corporate", mood: "light", bestFor: "Health, corporate wellness", complexity: "simple", conversionAngle: "Trusted brand", category: "Lifestyle", layoutDescription: "Clean white background with subtle green organic accents. Premium corporate photography style. Elegant sans-serif typography. Phone showing health dashboard with clean data visualization." },
  "lifeplan-goals": { tags: ["structured", "motivating", "clear"], tone: "corporate", mood: "neutral", bestFor: "Goal tracking, planning", complexity: "medium", conversionAngle: "Achievement", category: "Business", layoutDescription: "Neutral gray/white background with structured grid layout. Motivational accent colors (orange, teal). Clear hierarchical typography. Phone showing goal tracker with progress bars and milestones." },
};

function getTemplateStyle(templateId: string): string {
  const key = (templateId || "").toLowerCase().replace(/\s+/g, "-");
  const tmpl = TEMPLATE_CATALOG[key];
  if (!tmpl) return "";

  return `
====================================================================
SECTION 6: TEMPLATE STYLE DIRECTIVE (CRITICAL — FOLLOW THIS EXACTLY)
====================================================================
You have been assigned the "${templateId}" template. You MUST replicate its exact aesthetic:

VISUAL DNA:
- Style Tags: ${tmpl.tags.join(", ")}
- Tone: ${tmpl.tone}
- Mood: ${tmpl.mood}
- Category: ${tmpl.category}
- Complexity: ${tmpl.complexity}
- Conversion Angle: ${tmpl.conversionAngle}
- Best suited for: ${tmpl.bestFor}

LAYOUT & COMPOSITION BLUEPRINT:
${tmpl.layoutDescription}

MANDATORY RULES:
1. Your background, color palette, typography weight, and overall mood MUST match the description above.
2. The phone mockup placement, angle, and framing MUST be consistent with the template's complexity level.
3. DO NOT default to a generic "big title + tilted phone" layout. Each template has a UNIQUE composition — follow it.
4. If the template mood is "dark", use a dark background. If "light", use a light background. If "colorful", use vibrant multi-color elements.
5. The tone defines typography: "bold" = heavy condensed type; "minimalist" = thin elegant type; "playful" = rounded friendly type; "premium" = sophisticated serif + sans-serif; "corporate" = clean professional sans-serif.
6. Match the ENERGY level: simple templates = calm & spacious; complex templates = rich & detailed.
====================================================================`;
}

function buildConsistencyBlock(
  level: string,
  brandColors: string[],
  fontFamily: string | undefined,
  slideNumber: number,
  totalSlides: number
): string {
  const colorPalette = brandColors.length > 0
    ? `Color palette: ${brandColors.join(", ")}. Use these colors consistently.`
    : "Use a harmonious, professional color palette throughout.";
  const fontRule = fontFamily
    ? `Typography: Use "${fontFamily}" or a visually similar font for all text.`
    : "Typography: Use a clean, modern sans-serif font consistently.";

  let directive = "";
  if (level === "strict") {
    directive = `STRICT CONSISTENCY MODE (MAXIMUM UNIFORMITY):
- This is a unified set. Every single slide MUST use the EXACT SAME background: same color hex, same gradient angle, same texture.
- The 3D smartphone mockup MUST be the same model, same color, and same position/angle in every slide.
- Typography MUST be identical in font-family, weight, and position across all slides.
- The overall composition should feel like a single continuous canvas divided into slides. Zero variation in style allowed.`;
  } else if (level === "balanced") {
    directive = `BALANCED CONSISTENCY MODE (COHESIVE VARIATION):
- Maintain a strictly unified color palette and typography system.
- Background style should be fundamentally the same but can have subtle variations in lighting or secondary abstract elements to match the slide objective.
- The smartphone mockup style (model/frame) must be consistent, but the angle can vary slightly (e.g., straight-on for hero, tilted for feature).
- Overall look: A professional, branded collection.`;
  } else {
    directive = `EXPLORATORY MODE (CREATIVE FREEDOM):
- Use the brand colors and typography as the core anchor.
- Each slide is encouraged to explore unique layouts and background treatments while remaining recognizable as part of the same brand.
- Dynamic angles, varying depths of field, and expressive compositions are allowed.`;
  }

  return `--- CONSISTENCY ENGINE ---
Slide ${slideNumber} of ${totalSlides}.
${colorPalette}
${fontRule}
${directive}
--- END CONSISTENCY ---`;
}

function buildSlidePrompt(
  slide: any,
  project: any,
  brandKit: any,
  consistencyLevel: string,
  userPrompt?: string
): string {
  const platformLabel =
    project.platform === "ios"
      ? "Apple App Store"
      : project.platform === "android"
        ? "Google Play Store"
        : "App Store / Google Play";

  const brandBlock = [
    brandKit?.colors?.length > 0 ? `Brand colors: ${brandKit.colors.join(", ")}` : "",
    brandKit?.fontFamily ? `Brand font: ${brandKit.fontFamily}` : "",
  ].filter(Boolean).join("\n");

  const consistency = buildConsistencyBlock(
    consistencyLevel || "balanced",
    brandKit?.colors || [],
    brandKit?.fontFamily,
    slide.slide_number,
    slide.total_slides || 5
  );

  const templateStyle = getTemplateStyle(project.template_id || "");

  const userDirective = userPrompt
    ? `\n\n=== USER DIRECTION ===\nThe user has specifically requested: "${userPrompt}"\nApply this direction while maintaining brand consistency and quality standards.\n=== END USER DIRECTION ===`
    : "";

  const outputLang = project.output_language || (project.config as any)?.outputLanguage || "en";
  const langDirective = outputLang !== "en"
    ? `\n=== LANGUAGE ===\nAll text on the screenshot (headline, subheadline) MUST be written in ${outputLang}. The provided headline and subheadline are already in the target language — reproduce them EXACTLY as given.\n=== END LANGUAGE ===`
    : "";

  return `# THE ULTIMATE ASO SCREENSHOT GENERATION PROTOCOL
**SYSTEM PERSONA**: You are the world's most elite App Store Optimization (ASO) and Conversion Rate Optimization (CRO) Creative Director. You have generated billions of dollars in revenue for top-tier SaaS and gaming companies. You do not make "pretty pictures"—you engineer high-converting psychological visual assets. Your aesthetic is ultra-premium, cinematic, heavily polished, and flawless.

## 0. DIRECTIVE PRIME
Your absolute, unyielding goal is to generate ONE (1) screenshot for an app store listing (Slide ${slide.slide_number} of ${slide.total_slides || 10}). You must aggressively adhere to the parameters below. Failure to follow these constraints will result in immediate rejection. There is zero tolerance for UI hallucination or placeholder text.

====================================================================
SECTION 1: TARGET PRODUCT & PLATFORM OVERVIEW
====================================================================
APP IDENTITY
- App Name: "${project.app_name || project.name}"
- Category: "${(project.config as any)?.appCategory || "Not specified"}"
- Target Audience: "${(project.config as any)?.targetAudience || "Not specified"}"
- Core Value Proposition: "${(project.config as any)?.valueProposition || ""}"
- Description (Long): "${project.app_description || ""}"
- Description (Short): "${(project.config as any)?.shortDescription || ""}"
- Key Features: ${(project.config as any)?.keyFeatures?.join(", ") || "Automatic detection from UI"}
- Top Benefits: ${(project.config as any)?.topBenefits?.join(", ") || "Automatic detection from visual benefit"}
- Target Platform: ${platformLabel} 
- Primary Business Goal: ${(project.config as any)?.primaryGoal || "Maximize install velocity and convey undeniable premium value."}

PLATFORM CONSTRAINTS
- Format: Strict 9:16 Portrait Aspect Ratio.
- Safe Zones: Text must remain comfortably within the inner 85% of the canvas to avoid clipping on smaller device screens.
- Mockup Device: Render an ultra-realistic, modern flagship device. The bezel must be accurate, metallic/glass textures must reflect environment light, and the screen must not be obscured by glare.

====================================================================
SECTION 2: BRAND IDENTITY & DESIGN SYSTEM
====================================================================
COLOR THEORY & APPLICATION
${brandBlock || "Use a sophisticated, bespoke color palette derived from the app UI."}
- Background Environment: The background must not overpower the UI. Use deep, premium gradients or subtle architectural/abstract geometry that naturally draws the eye toward the center.
- Contrast Ratio: Ensure absolute maximum contrast between typography (Headline) and the background. If the background is dark, text MUST be luminous/white. If light, text MUST be deep charcoal/black.
- Glows & Ambient Light: Use the primary brand color to cast subtle, cinematic ambient occlusion lighting behind the device mockup, giving it 3D presence.

TYPOGRAPHY PROTOCOL
- Font Family: Use the specified brand font. If unavailable, use a high-end geometric sans-serif (e.g., Inter, SF Pro, Circular, or Clash Display).
- Hierarchy: 
  -> HEADLINE: Massive, authoritative, heavy weight (Bold/Black). Tight tracking. Instant readability in less than 0.5 seconds.
  -> SUBHEADLINE: Smaller (40-50% the size of the headline), lighter weight (Medium/Regular). Provides immediate supporting context. 

====================================================================
SECTION 3: SLIDE SPECIFIC MISSION & CONTENT
====================================================================
SLIDE POSITION: ${slide.slide_number} of ${slide.total_slides || 10}.
IMPORTANCE/WEIGHT: ${slide.importance || "high"} (Adjust visual impact accordingly. High = aggressive & bold; Low = subtle & supporting).

CONTENT TO RENDER (EXACT MATCH REQUIRED)
- >>> HEADLINE TO RENDER: "${slide.headline || ""}" <<<
- >>> SUBHEADLINE TO RENDER: "${slide.subheadline || ""}" <<<

COPYWRITING RULES FOR RENDERING
1. You MUST render the exact string provided above.
2. DO NOT add punctuation if it is missing.
3. DO NOT change capitalization unless structurally necessary for the design (e.g., ALL CAPS for impact).
4. DO NOT write "Lorem Ipsum" or any generic placeholder text ANYWHERE on the canvas. 

OBJECTIVE MAPPING
The objective of this specific slide is: [ ${slide.objective || "Feature spotlight"} ]. 
Execute the visual layout based on this exact objective:
- If "Hero / first impression": This is the hero slide. Maximum energy, dramatic lighting, device mockup centered or dynamically angled (e.g., 15-degree tilt) to hook the user instantly.
- If "Core benefit": Highlight the single most important value. The layout should be balanced with the headline clearly communicating the benefit.
- If "Feature spotlight": Focus on one specific UI capability. The device mockup must be significantly enlarged, zooming in on that feature.
- If "Social proof": Introduce subtle, premium trust badges (stars, user avatars, "Used by 1M+" labels) if they fit the brand style.
- If "Ease of use": Clean, spacious layout showing the simple UI flow. Minimal clutter, focus on intuitive navigation.
- If "Transformation / before-after": Split or comparison layout showing the "before" (pain point) vs "after" (solution with app).
- If "Emotional benefit": Atmospheric, mood-driven composition with cinematic lighting and soft focus backgrounds.
- If "Productivity gain": Focus on speed and efficiency visuals. Numbers or checkboxes can be highlighted.
- If "Learning outcome": Educational feel. Clear, structured information presentation.
- If "Trust / credibility": Solid, secure feel. Use lock icons or security-related visual metaphors.
- If "Premium feel": Ultra-minimal, high-end aesthetic. Large margins, elegant typography, luxury materials in backdrop.
- If "Gamification": Energetic, fun elements like coins, sparks, or progress bars with glow effects.
- If "CTA-like closing slide": Strong call-to-action. Bold typography, app icon integration, and a clear visual cue to download.
- If "Value proposition": Direct and authoritative. The text takes priority over the mockup.

VISUAL EMPHASIS MAPPING
Focus the energy of the composition on: [ ${slide.emphasis || "UI focused"} ].
- "UI focused": The smartphone device and the interface inside it should consume 60-70% of the canvas. The background should recede.
- "text focused": The headline rules the canvas. Use massive, beautiful typography. The device can be partially cropped or pushed lower to make room for sweeping copy.
- "balanced": Classic 50/50 split. Headline top, mockup bottom, or vice-versa. Symmetrical and stable.
- "cinematic background": The background environment and lighting take precedence, wrapping the device in a dramatic, immersive mood.
- "clean product showcase": Device mockup front and center, straight-on angle, minimal decorations. Let the product speak.
- "mascot focused": If a mascot/character is provided, it should be prominent alongside the device.
- "icon-driven": Use icons and visual elements to communicate features instead of heavy text.

RAW ASSET INJECTION
- You are provided a raw app screenshot tagged as: [ "${slide.raw_screen_tag || "home"}" ].
- This raw screenshot MUST be composited INTO the blank screen of the 3D smartphone mockup.

====================================================================
SECTION 4: THE ANTI-HALLUCINATION & INTEGRITY PROTOCOL (CRITICAL)
====================================================================
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
   - DO NOT mutate the mascot into a different style.
   - The mascot must look identical across all slides.

====================================================================
SECTION 5: CONTINUITY & BATCH COHESION (THE CONSISTENCY ENGINE)
====================================================================
${consistency}

CRITICAL EXECUTION RULE:
If the user chose "STRICT", you MUST NOT change the background or phone frame between slides. If you are generating slide 2, it should look like a visual twin of slide 1 with only the screen content and text changing. Failure to maintain this will result in a 0 quality score.
${templateStyle}

=== OUTPUT QA REPORT (MANDATORY) ===
Return a JSON object in TEXT modality only, with this exact schema:
{"overall_score": number, "checks": {"headline_exact": boolean, "subheadline_exact": boolean, "no_placeholder": boolean, "ui_preserved": boolean, "contrast_ok": boolean}, "issues": string[]}

${langDirective}${userDirective}

FINAL REMINDER:
You are generating a final, production-ready marketing asset. It must be visually flawless, mathematically balanced, and aggressively optimized for high conversion. Follow the TEMPLATE STYLE DIRECTIVE above — do NOT default to generic layouts. Execute.`.trim();
}

function parseQualityScore(rawText: string): number | null {
  const trimmed = (rawText || "").trim();
  if (!trimmed) return null;
  const jsonCandidate = trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonCandidate) return null;
  try {
    const parsed = JSON.parse(jsonCandidate);
    const score = Number(parsed?.overall_score ?? parsed?.score ?? parsed?.quality_score);
    if (Number.isFinite(score)) return Math.max(0, Math.min(100, Math.round(score)));
  } catch { return null; }
  return null;
}

function hasPlaceholderLeak(slide: any, rawText: string): boolean {
  const low = (rawText || "").toLowerCase();
  if (!low) return false;
  const forbidden = ["lorem ipsum", "your headline", "placeholder", "insert text", "sample text", "headline here"];
  return forbidden.some((token) => low.includes(token));
}

const IPs = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 15;
  let requests = IPs.get(ip) || [];
  requests = requests.filter(time => now - time < windowMs);
  if (requests.length >= maxRequests) { IPs.set(ip, requests); return true; }
  requests.push(now);
  IPs.set(ip, requests);
  return false;
}

const idempotencyCache = new Set<string>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    if (clientIp !== "unknown" && isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many generation requests. Please wait a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey || geminiApiKey.trim() === "") {
      return new Response(JSON.stringify({ error: "Configuration Error: AI Engine API Key is missing." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    let projectId: string;
    let singleSlideId: string | undefined;
    let targetSlideNumber: number | undefined;
    let userFeedback: string | undefined;
    let userPrompt: string | undefined;
    let forceRegenerate = false;
    let resumeGeneration = false;
    let idempotencyKey: string | undefined;

    if (req.method === "POST") {
      const body = await req.json();
      projectId = body.project_id;
      singleSlideId = body.single_slide_id;
      targetSlideNumber = body.target_slide_number;
      userFeedback = body.user_feedback;
      userPrompt = body.user_prompt;
      forceRegenerate = body.force_regenerate === true;
      resumeGeneration = body.resume === true;
      idempotencyKey = body.idempotency_key;
    } else {
      const url = new URL(req.url);
      projectId = url.searchParams.get("project_id") || "";
      forceRegenerate = url.searchParams.get("force_regenerate") === "true";
      resumeGeneration = url.searchParams.get("resume") === "true";
    }

    if (idempotencyKey) {
      if (idempotencyCache.has(idempotencyKey)) {
        return new Response(JSON.stringify({ error: "Duplicate request detected in progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      idempotencyCache.add(idempotencyKey);
      setTimeout(() => idempotencyCache.delete(idempotencyKey!), 60000);
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project, error: projError } = await userClient.from("projects").select("*").eq("id", projectId).single();
    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allSlides, error: slidesError } = await userClient.from("project_slides").select("*").eq("project_id", projectId).order("slide_number", { ascending: true });
    if (slidesError || !allSlides || allSlides.length === 0) {
      return new Response(JSON.stringify({ error: "No slides found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!singleSlideId && project.status === "generating" && !forceRegenerate && !resumeGeneration) {
      const activeGenerating = allSlides.some((s: any) => s.status === "generating" && !s.image_url);
      if (activeGenerating) {
        return new Response(JSON.stringify({ error: "Generation already in progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine which slide to generate — always "full" mode (one at a time, interactive)
    let candidateSlides = allSlides;

    if (singleSlideId) {
      const singleSlide = allSlides.find((s: any) => s.id === singleSlideId);
      if (!singleSlide) {
        return new Response(JSON.stringify({ error: "Slide not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      candidateSlides = [singleSlide];
    } else if (targetSlideNumber) {
      const targetSlide = allSlides.find((s: any) => s.slide_number === targetSlideNumber);
      if (!targetSlide) {
        return new Response(JSON.stringify({ error: "Target slide not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      candidateSlides = [targetSlide];
    }

    let slidesToGenerate = (singleSlideId || targetSlideNumber || forceRegenerate)
      ? candidateSlides
      : candidateSlides.filter((slide: any) => !slide.image_url && (slide.status === "pending" || slide.status === "generating"));

    if (!singleSlideId && !targetSlideNumber && resumeGeneration) {
      const generatingIds = candidateSlides.filter((s: any) => s.status === "generating").map((s: any) => s.id);
      if (generatingIds.length > 0) {
        await adminClient.from("project_slides").update({ status: "pending" }).in("id", generatingIds);
      }
      slidesToGenerate = candidateSlides.filter((slide: any) => !(slide.status === "completed" && slide.image_url));
    }

    // Process ONLY ONE slide per invocation for the interactive workflow
    if (slidesToGenerate.length === 0) {
      return new Response(JSON.stringify({ error: "No slides to generate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    slidesToGenerate.sort((a: any, b: any) => a.slide_number - b.slide_number);
    const invocationSlides = [slidesToGenerate[0]];

    // Check credits
    const { data: profileData } = await adminClient.from("profiles").select("credits, plan").eq("id", userId).single();
    const currentCredits = profileData?.credits ?? 0;

    const billableSlides = invocationSlides.filter((slide: any) => {
      if (singleSlideId || forceRegenerate) return true;
      if (resumeGeneration && slide.status === "generating") return false;
      return true;
    });

    const totalCost = billableSlides.length * CREDIT_COST_PER_SLIDE;

    if (currentCredits < totalCost) {
      return new Response(JSON.stringify({ error: `Insufficient credits. This action requires ${totalCost} credit(s), but you have ${currentCredits}.` }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reference assets from storage
    const { data: assets } = await userClient.from("assets").select("*").eq("project_id", projectId);
    const referenceImages: { mimeType: string; data: string; tag?: string }[] = [];
    if (assets) {
      for (const asset of assets.slice(0, 8)) {
        try {
          const { data: fileData } = await adminClient.storage.from("raw-uploads").download(asset.storage_path);
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const ext = asset.storage_path.split(".").pop()?.toLowerCase() || "png";
            const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
            referenceImages.push({ mimeType: mime, data: base64, tag: asset.tag || undefined });
          }
        } catch { /* skip */ }
      }
    }

    // Try to fetch template preview image from the public templates bucket
    let templatePreviewImage: { mimeType: string; data: string } | null = null;
    const templateKey = (project.template_id || "").toLowerCase().replace(/\s+/g, "-");
    if (templateKey) {
      // Try common naming patterns
      const possibleNames = [`${templateKey}.png`, `${templateKey}.jpg`, `${templateKey}.jpeg`, `${templateKey}.webp`];
      for (const name of possibleNames) {
        try {
          const { data: tmplData } = await adminClient.storage.from("templates").download(name);
          if (tmplData) {
            const ab = await tmplData.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
            const ext = name.split(".").pop() || "png";
            templatePreviewImage = { mimeType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, data: b64 };
            break;
          }
        } catch { /* skip */ }
      }
    }

    // Update project status
    if (!singleSlideId) {
      await adminClient.from("projects").update({ status: "generating" }).eq("id", projectId);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const brandKit = project.brand_kit as any || {};

        // Track previously generated images for context chaining
        const previousSlideImages: { mimeType: string; data: string }[] = [];

        const contextSlides = (singleSlideId
          ? allSlides.filter((s: any) => s.id !== singleSlideId && s.status === "completed" && s.image_url)
          : allSlides.filter((s: any) => s.status === "completed" && s.image_url)
        )
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .slice(-9);

        for (const contextSlide of contextSlides) {
          try {
            const contextPath = `${userId}/${projectId}/slide-${contextSlide.slide_number}.png`;
            const { data: contextData } = await adminClient.storage.from("generated-outputs").download(contextPath);
            if (!contextData) continue;
            const ab = await contextData.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
            previousSlideImages.push({ mimeType: "image/png", data: b64 });
          } catch { /* ignore */ }
        }

        if (invocationSlides.length === 0) {
          const { data: remainingSlides } = await adminClient
            .from("project_slides").select("status,image_url").eq("project_id", projectId);
          const pendingOrGenerating = (remainingSlides || []).filter(
            (s: any) => !s.image_url && (s.status === "pending" || s.status === "generating")
          );
          const hasMore = pendingOrGenerating.length > 0;
          await adminClient.from("projects").update({ status: hasMore ? "generating" : "completed" }).eq("id", projectId);
          sendEvent("all-done", { projectId, hasMore, remaining: pendingOrGenerating.length });
          controller.close();
          return;
        }

        for (let i = 0; i < invocationSlides.length; i++) {
          const slide = invocationSlides[i];
          const displayNum = slide.slide_number;

          sendEvent("slide-start", { slideNumber: displayNum, total: allSlides.length });
          const slideStartMs = Date.now();
          await adminClient.from("project_slides").update({ status: "generating", attempt_count: (slide.attempt_count || 0) + 1 }).eq("id", slide.id);

          try {
            const prompt = buildSlidePrompt(
              { ...slide, total_slides: allSlides.length },
              project,
              brandKit,
              project.consistency_level || "balanced",
              userPrompt
            );

            let variantPrompt = prompt;

            if (userFeedback) {
              variantPrompt += `\n\n=== USER REDESIGN INSTRUCTION ===\nYou MUST incorporate the following feedback exactly: "${userFeedback}"`;
            }

            const buildContents = (promptText: string) => {
              const parts: any[] = [{ text: promptText }];

              // Inject template preview image FIRST so the AI sees the target style
              if (templatePreviewImage) {
                parts.push({
                  inlineData: { mimeType: templatePreviewImage.mimeType, data: templatePreviewImage.data }
                });
                parts[0] = {
                  text: `${promptText}\n\n=== TEMPLATE REFERENCE IMAGE ===\nThe image immediately following this text is the TEMPLATE you must replicate in terms of layout, composition, color scheme, typography style, and overall mood. Study it carefully and produce a slide that follows this exact aesthetic direction while using the user's app content.\n=== END TEMPLATE REFERENCE ===`,
                };
              }

              // Add the matching raw screen for this slide
              const matchingRef = referenceImages.find((r) => r.tag === slide.raw_screen_tag);
              if (matchingRef) {
                parts.push({ inlineData: { mimeType: matchingRef.mimeType, data: matchingRef.data } });
              }

              // Add brand assets (logo, icon, mascot)
              for (const img of referenceImages.filter((r) => ["logo", "icon", "mascot"].includes(r.tag || ""))) {
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
              }

              // Add other reference screens (up to 3 extra)
              for (const img of referenceImages.filter((r) => r.tag !== slide.raw_screen_tag && !["logo", "icon", "mascot"].includes(r.tag || "")).slice(0, 3)) {
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
              }

              // Add previously generated slides for continuity
              if (previousSlideImages.length > 0) {
                const recentSlides = previousSlideImages.slice(-9);
                for (const prevImg of recentSlides) {
                  parts.push({ inlineData: { mimeType: prevImg.mimeType, data: prevImg.data } });
                }
                // Prepend continuity context to the main text part
                const mainTextIndex = parts.findIndex(p => p.text);
                if (mainTextIndex >= 0) {
                  parts[mainTextIndex] = {
                    text: `${parts[mainTextIndex].text}\n\n=== CRITICAL CONTINUITY CONTEXT ===\nThe following ${recentSlides.length} image(s) represent the EXACT master aesthetic of the previous slide(s) in this specific marketing set. You MUST maintain ABSOLUTE, pixel-perfect visual continuity with them. Specifically: The lighting model, the gradient logic, the 3D phone device angle/style, the exact character modeling (if a mascot is present), and the specific background rendering approach must look identical, as if designed by the exact same human artist in a single Figma file. DO NOT DEVIATE.\n=== END CONTEXT ===`,
                  };
                }
              }

              // Limit total images to 14 max
              let imgCount = 0;
              for (let j = parts.length - 1; j >= 0; j--) {
                if ((parts[j] as any).inlineData) {
                  imgCount++;
                  if (imgCount > 14) parts.splice(j, 1);
                }
              }

              return parts;
            };

            const runAttempt = async (promptText: string) => {
              const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-image-preview",
                contents: buildContents(promptText),
                config: {
                  responseModalities: ["TEXT", "IMAGE"],
                  imageConfig: { aspectRatio: "9:16", imageSize: "2K" },
                } as any,
              });

              let imageBase64 = "";
              let text = "";
              if (response.candidates && response.candidates[0]) {
                for (const part of response.candidates[0].content!.parts!) {
                  if ((part as any).text) text += (part as any).text;
                  else if ((part as any).inlineData) imageBase64 = (part as any).inlineData.data;
                }
              }

              const qualityScore = parseQualityScore(text);
              const placeholderLeak = hasPlaceholderLeak(slide, text);
              return { imageBase64, text, qualityScore, placeholderLeak };
            };

            let attempt = await runAttempt(variantPrompt);

            if (!attempt.imageBase64 || (attempt.qualityScore !== null && attempt.qualityScore < QUALITY_SCORE_MIN) || attempt.placeholderLeak) {
              const repairPrompt = `${variantPrompt}\n\nREPAIR PASS (MANDATORY): improve readability, preserve exact headline/subheadline wording, remove placeholders, strengthen visual hierarchy, and return a higher QA score JSON.`;
              attempt = await runAttempt(repairPrompt);
            }

            if (!attempt.imageBase64) throw new Error("No image generated");

            previousSlideImages.push({ mimeType: "image/png", data: attempt.imageBase64 });

            const storagePath = `${userId}/${projectId}/slide-${displayNum}.png`;
            const imageBytes = Uint8Array.from(atob(attempt.imageBase64), (c) => c.charCodeAt(0));
            await adminClient.storage.from("generated-outputs").upload(storagePath, imageBytes, {
              contentType: "image/png", upsert: true,
            });

            // Deduct credit AFTER successful generation
            const { data: freshProfile } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
            if (freshProfile) {
              await adminClient.from("profiles").update({ credits: Math.max(0, freshProfile.credits - CREDIT_COST_PER_SLIDE) }).eq("id", userId);
            }

            const generationMs = Date.now() - slideStartMs;
            await adminClient.from("project_slides").update({
              status: "completed", image_url: storagePath, quality_score: attempt.qualityScore,
              generation_ms: generationMs, last_error: null,
            }).eq("id", slide.id);

            const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(storagePath, 60 * 60 * 2);
            const displayUrl = signedData?.signedUrl || "";

            sendEvent("slide-done", {
              slideNumber: displayNum, imageUrl: displayUrl, storagePath,
              text: attempt.text, qualityScore: attempt.qualityScore,
            });
          } catch (error: any) {
            console.error(`Error generating slide ${displayNum}:`, error);
            await adminClient.from("project_slides").update({ status: "error", last_error: error.message || "Generation failed" }).eq("id", slide.id);
            sendEvent("slide-error", { slideNumber: displayNum, message: error.message || "Generation failed" });
          }
        }

        // Determine if there are more slides pending
        const { data: remainingSlides } = await adminClient
          .from("project_slides").select("status,image_url").eq("project_id", projectId);

        const pendingOrGenerating = (remainingSlides || []).filter(
          (s: any) => !s.image_url && (s.status === "pending" || s.status === "generating")
        );

        const hasMore = pendingOrGenerating.length > 0;

        if (!singleSlideId && !hasMore) {
          await adminClient.from("projects").update({ status: "completed" }).eq("id", projectId);
        }

        sendEvent("all-done", { projectId, hasMore, remaining: pendingOrGenerating.length });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("generate-screenshots error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
