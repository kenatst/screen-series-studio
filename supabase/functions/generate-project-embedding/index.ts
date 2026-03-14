import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * TEMPLATE RECOMMENDATION ENGINE — Powered by Gemini 3.1 Flash Preview
 * 
 * This function analyzes user-uploaded screenshots, logos, and text context
 * then visually compares them against our 26 template preview images to find
 * the best style matches. Unlike embedding-based approaches, this uses actual
 * visual understanding to recommend templates.
 */

const TEMPLATE_CATALOG: Record<string, {
  displayName: string;
  tags: string[];
  tone: string;
  mood: string;
  category: string;
  layoutDescription: string;
}> = {
  "habit-tracker": { displayName: "Habit Tracker", tags: ["minimal","professional","clean"], tone: "corporate", mood: "light", category: "Lifestyle", layoutDescription: "Clean white background with soft rounded cards, progress rings, centered phone mockup. Pastel accents." },
  "ai-coach": { displayName: "AI Coach", tags: ["vibrant","energetic","dynamic"], tone: "bold", mood: "dark", category: "Entertainment", layoutDescription: "Dark gradient with neon accent glows. Bold typography, dynamic phone angle with energy lines." },
  "map-explorer": { displayName: "Map Explorer", tags: ["clean","geographic","social"], tone: "minimalist", mood: "light", category: "Lifestyle", layoutDescription: "Light airy background with map patterns. Earth-tone accents, clean sans-serif." },
  "subscription-manager": { displayName: "Subscription Manager", tags: ["premium","gradient","sleek"], tone: "premium", mood: "dark", category: "Business", layoutDescription: "Deep dark gradient with glassmorphism. Metallic phone frame, gold/purple accents." },
  "hydration": { displayName: "Hydration", tags: ["playful","colorful","friendly"], tone: "playful", mood: "colorful", category: "Lifestyle", layoutDescription: "Bright colorful with water-themed illustrations. Blue/cyan palette, bouncy typography." },
  "sugar-free": { displayName: "Sugar Free", tags: ["organic","warm","aspirational"], tone: "minimalist", mood: "light", category: "Lifestyle", layoutDescription: "Warm cream/beige with organic shapes. Food photography, natural green accents." },
  "aura-mood": { displayName: "Aura Mood", tags: ["luxury","minimal","elegant"], tone: "premium", mood: "dark", category: "Luxury", layoutDescription: "Deep purple/indigo gradient with aurora borealis. Thin elegant typography, ambient glow." },
  "scribe-notes": { displayName: "Scribe Notes", tags: ["structured","feature-focused","clear"], tone: "corporate", mood: "light", category: "Business", layoutDescription: "Clean white/gray with structured grid. Feature callouts, blue/gray palette." },
  "personal-trainer": { displayName: "Personal Trainer", tags: ["bold","energetic","dynamic"], tone: "bold", mood: "dark", category: "Entertainment", layoutDescription: "High-contrast dark with fiery orange/red. Athletic photography, bold condensed uppercase." },
  "stackr-finance": { displayName: "Stackr Finance", tags: ["premium","gradient","data-driven"], tone: "premium", mood: "dark", category: "Business", layoutDescription: "Dark navy/charcoal with green accent. Financial charts, metallic device, monospace numbers." },
  "trainer-ai": { displayName: "Trainer AI", tags: ["futuristic","bold","tech"], tone: "bold", mood: "dark", category: "Entertainment", layoutDescription: "Futuristic dark with circuit/AI patterns. Neon cyan, bold geometric typography." },
  "stackr-yellow": { displayName: "Stackr Yellow", tags: ["vibrant","modern","bold"], tone: "bold", mood: "colorful", category: "Business", layoutDescription: "Vibrant yellow/gold on dark. Strong geometric shapes, ultra-bold sans-serif." },
  "vow-couples": { displayName: "Vow Couples", tags: ["romantic","warm","elegant"], tone: "premium", mood: "light", category: "Lifestyle", layoutDescription: "Soft pink/rose gradient. Romantic warm lighting, elegant script + sans-serif." },
  "rpg-gaming": { displayName: "RPG Gaming", tags: ["gaming","immersive","dramatic"], tone: "bold", mood: "dark", category: "Entertainment", layoutDescription: "Epic dark fantasy with dramatic lighting. Game UI elements, fantasy typography." },
  "cram-study": { displayName: "Cram Study", tags: ["playful","educational","colorful"], tone: "playful", mood: "colorful", category: "Education", layoutDescription: "Bright multi-color with stacked card motifs. Emoji accents, progress indicators." },
  "adblock-shield": { displayName: "AdBlock Shield", tags: ["tech","minimal","powerful"], tone: "corporate", mood: "dark", category: "Business", layoutDescription: "Dark with shield/security iconography. Blue/green accent, clean corporate type." },
  "drift-meditation": { displayName: "Drift Meditation", tags: ["calm","minimal","serene"], tone: "minimalist", mood: "dark", category: "Luxury", layoutDescription: "Deep navy/midnight blue with star-like particles. Ultra-minimal, thin light typography." },
  "life-coaching": { displayName: "Life Coaching", tags: ["professional","warm","inspiring"], tone: "corporate", mood: "light", category: "Education", layoutDescription: "Warm white/cream with geometric patterns. Orange/amber accents, coaching dashboard." },
  "tape-recorder": { displayName: "Tape Recorder", tags: ["retro","creative","unique"], tone: "bold", mood: "dark", category: "Media", layoutDescription: "Retro-inspired dark with cassette/vinyl textures. Vintage amber/brown/cream palette." },
  "solo-travel": { displayName: "Solo Travel", tags: ["adventurous","organic","free"], tone: "minimalist", mood: "light", category: "Lifestyle", layoutDescription: "Light with travel photography. Hand-drawn accents, clean modern typography." },
  "minddrop-journal": { displayName: "MindDrop Journal", tags: ["calm","minimal","thoughtful"], tone: "minimalist", mood: "neutral", category: "Lifestyle", layoutDescription: "Soft neutral warm gray/beige. Generous margins, thoughtful serif headlines." },
  "meal-planner": { displayName: "Meal Planner", tags: ["fresh","colorful","friendly"], tone: "playful", mood: "colorful", category: "Lifestyle", layoutDescription: "Bright fresh with food photography. Green/orange palette, recipe cards." },
  "vault-security": { displayName: "Vault Security", tags: ["dark","premium","secure"], tone: "premium", mood: "dark", category: "Business", layoutDescription: "Ultra-dark with vault/lock iconography. Green/cyan matrix accents, biometric elements." },
  "linguaflow": { displayName: "LinguaFlow", tags: ["playful","educational","colorful"], tone: "playful", mood: "colorful", category: "Education", layoutDescription: "Colorful gradient with flag/language elements. Multiple script samples, progress streaks." },
  "nestle-wellness": { displayName: "Nestle Wellness", tags: ["organic","clean","premium"], tone: "corporate", mood: "light", category: "Lifestyle", layoutDescription: "Clean white with subtle green organic accents. Premium corporate photography." },
  "lifeplan-goals": { displayName: "LifePlan Goals", tags: ["structured","motivating","clear"], tone: "corporate", mood: "neutral", category: "Business", layoutDescription: "Neutral gray/white with structured grid. Orange/teal accents, progress bars." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      screenshot_urls,
      logo_url,
      user_inspiration_text,
      app_name,
      app_description,
      context_text,
    } = await req.json();

    // Build the analysis prompt
    const templateList = Object.entries(TEMPLATE_CATALOG)
      .map(([key, t]) => `- "${t.displayName}" (key: ${key}): ${t.tags.join(", ")} | ${t.tone} tone | ${t.mood} mood | ${t.category} | ${t.layoutDescription}`)
      .join("\n");

    const systemPrompt = `You are an expert App Store screenshot design director. Your job is to analyze a user's app (screenshots, logo, description) and recommend the TOP 5 best-matching templates from our catalog based on visual style compatibility, mood alignment, and category fit.

TEMPLATE CATALOG (26 templates):
${templateList}

ANALYSIS CRITERIA (in order of importance):
1. VISUAL STYLE MATCH: Does the app's UI color scheme, density, and aesthetic match the template's mood/tone?
2. CATEGORY FIT: Is the template designed for this type of app?
3. MOOD ALIGNMENT: Does the template's energy level match the app's personality?
4. LAYOUT COMPATIBILITY: Will the app's screenshots look natural in this template's composition?

OUTPUT FORMAT — You MUST call the "recommend_templates" tool with your analysis.`;

    // Build user message content parts
    const userParts: any[] = [];

    // Text context
    const contextLines = [
      app_name ? `App Name: "${app_name}"` : "",
      app_description ? `Description: "${app_description}"` : "",
      user_inspiration_text ? `User's style notes: "${user_inspiration_text}"` : "",
      context_text ? `Additional context: ${context_text}` : "",
    ].filter(Boolean);

    userParts.push({
      type: "text",
      text: `Analyze this app and recommend the 5 best-matching templates:\n\n${contextLines.join("\n")}\n\n${screenshot_urls?.length ? "I'm providing screenshots of the app below." : "No screenshots provided."} ${logo_url ? "I'm also providing the app logo." : ""}`,
    });

    // Add screenshots as image_url parts (data URIs or URLs)
    const screenshotList = (screenshot_urls || []).slice(0, 4);
    for (const url of screenshotList) {
      userParts.push({ type: "image_url", image_url: { url } });
    }

    // Add logo
    if (logo_url) {
      userParts.push({ type: "image_url", image_url: { url: logo_url } });
    }

    // Call Gemini 3.1 Flash Preview via Lovable AI Gateway with tool calling
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
          { role: "user", content: userParts },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_templates",
              description: "Return the top 5 template recommendations with match scores and reasoning",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        template_name: { type: "string", description: "The display name of the template (e.g. 'Habit Tracker', 'Stackr Finance')" },
                        similarity: { type: "number", description: "Match score from 0.0 to 1.0 where 1.0 is perfect match" },
                        reason: { type: "string", description: "One sentence explaining why this template matches (be specific about colors, layout, mood)" },
                      },
                      required: ["template_name", "similarity", "reason"],
                    },
                  },
                  copilot_summary: { type: "string", description: "A concise 1-2 sentence summary of the app's visual identity and why the top pick is ideal" },
                },
                required: ["matches", "copilot_summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_templates" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI did not return structured recommendations" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Validate and normalize template names against our catalog
    const validDisplayNames = new Set(Object.values(TEMPLATE_CATALOG).map(t => t.displayName));
    const validatedMatches = (result.matches || [])
      .filter((m: any) => validDisplayNames.has(m.template_name))
      .map((m: any) => ({
        template_name: m.template_name,
        similarity: Math.max(0, Math.min(1, Number(m.similarity) || 0)),
        visual_summary: m.reason || null,
        metadata: null,
      }))
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        matches: validatedMatches,
        copilot_summary: result.copilot_summary || "",
        model: "gemini-3-flash-preview",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("generate-project-embedding error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
