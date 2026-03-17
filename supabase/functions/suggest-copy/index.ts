import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { creditCreditsAtomic, debitCreditsAtomic } from "../_shared/credits.ts";
import { checkFunctionRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Optional: Charge credits for suggestions or just verify existence
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const withinLimit = await checkFunctionRateLimit(adminClient as any, userData.user.id, "suggest-copy", 30);
    if (!withinLimit) {
      return new Response(JSON.stringify({ error: "Too many suggestion requests. Please wait a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await adminClient.from("profiles").select("credits").eq("id", userData.user.id).single();
    if ((profile?.credits ?? 0) < 1) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { type, appName, appDescription, storeUrl, platform, slideCount } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let toolDef: any = null;
    let toolChoice: any = null;

    if (type === "auto-fill") {
      systemPrompt = "You are an expert ASO (App Store Optimization) copywriter. Extract or generate compelling app marketing copy.";
      userPrompt = storeUrl
        ? `Given this app store URL: ${storeUrl}\nGenerate marketing copy for the app "${appName || 'this app'}". Include a short description (1 sentence), long description (2-3 sentences), value proposition (1 sentence), key features (3-5 bullet points), and top benefits (3-5 bullet points).`
        : `Generate marketing copy for an app called "${appName}". Description: ${appDescription || 'Not provided'}. Platform: ${platform || 'both'}. Include a short description, long description, value proposition, key features, and top benefits.`;
      toolDef = {
        type: "function",
        function: {
          name: "return_app_copy",
          description: "Return structured app marketing copy",
          parameters: {
            type: "object",
            properties: {
              shortDescription: { type: "string", description: "One sentence summary" },
              longDescription: { type: "string", description: "2-3 sentence full description" },
              valueProposition: { type: "string", description: "One compelling value line" },
              keyFeatures: { type: "array", items: { type: "string" }, description: "3-5 key features" },
              topBenefits: { type: "array", items: { type: "string" }, description: "3-5 user benefits" },
            },
            required: ["shortDescription", "longDescription", "valueProposition", "keyFeatures", "topBenefits"],
          },
        },
      };
      toolChoice = { type: "function", function: { name: "return_app_copy" } };
    } else if (type === "hooks") {
      systemPrompt = "You are an expert App Store screenshot copywriter specializing in high-conversion headlines.";
      userPrompt = `Generate 8 compelling headline hooks for an app called "${appName}". ${appDescription ? `Description: ${appDescription}.` : ""} Platform: ${platform || 'both'}. Each hook should be punchy, under 40 characters, and drive installs.`;
      toolDef = {
        type: "function",
        function: {
          name: "return_hooks",
          description: "Return headline hooks",
          parameters: {
            type: "object",
            properties: {
              hooks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    subheadline: { type: "string" },
                    angle: { type: "string", description: "The marketing angle (e.g. social proof, urgency, benefit)" },
                  },
                  required: ["headline", "subheadline", "angle"],
                },
              },
            },
            required: ["hooks"],
          },
        },
      };
      toolChoice = { type: "function", function: { name: "return_hooks" } };
    } else if (type === "storylines") {
      const count = slideCount || 5;
      systemPrompt = "You are an expert App Store Optimization strategist specializing in screenshot storyline planning.";
      userPrompt = `Create a ${count}-slide screenshot storyline for an app called "${appName}". ${appDescription ? `Description: ${appDescription}.` : ""} Platform: ${platform || 'both'}. Each slide needs an objective, headline, subheadline, emphasis type, and importance level. Follow ASO best practices for slide ordering.`;
      toolDef = {
        type: "function",
        function: {
          name: "return_storyline",
          description: "Return a complete screenshot storyline",
          parameters: {
            type: "object",
            properties: {
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    number: { type: "number" },
                    objective: { type: "string" },
                    headline: { type: "string" },
                    subheadline: { type: "string" },
                    emphasis: { type: "string", enum: ["UI focused", "text focused", "mascot focused", "illustration focused", "cinematic background", "clean product showcase", "icon-driven", "feature comparison"] },
                    importance: { type: "string", enum: ["high", "medium", "low"] },
                    rawScreenTag: { type: "string" },
                  },
                  required: ["number", "objective", "headline", "subheadline", "emphasis", "importance"],
                },
              },
            },
            required: ["slides"],
          },
        },
      };
      toolChoice = { type: "function", function: { name: "return_storyline" } };
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: auto-fill, hooks, or storylines" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reservedCredits = await debitCreditsAtomic(adminClient as any, userData.user.id, 1);
    if (reservedCredits === null) {
      return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result = {};
    let reservedCredit = false;
    try {
      reservedCredit = true;
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [toolDef],
          tool_choice: toolChoice,
        }),
      });

    // Deduct 1 credit after successful AI response
    // Atomic credit deduction
    await adminClient.rpc('deduct_credits', { p_user_id: userData.user.id, p_amount: 1 });
      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          if (reservedCredit) {
            await creditCreditsAtomic(adminClient as any, userData.user.id, 1);
            reservedCredit = false;
          }
          return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (status === 402) {
          if (reservedCredit) {
            await creditCreditsAtomic(adminClient as any, userData.user.id, 1);
            reservedCredit = false;
          }
          return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errText = await aiResponse.text();
        console.error("AI error:", status, errText);
        throw new Error("AI request failed");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      result = toolCall ? JSON.parse(toolCall.function.arguments) : {};
    } catch (aiError) {
      if (reservedCredit) {
        await creditCreditsAtomic(adminClient as any, userData.user.id, 1);
      }
      throw aiError;
    }

    return new Response(JSON.stringify({ type, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("suggest-copy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
