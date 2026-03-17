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

// ─────────────────────────────────────────────────────────────
// App Store exact pixel dimensions per device format
// ─────────────────────────────────────────────────────────────
const DEVICE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  "iphone-6-5": { width: 1242, height: 2688, label: '6.5" iPhone (1242×2688)' },
  "iphone-6-9": { width: 1320, height: 2868, label: '6.9" iPhone (1320×2868)' },
  "ipad-12-9":  { width: 2048, height: 2732, label: '12.9" iPad (2048×2732)' },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function safeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))));
  }
  return btoa(chunks.join(""));
}

// ─────────────────────────────────────────────────────────────
// Template Layout Analysis Types
// ─────────────────────────────────────────────────────────────

interface SlideLayoutAnalysis {
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

interface TemplateSetAnalysis {
  totalSlides: number;
  overallStyle: string;
  colorPalette: string;
  slides: SlideLayoutAnalysis[];
}

// ─────────────────────────────────────────────────────────────
// Step 1: Analyze FULL template composite image
// Extracts per-slide layouts from a single image showing
// multiple slides side by side (like a portfolio/showcase)
// ─────────────────────────────────────────────────────────────

async function analyzeTemplateSet(
  ai: any,
  imageBase64: string,
  mimeType: string
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

    const text = response.candidates?.[0]?.content?.parts
      ?.find((p: any) => p.text)?.text || "{}";

    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log(`[ANALYSIS] ✅ Template set analysis complete: ${parsed.totalSlides} slides detected, style: ${(parsed.overallStyle || "").slice(0, 100)}...`);
    return parsed as TemplateSetAnalysis;
  } catch (e: any) {
    console.error("[ANALYSIS] ❌ Template set analysis failed:", e?.message);
    return {
      totalSlides: 1,
      overallStyle: "Clean, professional App Store screenshot design with centered phone mockup.",
      colorPalette: "Gradient background with accent colors",
      slides: [{
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
      }],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Step 2: Build the prompt — Template-faithful approach
// ─────────────────────────────────────────────────────────────

function buildSlidePrompt(params: {
  slide: any;
  project: any;
  brandKit: any;
  templateSetAnalysis: TemplateSetAnalysis | null;
  slideLayout: SlideLayoutAnalysis | null;
  isFirstSlide: boolean;
  totalSlides: number;
  hasPreviousSlides: boolean;
  hasRawScreen: boolean;
  isBeyondTemplate: boolean;
  userFeedback?: string;
  deviceFormats: string[];
}): string {
  const { slide, project, brandKit, templateSetAnalysis, slideLayout, isFirstSlide, totalSlides, hasPreviousSlides, hasRawScreen, isBeyondTemplate, userFeedback, deviceFormats } = params;

  const config = project.config as any || {};
  const appName = project.app_name || project.name || "App";

  const brandBlock = [
    brandKit?.colors?.length > 0 ? `Brand colors: ${brandKit.colors.join(", ")}` : "",
    brandKit?.fontFamily ? `Brand font: ${brandKit.fontFamily}` : "",
  ].filter(Boolean).join("\n");

  const outputLang = project.output_language || config?.outputLanguage || "en";
  const langDirective = outputLang !== "en"
    ? `\n\nLANGUAGE: All text on the screenshot (headline, subheadline) MUST be written in ${outputLang}. Reproduce the provided text EXACTLY as given.`
    : "";

  const feedbackBlock = userFeedback
    ? `\n\n=== USER REDESIGN INSTRUCTION (HIGHEST PRIORITY) ===\nYou MUST incorporate the following feedback exactly: "${userFeedback}"\n=== END USER INSTRUCTION ===`
    : "";

  const primaryFormat = deviceFormats[0] || "iphone-6-5";
  const dims = DEVICE_DIMENSIONS[primaryFormat] || DEVICE_DIMENSIONS["iphone-6-5"];
  const aspectStr = primaryFormat.includes("ipad")
    ? `3:4 (iPad portrait — target: ${dims.width}×${dims.height}px)`
    : `9:16 (iPhone portrait — target: ${dims.width}×${dims.height}px)`;

  const appCategory = config?.appCategory || "Not specified";
  const appDescription = config?.appDescription || project.app_description || "";

  // ── CASE 1: Slide within template range — match specific template slide ──
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
Color adaptation: ${brandKit?.colors?.length > 0 ? `Use ${brandKit.colors.join(", ")} as primary/accent colors, adapting the template's gradient style and contrast ratios.` : "Create a color palette appropriate for ${appCategory}, inspired by the template's color relationships."}

${hasRawScreen ? `=== RAW APP SCREEN (next image after template) ===
Composite this REAL app screenshot INTO the device frame as-is. Preserve EVERY pixel.` : `=== NO RAW SCREEN ===
${slideLayout.hasDeviceMockup ? "Include a phone mockup with a generic branded screen matching the app's color scheme." : "Focus on headline, subheadline, and background visual energy."}`}

=== SLIDE CONTEXT ===
Slide ${slide.slide_number} of ${totalSlides} | Objective: ${slide.objective || "Feature spotlight"} | Emphasis: ${slide.emphasis || "balanced"} | Format: ${aspectStr}

${!isFirstSlide && hasPreviousSlides ? `=== VISUAL CONTINUITY (CRITICAL) ===
Previously generated slides from THIS SET are attached after the template.
- LAYOUT: Follow template slide #${slideLayout.slidePosition}'s structure
- VISUAL IDENTITY: Match the exact colors, typography, device frames from the previous slides
- ONE designer, ONE Figma file, ONE session
Previously generated slides from THIS SET are also attached after the template and raw screen.
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
    return prompt;
  }


  // ── CASE 2: Beyond template range — continuity mode ──
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
App name: "${appName}" | Category: "${config?.appCategory || "Not specified"}"
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

// ─────────────────────────────────────────────────────────────
// Quality parsing
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Rate limiting & idempotency
// ─────────────────────────────────────────────────────────────

const IPs = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let requests = IPs.get(ip) || [];
  requests = requests.filter(time => now - time < 60000);
  if (requests.length >= 15) { IPs.set(ip, requests); return true; }
  requests.push(now);
  IPs.set(ip, requests);
  return false;
}

const idempotencyCache = new Set<string>();

// ─────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──
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

    // ── Parse request ──
    let projectId: string;
    let singleSlideId: string | undefined;
    let targetSlideNumber: number | undefined;
    let userFeedback: string | undefined;
    let forceRegenerate = false;
    let resumeGeneration = false;
    let idempotencyKey: string | undefined;

    if (req.method === "POST") {
      const body = await req.json();
      projectId = body.project_id;
      singleSlideId = body.single_slide_id;
      targetSlideNumber = body.target_slide_number;
      userFeedback = body.user_feedback;
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

    // ── Load project & slides ──
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

    // ── Determine slides to generate ──
    if (!singleSlideId && project.status === "generating" && !forceRegenerate && !resumeGeneration) {
      const activeGenerating = allSlides.some((s: any) => s.status === "generating" && !s.image_url);
      if (activeGenerating) {
        return new Response(JSON.stringify({ error: "Generation already in progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let candidateSlides = allSlides;
    if (singleSlideId) {
      const found = allSlides.find((s: any) => s.id === singleSlideId);
      if (!found) return new Response(JSON.stringify({ error: "Slide not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      candidateSlides = [found];
    } else if (targetSlideNumber) {
      const found = allSlides.find((s: any) => s.slide_number === targetSlideNumber);
      if (!found) return new Response(JSON.stringify({ error: "Target slide not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      candidateSlides = [found];
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

    // Interactive workflow: process ONE slide per invocation
    if (slidesToGenerate.length === 0) {
      return new Response(JSON.stringify({ error: "No slides to generate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    slidesToGenerate.sort((a: any, b: any) => a.slide_number - b.slide_number);
    const invocationSlides = [slidesToGenerate[0]];

    // ── Credit check ──
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

    // ── Load reference assets from storage ──
    const { data: dbAssets } = await userClient.from("assets").select("storage_path, asset_type, tag").eq("project_id", projectId);
    let assets = (dbAssets || []) as Array<{ storage_path: string; asset_type: string; tag: string | null }>;

    if (assets.length === 0) {
      const slideTags: string[] = Array.from(new Set(allSlides.map((s: any) => s.raw_screen_tag).filter(Boolean))) as string[];
      const [screenList, referenceList, brandList] = await Promise.all([
        adminClient.storage.from("raw-uploads").list(`${userId}/${projectId}/screens`, { limit: 20, sortBy: { column: "name", order: "asc" } }),
        adminClient.storage.from("raw-uploads").list(`${userId}/${projectId}/references`, { limit: 10, sortBy: { column: "name", order: "asc" } }),
        adminClient.storage.from("raw-uploads").list(`${userId}/${projectId}/brand`, { limit: 10, sortBy: { column: "name", order: "asc" } }),
      ]);

      const fallbackAssets: typeof assets = [];
      for (const [idx, file] of (screenList.data || []).entries()) {
        if (!file?.name) continue;
        fallbackAssets.push({ storage_path: `${userId}/${projectId}/screens/${file.name}`, asset_type: "raw_screen", tag: slideTags[idx] || `screen-${idx + 1}` });
      }
      for (const file of referenceList.data || []) {
        if (!file?.name) continue;
        fallbackAssets.push({ storage_path: `${userId}/${projectId}/references/${file.name}`, asset_type: "reference", tag: "reference" });
      }
      for (const file of brandList.data || []) {
        if (!file?.name) continue;
        const inferredType = file.name.startsWith("logo-") ? "logo" : file.name.startsWith("icon-") ? "icon" : file.name.startsWith("mascot-") ? "mascot" : "reference";
        fallbackAssets.push({ storage_path: `${userId}/${projectId}/brand/${file.name}`, asset_type: inferredType, tag: inferredType });
      }
      assets = fallbackAssets;
    }

    // Download all reference images
    const referenceImages: { mimeType: string; data: string; tag?: string; assetType: string }[] = [];
    for (const asset of assets.slice(0, 12)) {
      try {
        const { data: fileData } = await adminClient.storage.from("raw-uploads").download(asset.storage_path);
        if (!fileData) continue;
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = safeBase64(arrayBuffer);
        const ext = asset.storage_path.split(".").pop()?.toLowerCase() || "png";
        const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        referenceImages.push({ mimeType: mime, data: base64, tag: asset.tag || undefined, assetType: asset.asset_type });
      } catch { /* skip */ }
    }

    // ── Load template composite image ──
    const templateKey = (project.template_id || "").toLowerCase().replace(/\s+/g, "-");
    console.log(`[TEMPLATE] Looking for template: "${templateKey}"`);

    let templateImage: { mimeType: string; data: string } | null = null;
    if (templateKey) {
      const possibleNames = [`${templateKey}.png`, `${templateKey}.jpg`, `${templateKey}.jpeg`, `${templateKey}.webp`];
      for (const name of possibleNames) {
        try {
          const { data: tmplData, error: tmplError } = await adminClient.storage.from("templates").download(name);
          if (tmplError) continue;
          if (tmplData) {
            const ab = await tmplData.arrayBuffer();
            const b64 = safeBase64(ab);
            const ext = name.split(".").pop() || "png";
            templateImage = { mimeType: ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`, data: b64 };
            console.log(`[TEMPLATE] ✅ Loaded: ${name} (${Math.round(ab.byteLength / 1024)}KB)`);
            break;
          }
        } catch (e: any) {
          console.error(`[TEMPLATE] Error downloading ${name}:`, e?.message);
        }
      }
    }

    if (!templateImage) {
      console.warn(`[TEMPLATE] ⚠️ No template image found for "${templateKey}".`);
    }

    // ── Analyze FULL template set (extracts per-slide layouts from composite) ──
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    let templateSetAnalysis: TemplateSetAnalysis | null = null;

    if (templateImage) {
      templateSetAnalysis = await analyzeTemplateSet(ai, templateImage.data, templateImage.mimeType);
      console.log(`[TEMPLATE] Template has ${templateSetAnalysis.totalSlides} slides. Project needs ${allSlides.length} slides.`);
    }

    // ── Update project status ──
    if (!singleSlideId) {
      await adminClient.from("projects").update({ status: "generating" }).eq("id", projectId);
    }

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    const deviceFormats = (project.device_formats as string[]) || ["iphone-6-5"];
    const primaryFormat = deviceFormats[0] || "iphone-6-5";
    const aspectRatio = primaryFormat.includes("ipad") ? "3:4" : "9:16";
    const brandKit = project.brand_kit as any || {};

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        // Load previously generated slides for context chaining
        const previousSlideImages: { mimeType: string; data: string }[] = [];
        const contextSlides = (singleSlideId
          ? allSlides.filter((s: any) => s.id !== singleSlideId && s.status === "completed" && s.image_url)
          : allSlides.filter((s: any) => s.status === "completed" && s.image_url)
        ).sort((a: any, b: any) => a.slide_number - b.slide_number).slice(-3);

        for (const contextSlide of contextSlides) {
          try {
            const contextPath = `${userId}/${projectId}/slide-${contextSlide.slide_number}.png`;
            const { data: contextData } = await adminClient.storage.from("generated-outputs").download(contextPath);
            if (!contextData) continue;
            const ab = await contextData.arrayBuffer();
            previousSlideImages.push({ mimeType: "image/png", data: safeBase64(ab) });
          } catch { /* ignore */ }
        }

        if (invocationSlides.length === 0) {
          const { data: remainingSlides } = await adminClient.from("project_slides").select("status,image_url").eq("project_id", projectId);
          const pendingOrGenerating = (remainingSlides || []).filter((s: any) => !s.image_url && (s.status === "pending" || s.status === "generating"));
          await adminClient.from("projects").update({ status: pendingOrGenerating.length > 0 ? "generating" : "completed" }).eq("id", projectId);
          sendEvent("all-done", { projectId, hasMore: pendingOrGenerating.length > 0, remaining: pendingOrGenerating.length });
          controller.close();
          return;
        }

        for (const slide of invocationSlides) {
          const displayNum = slide.slide_number;
          sendEvent("slide-start", { slideNumber: displayNum, total: allSlides.length });
          const slideStartMs = Date.now();
          await adminClient.from("project_slides").update({ status: "generating", attempt_count: (slide.attempt_count || 0) + 1 }).eq("id", slide.id);

          try {
            // ── Resolve which template slide to target ──
            const templateSlideCount = templateSetAnalysis?.totalSlides || 0;
            const isBeyondTemplate = displayNum > templateSlideCount;
            const slideLayout = (!isBeyondTemplate && templateSetAnalysis)
              ? (templateSetAnalysis.slides[displayNum - 1] || templateSetAnalysis.slides[templateSetAnalysis.slides.length - 1] || null)
              : null;

            console.log(`[TEMPLATE] Slide ${displayNum}: ${isBeyondTemplate ? `BEYOND template (${templateSlideCount} slides) → continuity mode` : `targeting template slide #${slideLayout?.slidePosition || displayNum}`}`);

            const rawScreenReferences = referenceImages.filter((r) => r.assetType === "raw_screen");
            const exactRawScreen = rawScreenReferences.find((r) => r.tag === slide.raw_screen_tag);
            const fallbackRawScreen = rawScreenReferences[Math.min(displayNum - 1, Math.max(rawScreenReferences.length - 1, 0))] || rawScreenReferences[0];
            const selectedRawScreen = slide.raw_screen_tag ? (exactRawScreen || fallbackRawScreen) : null;

            const prompt = buildSlidePrompt({
              slide: { ...slide, total_slides: allSlides.length },
              project,
              brandKit,
              templateSetAnalysis,
              slideLayout,
              isFirstSlide: displayNum === 1,
              totalSlides: allSlides.length,
              hasPreviousSlides: previousSlideImages.length > 0,
              hasRawScreen: !!selectedRawScreen,
              isBeyondTemplate,
              userFeedback,
              deviceFormats,
            });

            // Build image parts for Gemini
            const parts: any[] = [];

            // PART 1: The prompt text
            parts.push({ text: prompt });

            // PART 2: Template composite image (shows all template slides — AI focuses on the right one via prompt)
            if (templateImage) {
              parts.push({
                inlineData: { mimeType: templateImage.mimeType, data: templateImage.data },
              });
            }

            // PART 3: Raw app screen (if tagged)
            if (selectedRawScreen) {
              parts.push({
                inlineData: { mimeType: selectedRawScreen.mimeType, data: selectedRawScreen.data },
              });
            }

            // PART 4: Brand assets (logo, icon, mascot)
            const brandAssets = referenceImages.filter((r) => ["logo", "icon", "mascot"].includes(r.assetType || "")).slice(0, 2);
            if (brandAssets.length > 0) {
              parts.push({ text: "[BRAND ASSETS — logo/icon to incorporate into the design]" });
              for (const img of brandAssets) {
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
              }
            }

            // PART 5: Previously generated slides for continuity
            // For slides beyond template: these are the PRIMARY reference
            // For slides within template: these ensure visual identity consistency
            if (previousSlideImages.length > 0) {
              const maxPrev = isBeyondTemplate ? 4 : 3; // More context when in continuity-only mode
              parts.push({ text: isBeyondTemplate
                ? "[PREVIOUSLY GENERATED SLIDES — these are your PRIMARY visual reference. Match their EXACT visual identity to continue the set.]"
                : "[PREVIOUSLY GENERATED SLIDES — match their visual identity, color palette, and typography for set consistency]"
              });
              // Include: anchor slide (first) + most recent slides
              const anchors: typeof previousSlideImages = [];
              anchors.push(previousSlideImages[0]); // First slide = anchor identity
              // Add recent slides (up to maxPrev - 1 more)
              const recentSlides = previousSlideImages.slice(1).slice(-(maxPrev - 1));
              anchors.push(...recentSlides);
              for (const prevImg of anchors) {
                parts.push({ inlineData: { mimeType: prevImg.mimeType, data: prevImg.data } });
              }
            }

            // Enforce max 14 images
            let imgCount = 0;
            for (let j = parts.length - 1; j >= 0; j--) {
              if ((parts[j] as any).inlineData) {
                imgCount++;
                if (imgCount > 14) parts.splice(j, 1);
              }
            }

            console.log(`[GENERATE] Slide ${displayNum}: ${imgCount} images, mode=${isBeyondTemplate ? "continuity" : "template"}, rawScreen=${!!selectedRawScreen}, prevSlides=${previousSlideImages.length}`);

            // Call Nano Banana 2 (Gemini 3.1 Flash Image Preview)
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-image-preview",
              contents: parts,
              config: {
                responseModalities: ["TEXT", "IMAGE"],
                imageConfig: { aspectRatio, imageSize: "2K" },
                temperature: 0.4,
                maxOutputTokens: 8192,
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

            // Auto-repair: retry once if no image or low quality
            if (!imageBase64) {
              console.warn(`[GENERATE] Slide ${displayNum}: No image on first attempt, retrying...`);
              const retryResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-image-preview",
                contents: [{ text: `${prompt}\n\nCRITICAL: You MUST generate an image. Return an App Store screenshot image.` }, ...(templateImage ? [{ inlineData: { mimeType: templateImage.mimeType, data: templateImage.data } }] : [])],
                config: {
                  responseModalities: ["TEXT", "IMAGE"],
                  imageConfig: { aspectRatio, imageSize: "2K" },
                  temperature: 0.3,
                  maxOutputTokens: 8192,
                } as any,
              });
              if (retryResponse.candidates?.[0]) {
                for (const part of retryResponse.candidates[0].content!.parts!) {
                  if ((part as any).inlineData) imageBase64 = (part as any).inlineData.data;
                  if ((part as any).text) text = (part as any).text;
                }
              }
            }

            if (!imageBase64) throw new Error("No image generated after retry");

            // Add to context chain for next slide
            previousSlideImages.push({ mimeType: "image/png", data: imageBase64 });

            // Upload to storage
            const storagePath = `${userId}/${projectId}/slide-${displayNum}.png`;
            const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
            await adminClient.storage.from("generated-outputs").upload(storagePath, imageBytes, {
              contentType: "image/png", upsert: true,
            });

            // Deduct credit AFTER successful generation
            // Atomic credit deduction — prevents race conditions
            await adminClient.rpc('deduct_credits', { p_user_id: userId, p_amount: CREDIT_COST_PER_SLIDE });

            const qualityScore = parseQualityScore(text);
            const generationMs = Date.now() - slideStartMs;
            await adminClient.from("project_slides").update({
              status: "completed", image_url: storagePath, quality_score: qualityScore,
              generation_ms: generationMs, last_error: null,
            }).eq("id", slide.id);

            const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(storagePath, 60 * 60 * 2);
            sendEvent("slide-done", {
              slideNumber: displayNum, imageUrl: signedData?.signedUrl || "", storagePath,
              qualityScore, generationMs,
            });
          } catch (error: any) {
            console.error(`[GENERATE] Error slide ${displayNum}:`, error);
            await adminClient.from("project_slides").update({ status: "error", last_error: error.message || "Generation failed" }).eq("id", slide.id);
            sendEvent("slide-error", { slideNumber: displayNum, message: error.message || "Generation failed" });
          }
        }

        // Check remaining slides
        const { data: remainingSlides } = await adminClient.from("project_slides").select("status,image_url").eq("project_id", projectId);
        const pendingOrGenerating = (remainingSlides || []).filter((s: any) => !s.image_url && (s.status === "pending" || s.status === "generating"));
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
