import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "npm:@google/genai@^1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_SLIDE = 1;
const AUTO_BATCH_SIZE = 1;
const QUALITY_SCORE_MIN = 78;

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
    directive = `STRICT CONSISTENCY MODE:
- Every slide MUST use the exact same background style, gradient direction, and color scheme.
- Phone mockup placement, size, and shadow style must be identical across slides.
- Text positioning (headline at top, subheadline below) must follow the same grid.
- Badge/label styling must be uniform.
- The overall feel should be as if all slides were designed in a single Figma frame.`;
  } else if (level === "balanced") {
    directive = `BALANCED CONSISTENCY MODE:
- Maintain the same color palette and typography across all slides.
- Background style should be cohesive but can have subtle variations (e.g., gradient shifts).
- Phone mockup style should be consistent (same device frame, shadow).
- Layout can vary slightly to match each slide's objective.
- The set should feel unified but not monotonous.`;
  } else {
    directive = `EXPLORATORY MODE:
- Colors and typography should remain loosely related but each slide can explore different layouts.
- The brand identity should be recognizable but creative freedom is encouraged.
- Different background treatments are acceptable.
- The set should feel like a creative collection from the same brand.`;
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

  const userDirective = userPrompt
    ? `\n\n=== USER DIRECTION ===\nThe user has specifically requested: "${userPrompt}"\nApply this direction while maintaining brand consistency and quality standards.\n=== END USER DIRECTION ===`
    : "";

  return `You are an expert ${platformLabel} screenshot designer creating premium, conversion-optimized marketing screenshots.

=== APP INFO ===
App: ${project.app_name || project.name}
Description: ${project.app_description || ""}
Platform: ${platformLabel}
Primary goal: ${(project.config as any)?.primaryGoal || ""}

=== BRAND KIT ===
${brandBlock || "Use a professional, premium color palette."}

=== SLIDE ${slide.slide_number} OF ${slide.total_slides || 5} ===
Objective: ${slide.objective || "Feature spotlight"}
Headline text: "${slide.headline || ""}"
Subheadline text: "${slide.subheadline || ""}"
Visual emphasis: ${slide.emphasis || "UI focused"}
Raw app screen to include: ${slide.raw_screen_tag || "home"}
Importance: ${slide.importance || "medium"}

=== INSTRUCTIONS ===
Generate a polished, premium ${platformLabel} screenshot in 9:16 portrait format.

Key requirements:
1. The headline "${slide.headline || ""}" must be prominently displayed as large, bold text and keep exact wording.
2. The subheadline "${slide.subheadline || ""}" should appear below the headline in a smaller, lighter weight and keep exact wording.
3. Include a realistic phone mockup showing the app's "${slide.raw_screen_tag || "home"}" screen.
4. The visual emphasis should be: ${slide.emphasis || "UI focused"}.
5. The background must match the template style provided.
6. The overall design should feel premium, polished, and conversion-focused.

=== QUALITY METRICS & SEMANTIC PRESERVATION (CRITICAL) ===
7. PREVENT SEMANTIC LEAKAGE: Do NOT invent, hallucinate, or insert UI elements, features, or text that are not present in the provided raw App Screen.
8. BRAND & MASCOT CONSISTENCY: If a mascot, logo, or distinct brand character is provided in the references, its exact visual identity (colors, proportions, style) MUST be strictly preserved across all slides.
9. EXACT COMPOSITING: If a raw app screenshot is provided as a reference, composite it into the phone mockup naturally without aspect ratio distortion.
10. CLEAN OUTPUT: Do NOT include any App Store UI chrome, status bars outside the mockup, or store branding on the canvas.
11. NO PLACEHOLDER COPY: Never output lorem ipsum, generic placeholders, or altered marketing copy.
12. LEGIBILITY: Ensure headline and subheadline are fully readable with strong contrast.

=== OUTPUT QA REPORT (MANDATORY) ===
Return a JSON object in TEXT modality only, with this exact schema:
{"overall_score": number, "checks": {"headline_exact": boolean, "subheadline_exact": boolean, "no_placeholder": boolean, "ui_preserved": boolean, "contrast_ok": boolean}, "issues": string[]}

${consistency}${userDirective}`.trim();
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
  } catch {
    return null;
  }

  return null;
}

function hasPlaceholderLeak(slide: any, rawText: string): boolean {
  const low = (rawText || "").toLowerCase();
  if (!low) return false;

  const forbidden = [
    "lorem ipsum",
    "your headline",
    "placeholder",
    "insert text",
    "sample text",
    "headline here",
  ];

  const requiredHeadline = (slide?.headline || "").trim().toLowerCase();
  if (requiredHeadline && low.includes("headline_mismatch")) return true;

  return forbidden.some((token) => low.includes(token));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    let projectId: string;
    let singleSlideId: string | undefined;
    let userPrompt: string | undefined;
    let forceRegenerate = false;
    let resumeGeneration = false;

    if (req.method === "POST") {
      const body = await req.json();
      projectId = body.project_id;
      singleSlideId = body.single_slide_id;
      userPrompt = body.user_prompt;
      forceRegenerate = body.force_regenerate === true;
      resumeGeneration = body.resume === true;
    } else {
      const url = new URL(req.url);
      projectId = url.searchParams.get("project_id") || "";
      forceRegenerate = url.searchParams.get("force_regenerate") === "true";
      resumeGeneration = url.searchParams.get("resume") === "true";
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project (verify ownership)
    const { data: project, error: projError } = await userClient.from("projects").select("*").eq("id", projectId).single();
    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch slides
    const { data: allSlides, error: slidesError } = await userClient.from("project_slides").select("*").eq("project_id", projectId).order("slide_number", { ascending: true });
    if (slidesError || !allSlides || allSlides.length === 0) {
      return new Response(JSON.stringify({ error: "No slides found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!singleSlideId && project.status === "generating" && !forceRegenerate && !resumeGeneration) {
      const activeGenerating = allSlides.some((s: any) => s.status === "generating" && !s.image_url);
      if (activeGenerating) {
        return new Response(JSON.stringify({ error: "Generation already in progress" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine which slides to generate
    const genMode = singleSlideId ? "single" : (project.generation_mode || "full");
    let candidateSlides = allSlides;

    if (singleSlideId) {
      const singleSlide = allSlides.find((s: any) => s.id === singleSlideId);
      if (!singleSlide) {
        return new Response(JSON.stringify({ error: "Slide not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      candidateSlides = [singleSlide];
    } else if (genMode === "first-3") {
      candidateSlides = allSlides.slice(0, 3);
    } else if (genMode === "creative-direction" && allSlides.length > 0) {
      candidateSlides = [allSlides[0], allSlides[0], allSlides[0]];
    }

    let slidesToGenerate = (singleSlideId || forceRegenerate)
      ? candidateSlides
      : candidateSlides.filter((slide: any) => !slide.image_url && (slide.status === "pending" || slide.status === "generating"));

    if (!singleSlideId && resumeGeneration) {
      const generatingIds = candidateSlides.filter((s: any) => s.status === "generating").map((s: any) => s.id);
      if (generatingIds.length > 0) {
        await adminClient.from("project_slides").update({ status: "pending" }).in("id", generatingIds);
      }

      slidesToGenerate = candidateSlides.filter((slide: any) => !(slide.status === "completed" && slide.image_url));
    }

    const invocationSlides = (!singleSlideId && !forceRegenerate)
      ? slidesToGenerate.slice(0, AUTO_BATCH_SIZE)
      : slidesToGenerate;

    // Check credits only for this invocation batch
    const { data: profileData } = await adminClient.from("profiles").select("credits, plan").eq("id", userId).single();
    const currentCredits = profileData?.credits ?? 0;

    const billableSlides = invocationSlides.filter((slide: any) => {
      if (singleSlideId || forceRegenerate) return true;
      if (resumeGeneration && slide.status === "generating") return false;
      return true;
    });

    const totalCost = billableSlides.length * CREDIT_COST_PER_SLIDE;

    if (currentCredits < totalCost) {
      return new Response(JSON.stringify({ error: `Crédits insuffisants. Il faut ${totalCost} crédit(s), vous en avez ${currentCredits}.` }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits upfront (only when needed)
    if (totalCost > 0) {
      await adminClient.from("profiles").update({ credits: currentCredits - totalCost }).eq("id", userId);
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
          .slice(-2);

        for (const contextSlide of contextSlides) {
          try {
            const contextPath = `${userId}/${projectId}/slide-${contextSlide.slide_number}.png`;
            const { data: contextData } = await adminClient.storage.from("generated-outputs").download(contextPath);
            if (!contextData) continue;
            const ab = await contextData.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
            previousSlideImages.push({ mimeType: "image/png", data: b64 });
          } catch {
            // ignore context download failures
          }
        }

        if (invocationSlides.length === 0) {
          if (!singleSlideId) {
            const { data: remainingSlides } = await adminClient
              .from("project_slides")
              .select("status,image_url")
              .eq("project_id", projectId);

            const pendingOrGenerating = (remainingSlides || []).filter(
              (s: any) => !s.image_url && (s.status === "pending" || s.status === "generating")
            );

            const hasMore = pendingOrGenerating.length > 0;
            await adminClient
              .from("projects")
              .update({ status: hasMore ? "generating" : "completed" })
              .eq("id", projectId);

            sendEvent("all-done", { projectId, hasMore, remaining: pendingOrGenerating.length });
          } else {
            sendEvent("all-done", { projectId, hasMore: false, remaining: 0 });
          }
          controller.close();
          return;
        }

        for (let i = 0; i < invocationSlides.length; i++) {
          const slide = invocationSlides[i];
          const displayNum = genMode === "creative-direction" ? i + 1 : slide.slide_number;

          sendEvent("slide-start", { slideNumber: displayNum, total: invocationSlides.length });
          await adminClient.from("project_slides").update({ status: "generating" }).eq("id", slide.id);

          try {
            const prompt = buildSlidePrompt(
              { ...slide, total_slides: allSlides.length },
              project,
              brandKit,
              project.consistency_level || "balanced",
              userPrompt
            );

            const variantPrompt = genMode === "creative-direction"
              ? `${prompt}\n\nMETA: Provide a creative variant for this specific art direction generation with a unique aesthetic spin, while continuing to strictly respect the brand core and core UI elements.`
              : prompt;

            const buildContents = (promptText: string) => {
              const parts: any[] = [{ text: promptText }];

              const matchingRef = referenceImages.find((r) => r.tag === slide.raw_screen_tag);
              if (matchingRef) {
                parts.push({ inlineData: { mimeType: matchingRef.mimeType, data: matchingRef.data } });
              }

              for (const img of referenceImages.filter((r) => ["logo", "icon", "mascot"].includes(r.tag || ""))) {
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
              }

              for (const img of referenceImages.filter((r) => r.tag !== slide.raw_screen_tag && !["logo", "icon", "mascot"].includes(r.tag || "")).slice(0, 3)) {
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
              }

              if (previousSlideImages.length > 0) {
                const recentSlides = previousSlideImages.slice(-2);
                for (const prevImg of recentSlides) {
                  parts.push({ inlineData: { mimeType: prevImg.mimeType, data: prevImg.data } });
                }
                parts[0] = {
                  text: `${promptText}\n\n=== PREVIOUS SLIDES CONTEXT ===\nThe following ${recentSlides.length} image(s) are previously generated slides in this set. You MUST maintain strict visual consistency with them: same background treatment, same device mockup style, same typography hierarchy, same color usage patterns.\n=== END CONTEXT ===`,
                };
              }

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
                model: "gemini-3-pro-image-preview",
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

            const filename = `${userId}/${projectId}/slide-${displayNum}.png`;
            const imageBytes = Uint8Array.from(atob(attempt.imageBase64), (c) => c.charCodeAt(0));
            await adminClient.storage.from("generated-outputs").upload(filename, imageBytes, {
              contentType: "image/png",
              upsert: true,
            });

            const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(filename, 60 * 60 * 24 * 7);
            const imageUrl = signedData?.signedUrl || "";

            await adminClient.from("project_slides").update({
              status: "completed",
              image_url: imageUrl,
            }).eq("id", slide.id);

            sendEvent("slide-done", {
              slideNumber: displayNum,
              imageUrl,
              text: attempt.text,
              qualityScore: attempt.qualityScore,
            });
          } catch (error: any) {
            console.error(`Error generating slide ${displayNum}:`, error);
            await adminClient.from("project_slides").update({ status: "error" }).eq("id", slide.id);
            sendEvent("slide-error", { slideNumber: displayNum, message: error.message || "Generation failed" });
          }
        }

        if (!singleSlideId) {
          const { data: remainingSlides } = await adminClient
            .from("project_slides")
            .select("status,image_url")
            .eq("project_id", projectId);

          const pendingOrGenerating = (remainingSlides || []).filter(
            (s: any) => !s.image_url && (s.status === "pending" || s.status === "generating")
          );

          const hasMore = !forceRegenerate && pendingOrGenerating.length > 0;
          await adminClient
            .from("projects")
            .update({ status: hasMore ? "generating" : "completed" })
            .eq("id", projectId);

          sendEvent("all-done", { projectId, hasMore, remaining: pendingOrGenerating.length });
        } else {
          sendEvent("all-done", { projectId, hasMore: false, remaining: 0 });
        }
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
