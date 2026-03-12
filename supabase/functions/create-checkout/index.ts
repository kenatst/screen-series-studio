import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

/** Plan definitions — prices in cents (EUR) */
const PLAN_DEFS: Record<string, { name: string; amount: number; description: string }> = {
  starter: { name: "ShotApp Starter", amount: 4900, description: "50 credits/month, 1 workspace, HD export" },
  pro: { name: "ShotApp Pro", amount: 9900, description: "200 credits/month, 3 workspaces, priority generation" },
  unlimited: { name: "ShotApp Unlimited", amount: 39900, description: "1000 credits/month, unlimited projects" },
};

/**
 * Find or create a recurring EUR price for the given plan
 * inside the Stripe account linked to the current API key.
 */
async function resolvePrice(stripe: Stripe, planId: string): Promise<string> {
  const def = PLAN_DEFS[planId];
  if (!def) throw new Error(`Unknown plan: ${planId}`);

  // 1. Search for an existing active product by name
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find((p: any) => p.name === def.name);

  if (!product) {
    logStep("Creating product", { name: def.name });
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
    });
    logStep("Product created", { productId: product.id });
  } else {
    logStep("Found existing product", { productId: product.id });
  }

  // 2. Look for an existing recurring EUR price on this product
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 20,
  });
  let price = prices.data.find(
    (p: any) => p.currency === "eur" && p.unit_amount === def.amount && p.recurring?.interval === "month"
  );

  if (!price) {
    logStep("Creating price", { amount: def.amount });
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: def.amount,
      currency: "eur",
      recurring: { interval: "month" },
    });
    logStep("Price created", { priceId: price.id });
  } else {
    logStep("Found existing price", { priceId: price.id });
  }

  return price.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { plan, redirect_path } = await req.json();
    if (!PLAN_DEFS[plan]) throw new Error(`Invalid plan: ${plan}`);

    const stripeKey = Deno.env.get("STRIPE_TEST_SECRET") || "";
    if (!stripeKey) throw new Error("STRIPE_TEST_SECRET is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Log which Stripe account we're using
    const account = await stripe.accounts.retrieve();
    logStep("Using Stripe account", { accountId: account.id });

    // Resolve or create the price in THIS account
    const priceId = await resolvePrice(stripe, plan);

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin");
    const successPath = redirect_path || "/dashboard/settings";
    const successUrl = `${origin}${successPath}${successPath.includes('?') ? '&' : '?'}checkout=success`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      metadata: { user_id: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
