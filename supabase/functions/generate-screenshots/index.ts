import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.44.0";
import { creditCreditsAtomic, debitCreditsAtomic } from "../_shared/credits.ts";
import { claimFunctionIdempotency } from "../_shared/idempotency.ts";
import { arrayBufferToBase64, base64ToUint8Array } from "../_shared/base64.ts";
import { checkFunctionRateLimit } from "../_shared/rate-limit.ts";
import { buildSlidePrompt, DEVICE_DIMENSIONS } from "./prompt-builder.ts";
import { analyzeTemplateSet, type TemplateSetAnalysis } from "./template-analysis.ts";
import { parseQualityScore } from "./quality.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const CREDIT_COST_PER_SLIDE = 1;
const GENERATE_RATE_LIMIT_PER_MINUTE = 15;

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

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    if (idempotencyKey) {
      const claimed = await claimFunctionIdempotency(
        adminClient as any,
        userId,
        "generate-screenshots",
        idempotencyKey,
        120,
      );
      if (!claimed) {
        return new Response(JSON.stringify({ error: "Duplicate request detected in progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const withinRateLimit = await checkFunctionRateLimit(
      adminClient as any,
      userId,
      "generate-screenshots",
      GENERATE_RATE_LIMIT_PER_MINUTE,
    );
    if (!withinRateLimit) {
      return new Response(JSON.stringify({ error: "Too many generation requests. Please wait a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const { data: profileData } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
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
        const base64 = arrayBufferToBase64(arrayBuffer);
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
            const b64 = arrayBufferToBase64(ab);
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
    const projectConfig = (project.config as any) || {};
    const cachedTemplateAnalysis = projectConfig?.template_analysis;

    if (
      cachedTemplateAnalysis?.template_id === templateKey &&
      cachedTemplateAnalysis?.analysis &&
      Array.isArray(cachedTemplateAnalysis.analysis.slides)
    ) {
      templateSetAnalysis = cachedTemplateAnalysis.analysis as TemplateSetAnalysis;
      console.log(`[TEMPLATE] ♻️ Reusing cached template analysis for "${templateKey}"`);
    } else if (templateImage) {
      templateSetAnalysis = await analyzeTemplateSet(ai as any, templateImage.data, templateImage.mimeType);
      console.log(`[TEMPLATE] Template has ${templateSetAnalysis.totalSlides} slides. Project needs ${allSlides.length} slides.`);

      await adminClient.from("projects").update({
        config: {
          ...projectConfig,
          template_analysis: {
            template_id: templateKey,
            analyzed_at: new Date().toISOString(),
            analysis: templateSetAnalysis,
          },
        },
      }).eq("id", projectId);
    }

    // ── Update project status ──
    if (!singleSlideId) {
      await adminClient.from("projects").update({ status: "generating" }).eq("id", projectId);
    }

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    // ALWAYS generate base images as 6.5" iPhone (9:16).
    // Other sizes (6.9", iPad) are produced later via resize-slides.
    const deviceFormats = ["iphone-6-5"];
    const primaryFormat = "iphone-6-5";
    const aspectRatio = "9:16";
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
            previousSlideImages.push({ mimeType: "image/png", data: arrayBufferToBase64(ab) });
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
          const shouldBillSlide = Boolean(singleSlideId || forceRegenerate || !(resumeGeneration && slide.status === "generating"));
          let creditReserved = false;
          sendEvent("slide-start", { slideNumber: displayNum, total: allSlides.length });
          const slideStartMs = Date.now();
          await adminClient.from("project_slides").update({ status: "generating", attempt_count: (slide.attempt_count || 0) + 1 }).eq("id", slide.id);

          try {
            if (shouldBillSlide) {
              const remaining = await debitCreditsAtomic(adminClient as any, userId, CREDIT_COST_PER_SLIDE);
              if (remaining === null) {
                throw new Error("Insufficient credits to generate this slide.");
              }
              creditReserved = true;
            }

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

            // Enforce a strict context cap to stay under model input limits.
            let imgCount = 0;
            for (let j = parts.length - 1; j >= 0; j--) {
              if ((parts[j] as any).inlineData) {
                imgCount++;
                if (imgCount > 10) parts.splice(j, 1);
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

            const firstPassQuality = parseQualityScore(text);

            // Auto-repair: retry once if no image or low quality score available.
            if (!imageBase64 || (firstPassQuality !== null && firstPassQuality < 70)) {
              console.warn(`[GENERATE] Slide ${displayNum}: Retrying (hasImage=${Boolean(imageBase64)}, quality=${firstPassQuality ?? "n/a"})`);
              const retryResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-image-preview",
                contents: [
                  ...parts,
                  { text: "CRITICAL REFINEMENT: improve readability, spacing precision, and overall polish while preserving exact requested text." },
                ],
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
            const imageBytes = base64ToUint8Array(imageBase64);
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
            if (creditReserved) {
              try {
                await creditCreditsAtomic(adminClient as any, userId, CREDIT_COST_PER_SLIDE);
              } catch (refundError) {
                console.error(`[GENERATE] Refund failed for slide ${displayNum}:`, refundError);
              }
            }
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
