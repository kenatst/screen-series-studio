import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    // Get user plan
    const { data: profile } = await userClient.from("profiles").select("plan").eq("id", userId).single();
    const userPlan = profile?.plan || "free";
    const isWatermarked = userPlan === "free";

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const locale = url.searchParams.get("locale") || "en-US";

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify ownership
    const { data: project, error: projError } = await userClient.from("projects").select("id, name, device_formats").eq("id", projectId).single();
    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch completed slides
    const { data: slides } = await userClient.from("project_slides").select("slide_number, image_url").eq("project_id", projectId).eq("status", "completed").order("slide_number");
    if (!slides?.length) {
      return new Response(JSON.stringify({ error: "No completed slides" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const deviceFormats = (project.device_formats as string[]) || ["iphone-6-9"];

    // Build download URLs
    const downloads: { slide: number; url: string; format: string; watermarked: boolean }[] = [];

    for (const slide of slides) {
      for (const format of deviceFormats) {
        const storagePath = `${userId}/${projectId}/slide-${slide.slide_number}.png`;
        const { data: signedData } = await adminClient.storage.from("generated-outputs").createSignedUrl(storagePath, 60 * 60);
        if (signedData?.signedUrl) {
          let finalUrl = signedData.signedUrl;

          // For free plan, apply watermark via image transformation query param
          // Since we can't do server-side image manipulation easily in edge functions,
          // we'll flag watermarked=true and let the frontend overlay the watermark
          downloads.push({
            slide: slide.slide_number,
            url: finalUrl,
            format,
            watermarked: isWatermarked,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      project_name: project.name,
      locale,
      watermarked: isWatermarked,
      downloads,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("export-zip error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
