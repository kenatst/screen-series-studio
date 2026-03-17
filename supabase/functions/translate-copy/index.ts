import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_SLIDE = 1;

/** Chunked base64 encoding that doesn't blow the stack */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    chunks.push(String.fromCharCode(...slice));
  }
  return btoa(chunks.join(""));
}

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // We need native Gemini for image generation (gateway doesn't support IMAGE modality)
    // Use GoogleGenAI if available, otherwise fail gracefully
    const apiKey = geminiApiKey || lovableApiKey;
    if (!apiKey) {
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

    const { project_id, target_language, source_language, device_format } = await req.json();
    if (!project_id || !target_language) {
      return new Response(JSON.stringify({ error: "project_id and target_language required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Device format config with exact App Store pixel dimensions
    const FORMAT_CONFIG: Record<string, { suffix: string; width: number; height: number; aspectRatio: string }> = {
      "iphone-6-5": { suffix: "6-5", width: 1242, height: 2688, aspectRatio: "9:16" },
      "iphone-6-9": { suffix: "6-9", width: 1320, height: 2868, aspectRatio: "9:16" },
      "ipad-12-9":  { suffix: "ipad", width: 2048, height: 2732, aspectRatio: "3:4" },
    };
    const activeFormat = device_format || "iphone-6-5";
    const fmtConfig = FORMAT_CONFIG[activeFormat] || FORMAT_CONFIG["iphone-6-5"];
    const formatSuffix = fmtConfig.suffix;
    const isPrimary = !device_format || device_format === "iphone-6-5";
    const aspectRatio = fmtConfig.aspectRatio;

    // Verify project ownership
    const { data: projectCheck } = await userClient.from("projects").select("id").eq("id", project_id).single();
    if (!projectCheck) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch slides - check for completed status OR slides with image_url
    const { data: slides, error } = await adminClient
      .from("project_slides")
      .select("id, slide_number, image_url, headline, subheadline, status")
      .eq("project_id", project_id)
      .order("slide_number");

    if (error) {
      console.error("Error fetching slides:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch slides" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter to slides that have an image (completed or with image_url)
    const completedSlides = (slides || []).filter(
      (s: any) => s.image_url && (s.status === "completed" || s.image_url)
    );

    if (completedSlides.length === 0) {
      console.error("No slides with images found. Slides:", JSON.stringify(slides?.map(s => ({ id: s.id, status: s.status, has_image: !!s.image_url }))));
      return new Response(JSON.stringify({ error: "No slides with images found. Generate screenshots first." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const totalCost = completedSlides.length * CREDIT_COST_PER_SLIDE;
    const { data: profileData } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
    const currentCredits = profileData?.credits ?? 0;

    if (currentCredits < totalCost) {
      return new Response(JSON.stringify({ error: `Insufficient credits. Need ${totalCost}, have ${currentCredits}.` }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dynamic import of GoogleGenAI
    const { GoogleGenAI } = await import("https://esm.sh/@google/genai@1.44.0");
    const ai = new GoogleGenAI({ apiKey: geminiApiKey || apiKey });

    const translatedSlides: { slide_number: number; imageUrl: string }[] = [];
    let creditsDeducted = 0;

    // Process all slides in batch
    for (const slide of completedSlides) {
      try {
        // Resolve storage path based on device format
        let storagePath: string;
        if (isPrimary) {
          // Primary format — use original slide image
          if (slide.image_url!.startsWith("http")) {
            storagePath = `${userId}/${project_id}/slide-${slide.slide_number}.png`;
          } else {
            storagePath = slide.image_url!;
          }
        } else {
          // Non-primary format — load from resized path
          storagePath = `${userId}/${project_id}/slide-${slide.slide_number}-${formatSuffix}.png`;
        }

        const { data: fileData, error: downloadError } = await adminClient.storage.from("generated-outputs").download(storagePath);
        if (downloadError || !fileData) {
          console.error(`Download failed for slide ${slide.slide_number}:`, downloadError?.message, "path:", storagePath);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const imageBase64 = arrayBufferToBase64(arrayBuffer);

        const translationPrompt = `Translate all visible text in this app store screenshot image from ${source_language || "English"} to natural ${target_language}.
Target display: ${fmtConfig.width}×${fmtConfig.height} pixels.

CRITICAL RULES:
- Only translate text. Do not modify layout, spacing, alignment, font size, font weight, colors, or image composition.
- Do not add, remove, or rephrase content.
- Keep the tone calm, minimal, and reassuring.
- Preserve all UI elements, icons, and graphics exactly as they are.
- Maintain text at a scale appropriate for the ${fmtConfig.width}×${fmtConfig.height} resolution.
- The output must be a complete image identical to the input except with translated text.`;

        const contents: any[] = [
          { text: translationPrompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents,
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio, imageSize: "2K" },
          } as any,
        });

        let newImageBase64 = "";
        if (response.candidates && response.candidates[0]) {
          for (const part of response.candidates[0].content!.parts!) {
            if ((part as any).inlineData) {
              newImageBase64 = (part as any).inlineData.data;
            }
          }
        }

        if (!newImageBase64) {
          console.error(`No translated image generated for slide ${slide.slide_number}`);
          continue;
        }

        // Upload translated image
        const langCode = target_language.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 5);
        const formatTag = isPrimary ? "" : `-${formatSuffix}`;
        const translatedPath = `${userId}/${project_id}/slide-${slide.slide_number}${formatTag}-${langCode}.png`;

        // Chunked decode
        const raw = atob(newImageBase64);
        const imageBytes = new Uint8Array(raw.length);
        for (let j = 0; j < raw.length; j++) {
          imageBytes[j] = raw.charCodeAt(j);
        }

        await adminClient.storage.from("generated-outputs").upload(translatedPath, imageBytes, {
          contentType: "image/png",
          upsert: true,
        });

        const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(translatedPath, 60 * 60 * 24 * 7);

        translatedSlides.push({
          slide_number: slide.slide_number,
          imageUrl: signedData?.signedUrl || "",
        });

        // Persist translation record to DB
        await adminClient.from("project_translations").insert({
          project_id,
          user_id: userId,
          slide_number: slide.slide_number,
          target_language,
          source_language: source_language || "English",
          storage_path: translatedPath,
          device_format: activeFormat,
        });

        // Atomic credit deduction — prevents race conditions
        creditsDeducted += 1;
        const { data: deductResult } = await adminClient.rpc('deduct_credits', { p_user_id: userId, p_amount: 1 });
        if (deductResult === -1) {
          console.warn(`[TRANSLATE] Insufficient credits for slide ${slide.slide_number}, stopping.`);
          break;
        }
      } catch (err: any) {
        console.error(`Translation error for slide ${slide.slide_number}:`, err?.message || err);
      }
    }

    return new Response(JSON.stringify({ translations: translatedSlides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("translate-copy error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
