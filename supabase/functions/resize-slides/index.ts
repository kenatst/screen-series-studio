import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { creditCreditsAtomic, debitCreditsAtomic } from "../_shared/credits.ts";
import { arrayBufferToBase64, base64ToUint8Array } from "../_shared/base64.ts";
import { checkFunctionRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_SLIDE = 1;
const RESIZE_RATE_LIMIT_PER_MINUTE = 6;

type SlideRow = {
  id: string;
  slide_number: number;
  image_url: string | null;
  headline: string | null;
  subheadline: string | null;
  status: string | null;
};

const FORMAT_CONFIG: Record<string, { label: string; aspectRatio: string; suffix: string; width: number; height: number }> = {
  "iphone-6-5": { label: '6.5" iPhone', aspectRatio: "9:16", suffix: "6-5", width: 1242, height: 2688 },
  "iphone-6-9": { label: '6.9" iPhone', aspectRatio: "9:16", suffix: "6-9", width: 1320, height: 2868 },
  "ipad-12-9": { label: '12.9" iPad', aspectRatio: "3:4", suffix: "ipad", width: 2048, height: 2732 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { project_id, target_format } = await req.json();
    if (!project_id || !target_format) {
      return new Response(JSON.stringify({ error: "project_id and target_format required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const formatConfig = FORMAT_CONFIG[target_format];
    if (!formatConfig) {
      return new Response(JSON.stringify({ error: `Unknown format: ${target_format}. Valid: ${Object.keys(FORMAT_CONFIG).join(", ")}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify project ownership
    const { data: project } = await userClient.from("projects").select("id, app_name, name, device_formats").eq("id", project_id).single();
    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const withinLimit = await checkFunctionRateLimit(adminClient as any, userId, "resize-slides", RESIZE_RATE_LIMIT_PER_MINUTE);
    if (!withinLimit) {
      return new Response(JSON.stringify({ error: "Too many resize requests. Please wait a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch completed slides
    const { data: slides, error: slidesError } = await adminClient
      .from("project_slides")
      .select("id, slide_number, image_url, headline, subheadline, status")
      .eq("project_id", project_id)
      .order("slide_number");

    if (slidesError) {
      return new Response(JSON.stringify({ error: "Failed to fetch slides" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const completedSlides = ((slides || []) as SlideRow[]).filter((slide) => Boolean(slide.image_url) && slide.status === "completed");
    if (completedSlides.length === 0) {
      return new Response(JSON.stringify({ error: "No completed slides found. Generate screenshots first." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Credit check
    const totalCost = completedSlides.length * CREDIT_COST_PER_SLIDE;
    const { data: profileData } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
    const currentCredits = profileData?.credits ?? 0;

    if (currentCredits < totalCost) {
      return new Response(JSON.stringify({ error: `Insufficient credits. Need ${totalCost}, have ${currentCredits}.` }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { GoogleGenAI } = await import("https://esm.sh/@google/genai@1.44.0");
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const resizedSlides: { slide_number: number; imageUrl: string; format: string; storage_path: string }[] = [];
    let insufficientCreditsDuringRun = false;
    const appName = project.app_name || project.name || "App";
    const isIpad = target_format.includes("ipad");

    for (const slide of completedSlides) {
      let reservedCredit = false;
      try {
        const reserved = await debitCreditsAtomic(adminClient as any, userId, CREDIT_COST_PER_SLIDE);
        if (reserved === null) {
          insufficientCreditsDuringRun = true;
          break;
        }
        reservedCredit = true;

        // Download original slide
        let storagePath: string;
        if (slide.image_url?.startsWith("http")) {
          storagePath = `${userId}/${project_id}/slide-${slide.slide_number}.png`;
        } else {
          storagePath = slide.image_url || `${userId}/${project_id}/slide-${slide.slide_number}.png`;
        }

        const { data: fileData, error: downloadError } = await adminClient.storage.from("generated-outputs").download(storagePath);
        if (downloadError || !fileData) {
          throw new Error(`Download failed for slide ${slide.slide_number}`);
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const imageBase64 = arrayBufferToBase64(arrayBuffer);

        const resizePrompt = isIpad
          ? `Adapt this iPhone App Store screenshot to an iPad 12.9" format (3:4 portrait aspect ratio).
Target pixel dimensions: ${formatConfig.width} × ${formatConfig.height} pixels.

CRITICAL RULES:
- KEEP the exact same design: same colors, typography, layout proportions, device mockup style
- ADAPT the composition for the wider 3:4 aspect ratio — expand the background naturally, reposition elements to fill the wider canvas
- If there's a phone mockup, replace it with an iPad mockup and keep the same relative position and visual weight on canvas
- Keep ALL text exactly as-is: headline "${slide.headline || ""}", subheadline "${slide.subheadline || ""}"
- Maintain the same visual quality, gradients, shadows, and decorative elements
- Scale text and UI elements appropriately for the ${formatConfig.width}×${formatConfig.height} resolution
- The result must look like the same designer created both versions — one for iPhone, one for iPad
- Output a complete, polished App Store screenshot for iPad`
          : `Adapt this App Store screenshot to a ${formatConfig.label} display format.
Target pixel dimensions: ${formatConfig.width} × ${formatConfig.height} pixels.

CRITICAL RULES:
- This is the SAME screenshot, just optimized for a ${formatConfig.label} display (${formatConfig.width}×${formatConfig.height}px)
- KEEP the exact same design: same colors, typography, layout, device mockup, background
- Keep ALL text exactly as-is: headline "${slide.headline || ""}", subheadline "${slide.subheadline || ""}"
- Maintain identical visual quality — same gradients, shadows, decorative elements
- Scale text and elements appropriately for the target ${formatConfig.width}×${formatConfig.height} resolution
- Only make subtle adjustments for the display size — slightly different spacing or proportions if needed
- The output must be virtually identical to the input, just formatted for ${formatConfig.label}
- Output a complete, polished App Store screenshot`;

        const contents = [
          { text: resizePrompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents,
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: formatConfig.aspectRatio, imageSize: "2K" },
          },
        });

        let newImageBase64 = "";
        const candidateParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of candidateParts) {
          const inlineData = (part as { inlineData?: { data?: string } }).inlineData;
          if (inlineData?.data) {
            newImageBase64 = inlineData.data;
          }
        }

        if (!newImageBase64) {
          throw new Error(`No resized image generated for slide ${slide.slide_number}`);
        }

        // Upload resized image
        const resizedPath = `${userId}/${project_id}/slide-${slide.slide_number}-${formatConfig.suffix}.png`;
        const imageBytes = base64ToUint8Array(newImageBase64);

        await adminClient.storage.from("generated-outputs").upload(resizedPath, imageBytes, {
          contentType: "image/png",
          upsert: true,
        });

        const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(resizedPath, 60 * 60 * 24 * 7);

        resizedSlides.push({
          slide_number: slide.slide_number,
          imageUrl: signedData?.signedUrl || "",
          format: target_format,
          storage_path: resizedPath,
        });

      } catch (err: unknown) {
        if (reservedCredit) {
          try {
            await creditCreditsAtomic(adminClient as any, userId, CREDIT_COST_PER_SLIDE);
          } catch (refundError) {
            console.error(`Refund failed for slide ${slide.slide_number}:`, refundError);
          }
        }
        console.error(`Resize error for slide ${slide.slide_number}:`, err instanceof Error ? err.message : String(err));
      }
    }

    return new Response(JSON.stringify({
      slides: resizedSlides,
      format: target_format,
      partial: insufficientCreditsDuringRun,
      message: insufficientCreditsDuringRun ? "Stopped early because credits ran out." : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("resize-slides error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
