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

    const { screenshot_urls, logo_url, user_inspiration_text, app_name, app_description } = await req.json();

    // Collect image parts for multimodal embedding
    const imageParts: { weight: number; base64: string; mimeType: string }[] = [];

    // Process screenshots (weight: 70% distributed)
    const screenshotUrls = (screenshot_urls || []).slice(0, 3);
    for (const url of screenshotUrls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const arrayBuffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = resp.headers.get("content-type") || "image/png";
        imageParts.push({ weight: 0.7 / screenshotUrls.length, base64, mimeType: contentType });
      } catch (e) {
        console.warn("Failed to fetch screenshot:", e);
      }
    }

    // Process logo (weight: 30%)
    if (logo_url) {
      try {
        const resp = await fetch(logo_url);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const contentType = resp.headers.get("content-type") || "image/png";
          imageParts.push({ weight: 0.3, base64, mimeType: contentType });
        }
      } catch (e) {
        console.warn("Failed to fetch logo:", e);
      }
    }

    if (imageParts.length === 0 && !user_inspiration_text) {
      return new Response(JSON.stringify({ error: "At least one image or text input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate embeddings using Gemini Embedding API
    const embeddings: { vector: number[]; weight: number }[] = [];

    // Embed each image individually
    for (const part of imageParts) {
      try {
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: {
                parts: [
                  { inline_data: { mime_type: part.mimeType, data: part.base64 } },
                ],
              },
              taskType: "RETRIEVAL_QUERY",
              outputDimensionality: 768,
            }),
          }
        );

        if (!embeddingResponse.ok) {
          const errText = await embeddingResponse.text();
          console.error("Embedding API error:", errText);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const values = embeddingData?.embedding?.values;
        if (values && values.length === 768) {
          embeddings.push({ vector: values, weight: part.weight });
        }
      } catch (e) {
        console.error("Embedding error for image:", e);
      }
    }

    // Embed text context
    if (user_inspiration_text || app_description) {
      const textContent = [
        app_name ? `App: ${app_name}` : "",
        app_description ? `Description: ${app_description}` : "",
        user_inspiration_text ? `Style inspiration: ${user_inspiration_text}` : "",
      ].filter(Boolean).join(". ");

      if (textContent) {
        try {
          const textEmbeddingResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: { parts: [{ text: textContent }] },
                taskType: "RETRIEVAL_QUERY",
                outputDimensionality: 768,
              }),
            }
          );

          if (textEmbeddingResponse.ok) {
            const textData = await textEmbeddingResponse.json();
            const values = textData?.embedding?.values;
            if (values && values.length === 768) {
              // Text gets 20% weight when images exist, 100% when alone
              const textWeight = embeddings.length > 0 ? 0.2 : 1.0;
              embeddings.push({ vector: values, weight: textWeight });
            }
          }
        } catch (e) {
          console.error("Text embedding error:", e);
        }
      }
    }

    if (embeddings.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to generate any embeddings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Weighted average of all embeddings → "Project DNA" vector
    const totalWeight = embeddings.reduce((sum, e) => sum + e.weight, 0);
    const projectVector = new Array(768).fill(0);
    for (const emb of embeddings) {
      const normalizedWeight = emb.weight / totalWeight;
      for (let i = 0; i < 768; i++) {
        projectVector[i] += emb.vector[i] * normalizedWeight;
      }
    }

    // Normalize the final vector
    const magnitude = Math.sqrt(projectVector.reduce((sum: number, v: number) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < 768; i++) {
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
        embedding_count: embeddings.length,
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
