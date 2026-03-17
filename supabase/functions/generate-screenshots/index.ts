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

// ─────────────────────────────────────────────────────────────
// Step 1: Analyze template image with Gemini text model
// ─────────────────────────────────────────────────────────────

async function analyzeTemplateSlide(
  ai: any,
  imageBase64: string,
  mimeType: string
): Promise<SlideLayoutAnalysis> {
  try {
    console.log("[ANALYSIS] Analyzing template layout...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: { mimeType, data: imageBase64 },
        },
        {
          text: `Analyze this App Store screenshot template slide. Return ONLY a JSON object with these exact fields, no markdown, no backticks:

{
  "hasDeviceMockup": boolean,
  "devicePosition": "center" | "left" | "right" | "angled",
  "deviceScale": "small" | "medium" | "large" | "full",
  "textPosition": "top" | "bottom" | "left" | "right" | "overlay",
  "headlineStyle": "bold-serif" | "bold-sans" | "script" | "condensed",
  "backgroundType": "gradient" | "solid" | "photo" | "3d-scene" | "pattern" | "aurora",
  "has3DElements": boolean,
  "hasMascot": boolean,
  "mascotDescription": "description of mascot if present, null otherwise",
  "decorativeElements": ["list", "of", "visual", "elements"],
  "mood": "one-word-or-hyphenated mood descriptor",
  "detailedComposition": "A 2-3 sentence precise description of the exact spatial layout, proportions, and visual hierarchy of every element in the image. Include exact positions (top 25%, center 60%), relative sizes, spacing rhythm, and color relationships."
}`,
        },
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.find((p: any) => p.text)?.text || "{}";

    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("[ANALYSIS] ✅ Template analysis complete:", JSON.stringify(parsed).slice(0, 200));
    return parsed as SlideLayoutAnalysis;
  } catch (e: any) {
    console.error("[ANALYSIS] ❌ Template analysis failed:", e?.message);
    return {
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
  layout: SlideLayoutAnalysis;
  isFirstSlide: boolean;
  totalSlides: number;
  hasPreviousSlides: boolean;
  hasRawScreen: boolean;
  userFeedback?: string;
  deviceFormats: string[];
}): string {
  const { slide, project, brandKit, layout, isFirstSlide, totalSlides, hasPreviousSlides, hasRawScreen, userFeedback, deviceFormats } = params;

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

  // Device format info
  const primaryFormat = deviceFormats[0] || "iphone-6-5";
  const aspectStr = primaryFormat.includes("ipad") ? "3:4 (iPad portrait)" : "9:16 (iPhone portrait)";

  const prompt = `
You are an elite-tier App Store screenshot designer. Your work rivals the best studios on Dribbble and Behance.

=== YOUR MISSION ===
Create slide ${slide.slide_number} of ${totalSlides} for the app "${appName}".
IMAGE #1 is YOUR MASTER REFERENCE TEMPLATE for THIS EXACT SLIDE — you MUST reproduce its layout, composition, spacing, and visual energy PRECISELY.
The ONLY things that change are the headline, subheadline, app screen, and brand colors.

=== OUTPUT SPEC ===
- Format: ${aspectStr}
- Resolution: Ultra-crisp, Retina-quality, 2K
- Style: Premium, editorial-grade App Store screenshot

=== TEMPLATE LAYOUT ANALYSIS (from IMAGE #1) ===
${layout.detailedComposition}

MATCH THESE EXACT PROPORTIONS:
- Device mockup: ${layout.hasDeviceMockup ? `YES — ${layout.devicePosition} position, ${layout.deviceScale} scale. Copy the EXACT device angle, shadow, frame style.` : "NO device — this is a text/typographic slide. DO NOT add a phone."}
- Text placement: ${layout.textPosition} — match the EXACT position, font size ratio, and spacing
- Headline style: ${layout.headlineStyle}, large and impactful
- Background: ${layout.backgroundType}${layout.decorativeElements.length > 0 ? ` with elements: ${layout.decorativeElements.join(", ")}` : ""} — reproduce the EXACT treatment
- 3D elements: ${layout.has3DElements ? "YES — include matching 3D objects with same lighting/material" : "NO — keep flat/2D"}
${layout.hasMascot ? `- Mascot/Character: YES — ${layout.mascotDescription}. Same position and scale as template.` : ""}
- Mood: ${layout.mood}

=== CONTENT TO RENDER (EXACT TEXT) ===
>>> HEADLINE: "${slide.headline || ""}"
>>> SUBHEADLINE: "${slide.subheadline || ""}"
Category: ${config?.appCategory || "App"} | Purpose: ${slide.objective || "Feature highlight"}
Visual emphasis: ${slide.emphasis || "balanced"} | Importance: ${slide.importance || "high"}
${brandBlock ? `\n=== BRAND IDENTITY ===\n${brandBlock}` : ""}
Color direction: ${brandKit?.colors?.length > 0 ? `Adapt template colors to use ${brandKit.colors.join(", ")} as primary palette while keeping same contrast ratios.` : "Keep template's original palette, adjusting hue to match any brand colors from the raw screenshot."}

${hasRawScreen ? `=== RAW APP SCREEN (IMAGE #2) ===
This is the REAL app screenshot. Composite it INTO the device frame EXACTLY as-is.
- Preserve EVERY pixel — do NOT redesign, rearrange, or hallucinate new UI
- Place inside the phone frame at the SAME position/angle as template's device
- Crop bottom naturally if screen is too tall` : `=== NO RAW SCREEN PROVIDED ===
${layout.hasDeviceMockup ? "Include a phone mockup with a clean branded placeholder screen." : "Focus on headline impact and background design — this is a pure typographic slide."}`}

${!isFirstSlide && hasPreviousSlides ? `=== VISUAL CONTINUITY (CRITICAL) ===
Previously generated slides from THIS SET are attached after the template and raw screen.
LAYOUT → follows THIS SLIDE'S template reference (IMAGE #1)
VISUAL IDENTITY → matches the previously generated slides for set consistency
Match: exact color palette, gradient logic, typography, device frame style, shadow treatment, background rendering.
The set must look like ONE designer made it in ONE Figma session.` : ""}

=== ABSOLUTE QUALITY RULES ===
1. Text MUST be pixel-perfect: crisp, well-kerned, no artifacts, no warping, no misspellings
2. Render the EXACT headline and subheadline — zero placeholder text, zero lorem ipsum
3. Output must be INDISTINGUISHABLE from a professional design studio's work
4. Rich backgrounds with proper depth, lighting, and detail matching the template
5. Photorealistic device frames (if applicable) with proper shadows and reflections
${langDirective}${feedbackBlock}

Generate the image now.
`.trim();



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

    // ── Load template images (per-slide + fallback global) ──
    const templateKey = (project.template_id || "").toLowerCase().replace(/\s+/g, "-");
    console.log(`[TEMPLATE] Looking for template: "${templateKey}"`);

    // Helper to download a template image by trying multiple extensions
    async function downloadTemplateImage(baseName: string): Promise<{ mimeType: string; data: string } | null> {
      const possibleNames = [`${baseName}.png`, `${baseName}.jpg`, `${baseName}.jpeg`, `${baseName}.webp`];
      for (const name of possibleNames) {
        try {
          const { data: tmplData, error: tmplError } = await adminClient.storage.from("templates").download(name);
          if (tmplError) continue;
          if (tmplData) {
            const ab = await tmplData.arrayBuffer();
            const b64 = safeBase64(ab);
            const ext = name.split(".").pop() || "png";
            console.log(`[TEMPLATE] ✅ Loaded: ${name} (${Math.round(ab.byteLength / 1024)}KB)`);
            return { mimeType: ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`, data: b64 };
          }
        } catch (e: any) {
          console.error(`[TEMPLATE] Error downloading ${name}:`, e?.message);
        }
      }
      return null;
    }

    // Load the global fallback template image (used when no per-slide image exists)
    let globalTemplateImage: { mimeType: string; data: string } | null = null;
    // Cache of per-slide template images: slideNumber → image
    const perSlideTemplateCache = new Map<number, { mimeType: string; data: string } | null>();

    if (templateKey) {
      // Pre-load per-slide template images for all slides we need to generate
      const slideNumbers = slidesToGenerate.map((s: any) => s.slide_number as number);
      const perSlideResults = await Promise.all(
        slideNumbers.map(async (num) => {
          const img = await downloadTemplateImage(`${templateKey}-${num}`);
          return { num, img };
        })
      );
      for (const { num, img } of perSlideResults) {
        perSlideTemplateCache.set(num, img);
      }

      // Load global fallback
      globalTemplateImage = await downloadTemplateImage(templateKey);

      const perSlideCount = perSlideResults.filter(r => r.img !== null).length;
      console.log(`[TEMPLATE] Per-slide images found: ${perSlideCount}/${slideNumbers.length}, global fallback: ${globalTemplateImage ? "yes" : "no"}`);
    }

    if (!globalTemplateImage && perSlideTemplateCache.size === 0) {
      console.warn(`[TEMPLATE] ⚠️ No template images found for "${templateKey}".`);
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Cache of per-slide template analyses: slideNumber → layout
    const perSlideLayoutCache = new Map<number, SlideLayoutAnalysis>();

    // Analyze global template layout as fallback (only if no per-slide images exist)
    let globalTemplateLayout: SlideLayoutAnalysis | null = null;
    const hasAnyPerSlideTemplates = Array.from(perSlideTemplateCache.values()).some(v => v !== null);
    if (!hasAnyPerSlideTemplates && globalTemplateImage) {
      globalTemplateLayout = await analyzeTemplateSlide(ai, globalTemplateImage.data, globalTemplateImage.mimeType);
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
            const fallbackLayout: SlideLayoutAnalysis = {
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
            };

            // ── Resolve per-slide template image & analysis ──
            // Priority: per-slide template (template-key-N.png) > global template (template-key.png)
            const perSlideTemplate = perSlideTemplateCache.get(displayNum) || null;
            const slideTemplateImage = perSlideTemplate || globalTemplateImage;

            let slideLayout: SlideLayoutAnalysis | null = null;
            if (perSlideTemplate) {
              // Analyze this specific template slide (cache to avoid re-analyzing on retry)
              if (!perSlideLayoutCache.has(displayNum)) {
                console.log(`[ANALYSIS] Analyzing per-slide template for slide ${displayNum}...`);
                perSlideLayoutCache.set(displayNum, await analyzeTemplateSlide(ai, perSlideTemplate.data, perSlideTemplate.mimeType));
              }
              slideLayout = perSlideLayoutCache.get(displayNum)!;
            } else {
              slideLayout = globalTemplateLayout;
            }

            console.log(`[TEMPLATE] Slide ${displayNum}: using ${perSlideTemplate ? "per-slide" : globalTemplateImage ? "global fallback" : "no"} template`);

            const rawScreenReferences = referenceImages.filter((r) => r.assetType === "raw_screen");
            const exactRawScreen = rawScreenReferences.find((r) => r.tag === slide.raw_screen_tag);
            const fallbackRawScreen = rawScreenReferences[Math.min(displayNum - 1, Math.max(rawScreenReferences.length - 1, 0))] || rawScreenReferences[0];
            const selectedRawScreen = slide.raw_screen_tag ? (exactRawScreen || fallbackRawScreen) : null;

            const prompt = buildSlidePrompt({
              slide: { ...slide, total_slides: allSlides.length },
              project,
              brandKit,
              layout: slideLayout || fallbackLayout,
              isFirstSlide: displayNum === 1,
              totalSlides: allSlides.length,
              hasPreviousSlides: previousSlideImages.length > 0,
              hasRawScreen: !!selectedRawScreen,
              userFeedback,
              deviceFormats,
            });

            // Build image parts for Gemini
            const parts: any[] = [];

            // PART 1: The prompt text
            parts.push({ text: prompt });

            // PART 2: Template image for THIS SPECIFIC SLIDE (PRIMARY VISUAL REFERENCE — MUST be first image)
            if (slideTemplateImage) {
              parts.push({
                inlineData: { mimeType: slideTemplateImage.mimeType, data: slideTemplateImage.data },
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

            // PART 5: Previously generated slides for continuity (max 3: first + 2 most recent)
            if (previousSlideImages.length > 0) {
              parts.push({ text: "[PREVIOUSLY GENERATED SLIDES — match their visual identity, color palette, and typography for set consistency]" });
              // Include: anchor slide (first) + up to 2 most recent for maximum continuity signal
              const anchors: typeof previousSlideImages = [];
              anchors.push(previousSlideImages[0]); // First slide = anchor identity
              if (previousSlideImages.length > 2) {
                anchors.push(previousSlideImages[previousSlideImages.length - 2]); // Second-to-last
              }
              if (previousSlideImages.length > 1) {
                anchors.push(previousSlideImages[previousSlideImages.length - 1]); // Most recent
              }
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

            console.log(`[GENERATE] Slide ${displayNum}: ${imgCount} images in context, template=${perSlideTemplate ? "per-slide" : slideTemplateImage ? "global" : "none"}, rawScreen=${!!selectedRawScreen}, prevSlides=${previousSlideImages.length}`);

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
                contents: [{ text: `${prompt}\n\nCRITICAL: You MUST generate an image. Return an App Store screenshot image.` }, ...(slideTemplateImage ? [{ inlineData: { mimeType: slideTemplateImage.mimeType, data: slideTemplateImage.data } }] : [])],
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
