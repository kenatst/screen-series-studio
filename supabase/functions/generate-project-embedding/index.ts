import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent";
const EMBED_DIM = 768;

function parseEmbeddingToArray(value: unknown): number[] | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const arr = value.map((v) => Number(v));
    return arr.every((v) => Number.isFinite(v)) ? arr : null;
  }

  if (typeof value === "string") {
    try {
      const normalized = value.trim().replace(/^\[/, "").replace(/\]$/, "");
      if (!normalized) return null;
      const arr = normalized.split(",").map((v) => Number(v.trim()));
      return arr.every((v) => Number.isFinite(v)) ? arr : null;
    } catch {
      return null;
    }
  }

  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { screenshot_urls, logo_url, user_inspiration_text, app_name, app_description, context_text } = await req.json();

    // Build multimodal parts for a single embedding call
    // gemini-embedding-2-preview supports text + images in the same request
    const contentParts: any[] = [];
    const imageWeights: { index: number; weight: number }[] = [];

    // Add context text as the first part
    const textContent = [
      app_name ? `App: ${app_name}` : "",
      app_description ? `Description: ${app_description}` : "",
      user_inspiration_text ? `Style inspiration: ${user_inspiration_text}` : "",
    ].filter(Boolean).join(". ");

    if (textContent) {
      contentParts.push({ text: textContent });
    }

    // Fetch and add screenshots as inline_data parts
    const screenshotUrls = (screenshot_urls || []).slice(0, 3);
    for (const url of screenshotUrls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const arrayBuffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = resp.headers.get("content-type") || "image/png";
        contentParts.push({ inline_data: { mime_type: contentType, data: base64 } });
      } catch (e) {
        console.warn("Failed to fetch screenshot:", e);
      }
    }

    // Fetch and add logo
    if (logo_url) {
      try {
        const resp = await fetch(logo_url);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const contentType = resp.headers.get("content-type") || "image/png";
          contentParts.push({ inline_data: { mime_type: contentType, data: base64 } });
        }
      } catch (e) {
        console.warn("Failed to fetch logo:", e);
      }
    }

    if (contentParts.length === 0) {
      return new Response(JSON.stringify({ error: "At least one image or text input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single multimodal embedding call — gemini-embedding-2-preview handles
    // text + images natively in a unified vector space
    const embeddingResponse = await fetch(`${GEMINI_EMBED_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: contentParts },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBED_DIM,
      }),
    });

    if (!embeddingResponse.ok) {
      const errText = await embeddingResponse.text();
      console.error("Gemini Embedding 2 API error:", errText);
      return new Response(JSON.stringify({ error: "Embedding generation failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddingData = await embeddingResponse.json();
    const projectVector = embeddingData?.embedding?.values;

    if (!projectVector || projectVector.length !== EMBED_DIM) {
      return new Response(JSON.stringify({ error: "Invalid embedding dimensions returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize the vector
    const magnitude = Math.sqrt(projectVector.reduce((sum: number, v: number) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < EMBED_DIM; i++) {
        projectVector[i] /= magnitude;
      }
    }

    // Query for similar templates
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: matches, error: matchError } = await adminClient.rpc("match_templates", {
      query_embedding: JSON.stringify(projectVector),
      match_limit: 5,
      similarity_threshold: 0.1,
    });

    if (matchError) {
      console.error("match_templates RPC error:", matchError);
    }

    // Generate explainability summary for the top match using Lovable AI
    let copilotSummary = "";
    if (matches && matches.length > 0) {
      const topMatch = matches[0];
      try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: "You are a creative design assistant. Generate a single concise sentence (max 30 words) explaining why a template matches an app's visual identity. Be specific about colors, layout density, and aesthetic. Do not use generic phrases.",
                },
                {
                  role: "user",
                  content: `App: "${app_name || 'Unknown'}". Description: "${app_description || 'N/A'}". Best matching template: "${topMatch.template_name}" (summary: ${topMatch.visual_summary || 'N/A'}). Similarity: ${(topMatch.similarity * 100).toFixed(0)}%. Explain why this template is a great visual match.`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            copilotSummary = aiData.choices?.[0]?.message?.content || "";
          }
        }
      } catch (e) {
        console.warn("Copilot summary generation failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        matches: matches || [],
        copilot_summary: copilotSummary,
        parts_count: contentParts.length,
        model: "gemini-embedding-2-preview",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-project-embedding error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
