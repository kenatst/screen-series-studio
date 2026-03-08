import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { GoogleGenAI } from "npm:@google/genai@^1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_SLIDE = 1;

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
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { project_id, target_language, source_language } = await req.json();
    if (!project_id || !target_language) {
      return new Response(JSON.stringify({ error: "project_id and target_language required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch completed slides with images
    const { data: slides, error } = await userClient
      .from("project_slides")
      .select("id, slide_number, image_url, headline, subheadline")
      .eq("project_id", project_id)
      .eq("status", "completed")
      .order("slide_number");

    if (error || !slides?.length) {
      return new Response(JSON.stringify({ error: "No completed slides found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const totalCost = slides.length * CREDIT_COST_PER_SLIDE;
    const { data: profileData } = await adminClient.from("profiles").select("credits").eq("id", userId).single();
    const currentCredits = profileData?.credits ?? 0;

    if (currentCredits < totalCost) {
      return new Response(JSON.stringify({ error: `Crédits insuffisants. Il faut ${totalCost} crédit(s), vous en avez ${currentCredits}.` }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (totalCost > 0) {
      await adminClient.from("profiles").update({ credits: currentCredits - totalCost }).eq("id", userId);
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const translatedSlides: { slide_number: number; imageUrl: string }[] = [];

    for (const slide of slides) {
      try {
        // Download the existing slide image from storage
        const storagePath = `${userId}/${project_id}/slide-${slide.slide_number}.png`;
        const { data: fileData } = await adminClient.storage.from("generated-outputs").download(storagePath);

        if (!fileData) {
          console.error(`No image found for slide ${slide.slide_number}`);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Use Gemini image generation to translate text in the image
        const translationPrompt = `Translate all visible text in the image from ${source_language || "English"} to natural ${target_language}.

Do not change anything else.
Do not modify layout, spacing, alignment, font size, font weight, colors, or image composition.
Do not add, remove, or rephrase content.
Keep the tone calm, minimal, and reassuring.
Text translation only.`;

        const contents: any[] = [
          { text: translationPrompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents,
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "9:16", imageSize: "2K" },
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

        // Upload translated image with locale suffix
        const langCode = target_language.toLowerCase().replace(/\s+/g, "-").slice(0, 5);
        const translatedPath = `${userId}/${project_id}/slide-${slide.slide_number}-${langCode}.png`;
        const imageBytes = Uint8Array.from(atob(newImageBase64), (c) => c.charCodeAt(0));
        await adminClient.storage.from("generated-outputs").upload(translatedPath, imageBytes, {
          contentType: "image/png",
          upsert: true,
        });

        const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(translatedPath, 60 * 60 * 24 * 7);
        translatedSlides.push({
          slide_number: slide.slide_number,
          imageUrl: signedData?.signedUrl || "",
        });
      } catch (err: any) {
        console.error(`Translation error for slide ${slide.slide_number}:`, err);
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
