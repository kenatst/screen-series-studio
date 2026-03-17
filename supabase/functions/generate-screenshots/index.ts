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
  const aspectStr = primaryFormat.includes("ipad") ? "3:4 (iPad portrait)" : "9:16 (iPhone portrait)";

  // ── CASE 1: Slide within template range — match specific template slide ──
  if (!isBeyondTemplate && slideLayout && templateSetAnalysis) {
    const prompt = `
You are an elite-tier App Store screenshot designer — your work rivals the best studios on Dribbble and Behance.

=== YOUR MISSION ===
IMAGE #1 is a TEMPLATE SET showing ${templateSetAnalysis.totalSlides} slides side by side.
You are generating slide ${slide.slide_number} of ${totalSlides} for this project.
Your job: recreate the design of SLIDE #${slideLayout.slidePosition} (counting left to right) from the template image, but with the new app content below.
The output must look like it was made by the SAME designer who created the template — same quality, same visual DNA, same attention to detail.

=== TEMPLATE SET IDENTITY ===
${templateSetAnalysis.overallStyle}
Color palette: ${templateSetAnalysis.colorPalette}

=== TARGET SLIDE LAYOUT (slide #${slideLayout.slidePosition} from the template) ===
${slideLayout.detailedComposition}

Layout details to reproduce PRECISELY:
- Device mockup: ${slideLayout.hasDeviceMockup ? `YES — positioned ${slideLayout.devicePosition}, scale ${slideLayout.deviceScale}. Match the EXACT device angle, shadow, and frame style.` : "NO device mockup — DO NOT add one. This is a text/graphic-only slide."}
- Text placement: ${slideLayout.textPosition} — match the EXACT vertical/horizontal position, font size ratio, and spacing
- Headline style: ${slideLayout.headlineStyle}, large and impactful
- Background: ${slideLayout.backgroundType}${slideLayout.decorativeElements.length > 0 ? ` with: ${slideLayout.decorativeElements.join(", ")}` : ""}
- 3D elements: ${slideLayout.has3DElements ? "YES — match the template's 3D style, lighting, and material" : "NO — keep flat/2D"}
${slideLayout.hasMascot ? `- Mascot/Character: YES — ${slideLayout.mascotDescription}` : ""}
- Mood: ${slideLayout.mood}

=== APP CONTENT TO INSERT ===
App name: "${appName}" | Category: "${config?.appCategory || "Not specified"}"
>>> HEADLINE (render EXACTLY): "${slide.headline || ""}" <<<
>>> SUBHEADLINE (render EXACTLY): "${slide.subheadline || ""}" <<<
${brandBlock ? `\n=== BRAND IDENTITY ===\n${brandBlock}` : ""}
Color adaptation: ${brandKit?.colors?.length > 0 ? `Adapt the template's color scheme to use ${brandKit.colors.join(", ")} as primary/accent colors while preserving the same visual energy and contrast ratios.` : "Keep the template's original color palette, adapting hues to match any brand colors from the raw app screenshot."}

${hasRawScreen ? `=== RAW APP SCREEN (next image after template) ===
This is the REAL app screenshot. Composite it INTO the device frame EXACTLY as-is.
- Preserve EVERY pixel — do NOT redesign or modify the UI
- Place it inside the phone frame at the SAME position/angle as the template's device
- If the screen is too tall, crop the bottom naturally` : `=== NO RAW SCREEN ===
${slideLayout.hasDeviceMockup ? "Include a phone mockup with a generic branded screen matching the app's color scheme." : "Focus on headline, subheadline, and background visual energy — matching the template's layout."}`}

=== SLIDE CONTEXT ===
Slide ${slide.slide_number} of ${totalSlides} | Objective: ${slide.objective || "Feature spotlight"} | Emphasis: ${slide.emphasis || "balanced"} | Importance: ${slide.importance || "high"} | Format: ${aspectStr}

${!isFirstSlide && hasPreviousSlides ? `=== VISUAL CONTINUITY (CRITICAL) ===
Previously generated slides from THIS SET are also attached after the template and raw screen.
You MUST ensure this slide looks like it belongs to the same family:
- LAYOUT: Follow the template slide #${slideLayout.slidePosition}'s composition (IMAGE #1)
- VISUAL IDENTITY: Match the exact color palette, typography, device frames, background treatment, and lighting from the previously generated slides
- Think of it as: ONE designer, ONE Figma file, ONE session — each slide has a different layout but shares the same visual DNA
` : ""}=== QUALITY RULES ===
1. Text pixel-perfect, crisp, perfectly kerned — zero artifacts
2. Render the EXACT headline/subheadline strings — NO placeholders
3. INDISTINGUISHABLE from the template's professional quality
4. Match proportions, spacing, and visual weight from the target template slide
5. Rich backgrounds with proper depth and lighting
6. Photorealistic device frames with proper shadows
${langDirective}${feedbackBlock}

Generate the image now. Recreate the template EXACTLY with the new content.
You are an elite-tier App Store screenshot designer — your work rivals the best studios on Dribbble and Behance. Your task: create ONE polished, publication-ready App Store screenshot.

=== OUTPUT SPEC ===
- Format: ${aspectStr}
- Resolution: Ultra-crisp, Retina-quality, 2K
- Style: Premium, editorial-grade App Store screenshot — NOT a wireframe, NOT a mockup concept

=== REFERENCE TEMPLATE (IMAGE #1) ===
You MUST reproduce the EXACT same visual style, layout proportions, and composition structure from the reference template image.
Detailed analysis of the template layout:
${layout.detailedComposition}

COPY THESE EXACT PROPORTIONS:
- Device mockup: ${layout.hasDeviceMockup ? `YES — ${layout.devicePosition} position, ${layout.deviceScale} scale` : "NO device — this is a text/typographic slide"}
- Text zone: ${layout.textPosition} area
- Typography: ${layout.headlineStyle} — large, bold, impactful
- Background: ${layout.backgroundType}${layout.decorativeElements.length > 0 ? ` with decorative elements: ${layout.decorativeElements.join(", ")}` : ""}
${layout.has3DElements ? "- 3D elements: YES — include matching 3D decorative objects" : ""}
${layout.hasMascot ? `- Character/Mascot: YES — ${layout.mascotDescription}` : ""}
- Overall mood: ${layout.mood}

=== CONTENT (RENDER EXACTLY) ===
App: "${appName}" | Category: ${config?.appCategory || "App"}
Slide ${slide.slide_number}/${totalSlides} | Purpose: ${slide.objective || "Feature highlight"}

>>> HEADLINE (render this EXACT text, large): "${slide.headline || ""}"
>>> SUBHEADLINE (render below headline, smaller): "${slide.subheadline || ""}"
${brandBlock ? `\n=== BRAND ===\n${brandBlock}` : ""}
Color direction: ${brandKit?.colors?.length > 0 ? `Use ${brandKit.colors.join(", ")} as primary palette, adapting to the template's composition.` : "Derive a harmonious palette from the template, matched to any brand colors in the raw screenshot."}

${hasRawScreen ? `=== RAW APP SCREEN (IMAGE #2) ===
Composite this REAL app screenshot INTO the phone frame as-is.
- Preserve EVERY pixel of the original UI — do NOT redesign, rearrange, or hallucinate new UI elements
- Show the screen naturally inside the device frame, cropping bottom if needed
- The phone frame must look photorealistic (realistic bezels, shadows, reflections)` : `=== NO RAW SCREEN ===
${layout.hasDeviceMockup ? "Include a phone mockup with a clean, branded placeholder screen matching the app's color scheme." : "This is a PURE typographic/visual slide — focus all energy on headline impact and background design."}`}

=== ABSOLUTE RULES ===
1. Text MUST be pixel-perfect: crisp, well-kerned, no artifacts, no warping, no misspellings
2. Render the EXACT headline and subheadline provided — zero placeholder text, zero lorem ipsum
3. The final image must be INDISTINGUISHABLE from a professional design studio's output
4. Background must be rich and polished — gradients, depth, subtle lighting effects
5. Device frames must look photorealistic with proper shadows and reflections
6. Visual emphasis: ${slide.emphasis || "balanced"}

${!isFirstSlide && hasPreviousSlides ? `=== VISUAL CONTINUITY (CRITICAL) ===
Previously generated slides are attached as reference. You MUST match:
- Exact same color palette and gradient logic
- Same typography style and weight
- Same device frame style and shadow treatment  
- Same background rendering approach
The entire set must look like ONE cohesive design from ONE designer.` : ""}
${langDirective}${feedbackBlock}

Generate the image now.
`.trim();
    return prompt;
  }


  return prompt;
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
            const { data: freshProfile } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
            if (freshProfile) {
              await adminClient.from("profiles").update({ credits: Math.max(0, freshProfile.credits - CREDIT_COST_PER_SLIDE) }).eq("id", userId);
            }

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
