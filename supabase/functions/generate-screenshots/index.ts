import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "npm:@google/genai@^1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConsistencyRules {
  level: "strict" | "balanced" | "exploratory";
  brandColors: string[];
  fontFamily?: string;
}

function buildConsistencyBlock(rules: ConsistencyRules, slideNumber: number, totalSlides: number): string {
  const { level, brandColors, fontFamily } = rules;
  const colorPalette = brandColors.length > 0
    ? `Color palette: ${brandColors.join(", ")}. Use these colors consistently.`
    : "Use a harmonious, professional color palette throughout.";
  const fontRule = fontFamily
    ? `Typography: Use "${fontFamily}" or a visually similar font for all text.`
    : "Typography: Use a clean, modern sans-serif font consistently.";

  let directive = "";
  if (level === "strict") {
    directive = `STRICT CONSISTENCY MODE: Every slide MUST use the exact same background style, gradient direction, color scheme. Phone mockup placement, size, shadow must be identical. Text positioning must follow the same grid.`;
  } else if (level === "balanced") {
    directive = `BALANCED CONSISTENCY MODE: Maintain same color palette and typography. Background can have subtle variations. Phone mockup style should be consistent. Layout can vary slightly.`;
  } else {
    directive = `EXPLORATORY MODE: Colors and typography loosely related. Creative freedom encouraged. Brand identity recognizable but varied.`;
  }

  return `--- CONSISTENCY ENGINE ---\nSlide ${slideNumber} of ${totalSlides}.\n${colorPalette}\n${fontRule}\n${directive}\n--- END CONSISTENCY ---`;
}

function buildSlidePrompt(slide: any, project: any, brandKit: any, consistencyLevel: string): string {
  const platformLabel = project.platform === "ios" ? "Apple App Store" : project.platform === "android" ? "Google Play Store" : "App Store / Google Play";
  const brandBlock = [
    brandKit?.colors?.length > 0 ? `Brand colors: ${brandKit.colors.join(", ")}` : "",
    brandKit?.fontFamily ? `Brand font: ${brandKit.fontFamily}` : "",
  ].filter(Boolean).join("\n");

  const consistency = buildConsistencyBlock(
    { level: (consistencyLevel as any) || "balanced", brandColors: brandKit?.colors || [], fontFamily: brandKit?.fontFamily },
    slide.slide_number, slide.total_slides || 5
  );

  return `You are an expert ${platformLabel} screenshot designer creating premium, conversion-optimized marketing screenshots.

=== APP INFO ===
App: ${project.app_name || project.name}
Description: ${project.app_description || ""}
Platform: ${platformLabel}

=== BRAND KIT ===
${brandBlock || "Use a professional, premium color palette."}

=== SLIDE ${slide.slide_number} OF ${slide.total_slides || 5} ===
Objective: ${slide.objective || "Feature spotlight"}
Headline: "${slide.headline || ""}"
Subheadline: "${slide.subheadline || ""}"
Visual emphasis: ${slide.emphasis || "UI focused"}
Raw screen tag: ${slide.raw_screen_tag || "home"}
Importance: ${slide.importance || "medium"}

=== INSTRUCTIONS ===
Generate a polished, premium ${platformLabel} screenshot in 9:16 portrait format.
1. The headline must be prominently displayed as large, bold text.
2. Include a realistic phone mockup showing the app screen.
3. The background must feel premium and polished.
4. PREVENT SEMANTIC LEAKAGE: Do NOT invent UI elements not in provided references.
5. BRAND CONSISTENCY: Preserve exact brand identity across all slides.
6. CLEAN OUTPUT: No App Store chrome or status bars outside the mockup.

${consistency}`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Get project_id from body (POST) or query
    let projectId: string;
    if (req.method === "POST") {
      const body = await req.json();
      projectId = body.project_id;
    } else {
      const url = new URL(req.url);
      projectId = url.searchParams.get("project_id") || "";
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role for DB operations during generation
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project (verify ownership)
    const { data: project, error: projError } = await userClient.from("projects").select("*").eq("id", projectId).single();
    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch slides
    const { data: slides, error: slidesError } = await userClient.from("project_slides").select("*").eq("project_id", projectId).order("slide_number", { ascending: true });
    if (slidesError || !slides || slides.length === 0) {
      return new Response(JSON.stringify({ error: "No slides found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch reference assets
    const { data: assets } = await userClient.from("assets").select("*").eq("project_id", projectId);

    // Download reference images from storage as base64
    const referenceImages: { mimeType: string; data: string }[] = [];
    if (assets) {
      for (const asset of assets.slice(0, 5)) {
        try {
          const { data: fileData } = await adminClient.storage.from("raw-uploads").download(asset.storage_path);
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            const ext = asset.storage_path.split(".").pop()?.toLowerCase() || "png";
            const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
            referenceImages.push({ mimeType: mime, data: base64 });
          }
        } catch { /* skip failed downloads */ }
      }
    }

    // Update project status
    await adminClient.from("projects").update({ status: "generating" }).eq("id", projectId);

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

        for (let i = 0; i < slidesToGenerate.length; i++) {
          const slide = slidesToGenerate[i];
          const displayNum = genMode === "creative-direction" ? i + 1 : slide.slide_number;

          sendEvent("slide-start", { slideNumber: displayNum, total: slidesToGenerate.length });

          // Update slide status
          await adminClient.from("project_slides").update({ status: "generating" }).eq("id", slide.id);

          try {
            const prompt = buildSlidePrompt(
              { ...slide, total_slides: slides.length },
              project,
              brandKit,
              project.consistency_level || "balanced"
            );

            const variantPrompt = genMode === "creative-direction"
              ? `${prompt}\n\nMETA: Provide creative variant #${i + 1} with a unique aesthetic spin while respecting the brand core.`
              : prompt;

            const contents: any[] = [{ text: variantPrompt }];
            for (const img of referenceImages.slice(0, 10)) {
              contents.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
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

            // Upload to storage
            const filename = `${userId}/${projectId}/slide-${displayNum}.png`;
            const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
            await adminClient.storage.from("generated-outputs").upload(filename, imageBytes, {
              contentType: "image/png",
              upsert: true,
            });

            const { data: urlData } = adminClient.storage.from("generated-outputs").getPublicUrl(filename);
            // Since bucket is private, use signed URL
            const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(filename, 60 * 60 * 24 * 7); // 7 days
            const imageUrl = signedData?.signedUrl || urlData.publicUrl;

            // Update slide in DB
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

        // Update project status
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
