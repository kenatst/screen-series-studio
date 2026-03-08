import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "npm:@google/genai@^1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  templateStyleGuide: string
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

  return `You are an expert ${platformLabel} screenshot designer creating premium, conversion-optimized marketing screenshots.

=== APP INFO ===
App: ${project.app_name || project.name}
Description: ${project.app_description || ""}
Platform: ${platformLabel}
Primary goal: ${(project.config as any)?.primaryGoal || ""}

=== BRAND KIT ===
${brandBlock || "Use a professional, premium color palette."}

=== TEMPLATE STYLE ===
${templateStyleGuide || "Premium, modern, conversion-focused design."}

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
1. The headline "${slide.headline || ""}" must be prominently displayed as large, bold text.
2. The subheadline "${slide.subheadline || ""}" should appear below the headline in a smaller, lighter weight.
3. Include a realistic phone mockup showing the app's "${slide.raw_screen_tag || "home"}" screen.
4. The visual emphasis should be: ${slide.emphasis || "UI focused"}.
5. The background must match the template style provided.
6. The overall design should feel premium, polished, and conversion-focused.

=== QUALITY METRICS & SEMANTIC PRESERVATION (CRITICAL) ===
7. PREVENT SEMANTIC LEAKAGE: Do NOT invent, hallucinate, or insert UI elements, features, or text that are not present in the provided raw App Screen. The core app UI must be preserved faithfully.
8. BRAND & MASCOT CONSISTENCY: If a mascot, logo, or distinct brand character is provided in the references, its exact visual identity (colors, proportions, style) MUST be strictly preserved across all slides. Do not mutate the character.
9. EXACT COMPOSITING: If a raw app screenshot is provided as a reference, composite it INTO the phone mockup screen naturally without distorting its aspect ratio.
10. CLEAN OUTPUT: Do NOT include any App Store UI chrome, status bars outside the mockup, or store branding on the canvas.

${consistency}`.trim();
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
    if (req.method === "POST") {
      const body = await req.json();
      projectId = body.project_id;
    } else {
      const url = new URL(req.url);
      projectId = url.searchParams.get("project_id") || "";
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
    const { data: slides, error: slidesError } = await userClient.from("project_slides").select("*").eq("project_id", projectId).order("slide_number", { ascending: true });
    if (slidesError || !slides || slides.length === 0) {
      return new Response(JSON.stringify({ error: "No slides found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Update project status
    await adminClient.from("projects").update({ status: "generating" }).eq("id", projectId);

    // Template style guide (stored in config or default)
    const templateStyleGuide = "";

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const brandKit = project.brand_kit as any || {};
        const genMode = project.generation_mode || "full";
        let slidesToGenerate = slides;

        if (genMode === "first-3") {
          slidesToGenerate = slides.slice(0, 3);
        } else if (genMode === "creative-direction" && slides.length > 0) {
          slidesToGenerate = [slides[0], slides[0], slides[0]];
        }

        // Track previously generated images for context chaining
        const previousSlideImages: { mimeType: string; data: string }[] = [];

        for (let i = 0; i < slidesToGenerate.length; i++) {
          const slide = slidesToGenerate[i];
          const displayNum = genMode === "creative-direction" ? i + 1 : slide.slide_number;

          sendEvent("slide-start", { slideNumber: displayNum, total: slidesToGenerate.length });
          await adminClient.from("project_slides").update({ status: "generating" }).eq("id", slide.id);

          try {
            const prompt = buildSlidePrompt(
              { ...slide, total_slides: slides.length },
              project,
              brandKit,
              project.consistency_level || "balanced",
              templateStyleGuide
            );

            const variantPrompt = genMode === "creative-direction"
              ? `${prompt}\n\nMETA: Provide a creative variant for this specific art direction generation with a unique aesthetic spin, while continuing to strictly respect the brand core and core UI elements.`
              : prompt;

            // Build contents: prompt text + reference images + previous slides for context
            const contents: any[] = [{ text: variantPrompt }];

            // Add reference images (screens matching this slide's tag first)
            const matchingRef = referenceImages.find(r => r.tag === slide.raw_screen_tag);
            if (matchingRef) {
              contents.push({ inlineData: { mimeType: matchingRef.mimeType, data: matchingRef.data } });
            }

            // Add brand assets (logo, icon, mascot)
            for (const img of referenceImages.filter(r => ['logo', 'icon', 'mascot'].includes(r.tag || ''))) {
              contents.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
            }

            // Add other screen references
            for (const img of referenceImages.filter(r => r.tag !== slide.raw_screen_tag && !['logo', 'icon', 'mascot'].includes(r.tag || '')).slice(0, 3)) {
              contents.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
            }

            // CONTEXT CHAINING: Add previous slide images as reference for consistency
            // Use last 2 generated slides max to keep within limits
            if (previousSlideImages.length > 0 && genMode !== "creative-direction") {
              const recentSlides = previousSlideImages.slice(-2);
              for (const prevImg of recentSlides) {
                contents.push({
                  inlineData: { mimeType: prevImg.mimeType, data: prevImg.data },
                });
              }
              // Add context instruction
              contents[0] = {
                text: `${variantPrompt}\n\n=== PREVIOUS SLIDES CONTEXT ===\nThe following ${recentSlides.length} image(s) are the previously generated slides in this set. You MUST maintain strict visual consistency with them: same background treatment, same device mockup style, same typography hierarchy, same color usage patterns. The new slide should look like it belongs to the exact same set.\n=== END CONTEXT ===`,
              };
            }

            // Cap at 14 inline images total
            const imageContents = contents.filter((c: any) => c.inlineData);
            if (imageContents.length > 14) {
              // Keep only first 14 image contents
              let imgCount = 0;
              for (let j = contents.length - 1; j >= 0; j--) {
                if ((contents[j] as any).inlineData) {
                  imgCount++;
                  if (imgCount > 14) contents.splice(j, 1);
                }
              }
            }

            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-image-preview",
              contents,
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

            if (!imageBase64) throw new Error("No image generated");

            // Store this image for context chaining to next slides
            previousSlideImages.push({ mimeType: "image/png", data: imageBase64 });

            // Upload to storage
            const filename = `${userId}/${projectId}/slide-${displayNum}.png`;
            const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
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

            sendEvent("slide-done", { slideNumber: displayNum, imageUrl, text });
          } catch (error: any) {
            console.error(`Error generating slide ${displayNum}:`, error);
            await adminClient.from("project_slides").update({ status: "error" }).eq("id", slide.id);
            sendEvent("slide-error", { slideNumber: displayNum, message: error.message || "Generation failed" });
          }
        }

        await adminClient.from("projects").update({ status: "completed" }).eq("id", projectId);
        sendEvent("all-done", { projectId });
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
