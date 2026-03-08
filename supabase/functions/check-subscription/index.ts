import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const PRODUCT_NAME_TO_PLAN: Record<string, string> = {
  "ScreenForge Starter": "starter",
  "ScreenForge Pro": "pro",
  "ScreenForge Unlimited": "unlimited",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_TEST_SECRET");
    if (!stripeKey) throw new Error("STRIPE_TEST_SECRET is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });
    await supabaseClient.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);

    logStep("Listing subscriptions...");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    logStep("Subscriptions listed", { count: subscriptions.data.length });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", user.id);
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    logStep("Raw subscription data", {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      current_period_end_type: typeof subscription.current_period_end,
    });

    const priceItem = subscription.items?.data?.[0];
    if (!priceItem) {
      logStep("No price item found in subscription");
      return new Response(JSON.stringify({ subscribed: true, plan: "starter", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = priceItem.price.product as string;
    logStep("Retrieving product", { productId });

    const product = await stripe.products.retrieve(productId);
    const plan = PRODUCT_NAME_TO_PLAN[product.name] || "starter";
    logStep("Product resolved", { productName: product.name, plan });

    // Safely compute subscription end
    let subscriptionEnd: string | null = null;
    const rawEnd = subscription.current_period_end;
    if (rawEnd && typeof rawEnd === "number" && rawEnd > 0) {
      const d = new Date(rawEnd * 1000);
      if (!isNaN(d.getTime())) {
        subscriptionEnd = d.toISOString();
      }
    }

    logStep("Active subscription found", { plan, subscriptionEnd });
    await supabaseClient.from("profiles").update({ plan }).eq("id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack?.slice(0, 500) });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
