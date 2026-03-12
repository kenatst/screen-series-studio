import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Template metadata for embedding generation
const TEMPLATES = [
  { name: "Habit Tracker", description: "Dark vibrant habit tracking app with progress rings, streak counters, and motivational UI. Clean grid layout with purple/blue accent colors." },
  { name: "AI Coach", description: "Premium editorial coaching app with bold typography, dark background, energetic gradients. Features AI conversation interface and progress tracking." },
  { name: "Map Explorer", description: "Clean geographic social app with map-centric UI, light theme, location pins, and community features. Playful 3D elements." },
  { name: "Subscription Manager", description: "Premium gradient fintech app for tracking subscriptions. Dark sleek design with neon accents, cost breakdown charts, and calendar views." },
  { name: "Hydration", description: "Playful colorful water tracking app with friendly mascot character, bubbly animations, and bright blue/cyan palette on light background." },
  { name: "Sugar Free", description: "Organic warm nutrition app focused on sugar-free diet tracking. Light theme with earthy tones, food photography, and motivational quotes." },
  { name: "Aura Mood", description: "Luxury minimal meditation app with elegant dark theme, subtle gradient orbs, ambient lighting effects, and premium serif typography." },
  { name: "Scribe Notes", description: "Structured corporate note-taking app with clean white UI, feature-focused layout, productivity widgets, and organized content hierarchy." },
  { name: "Personal Trainer", description: "Bold energetic fitness app with high-contrast dark theme, action photography, progress charts, and dynamic workout interface with red/orange accents." },
  { name: "Stackr Finance", description: "Premium data-driven fintech investment app. Dark gradient background with vibrant charts, portfolio breakdowns, and sophisticated typography." },
  { name: "Trainer AI", description: "Futuristic AI-powered fitness app with bold tech aesthetic, neon highlights on dark background, 3D body mapping, and smart workout suggestions." },
  { name: "Stackr Yellow", description: "Vibrant modern finance app with bold yellow/black color scheme, cashback tracking, card management, and striking typography." },
  { name: "Vow Couples", description: "Romantic elegant relationship app with warm rose/gold tones, soft photography, love language quizzes, and premium serif fonts on light background." },
  { name: "RPG Gaming", description: "Immersive dramatic gaming app with fantasy UI elements, dark atmosphere, character stats, quest tracking, and medieval-inspired decorative borders." },
  { name: "Cram Study", description: "Playful educational flashcard app with neon accents on dark background, gamified learning progress, spaced repetition UI, and colorful category tags." },
  { name: "AdBlock Shield", description: "Tech minimal security utility app with dark theme, shield iconography, stats dashboard, and powerful protection visualization." },
  { name: "Drift Meditation", description: "Calm serene sleep/meditation app with dark ambient theme, cosmic visuals, gentle gradients, soothing color palette of deep blues and purples." },
  { name: "Life Coaching", description: "Professional warm self-improvement app with organic wellness aesthetic, inspirational imagery, goal tracking, and earthy green/brown palette on light background." },
  { name: "Tape Recorder", description: "Retro creative audio app with dark warm theme, vintage tape deck UI elements, waveform visualization, and nostalgic analog aesthetics." },
  { name: "Solo Travel", description: "Corporate blue travel planner app with clean layout, destination cards, itinerary management, and professional photography integration on light background." },
  { name: "MindDrop Journal", description: "Dark gold premium journaling app with elegant typography, mood tracking circles, gratitude prompts, and luxurious black/gold color scheme." },
  { name: "Meal Planner", description: "Fresh organic meal planning app with vibrant food photography, colorful recipe cards, nutritional breakdowns, and green/orange palette on light background." },
  { name: "Vault Security", description: "Finance dark password vault app with premium black theme, biometric UI elements, encrypted data visualization, and trust-building security indicators." },
  { name: "LinguaFlow", description: "Gradient vibrant language learning app with colorful progress indicators, interactive lesson cards, speech bubbles, and engaging gamification elements." },
  { name: "Nestle Wellness", description: "Editorial minimal corporate wellness app with clean white design, branded imagery, health metrics dashboard, and professional typography." },
  { name: "LifePlan Goals", description: "Warm adventure goal-tracking app with structured milestone timeline, motivating progress visualization, and earthy neutral colors on clean background." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // This function requires service role - no user auth needed
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceKey);

    const results: { name: string; status: string }[] = [];

    for (const template of TEMPLATES) {
      try {
        // Check if already embedded
        const { data: existing } = await adminClient
          .from("template_embeddings")
          .select("id")
          .eq("template_name", template.name)
          .maybeSingle();

        if (existing) {
          results.push({ name: template.name, status: "already_exists" });
          continue;
        }

        // Generate text embedding from template description
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: {
                parts: [{ text: `App store screenshot template: ${template.name}. ${template.description}` }],
              },
              taskType: "RETRIEVAL_DOCUMENT",
              outputDimensionality: 768,
            }),
          }
        );

        if (!embeddingResponse.ok) {
          const errText = await embeddingResponse.text();
          console.error(`Embedding failed for ${template.name}:`, errText);
          results.push({ name: template.name, status: "embedding_failed" });
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const values = embeddingData?.embedding?.values;

        if (!values || values.length !== 768) {
          results.push({ name: template.name, status: "invalid_embedding" });
          continue;
        }

        // Insert into database
        const { error: insertError } = await adminClient
          .from("template_embeddings")
          .insert({
            template_name: template.name,
            embedding: JSON.stringify(values),
            visual_summary: template.description,
            metadata: { tags: [], mood: "", category: "" },
          });

        if (insertError) {
          console.error(`Insert failed for ${template.name}:`, insertError);
          results.push({ name: template.name, status: "insert_failed" });
        } else {
          results.push({ name: template.name, status: "success" });
        }

        // Rate limit: small delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (e: any) {
        console.error(`Error processing ${template.name}:`, e);
        results.push({ name: template.name, status: "error" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("seed-template-embeddings error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
