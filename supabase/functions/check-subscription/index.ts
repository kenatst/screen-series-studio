import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { PRODUCT_NAME_TO_PLAN, toPlanId } from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const safeIsoFromUnixSeconds = (value: unknown): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

function resolvePlanFromPriceItem(priceItem: Stripe.SubscriptionItem | undefined): "free" | "starter" | "pro" | "unlimited" {
  if (!priceItem) return "free";
  const price = priceItem.price;

  const planFromPriceMetadata = toPlanId(price.metadata?.plan);
  if (planFromPriceMetadata !== "free") return planFromPriceMetadata;

  const product = price.product;
  if (product && typeof product !== "string") {
    const planFromProductMetadata = toPlanId(product.metadata?.plan);
    if (planFromProductMetadata !== "free") return planFromProductMetadata;
    return PRODUCT_NAME_TO_PLAN[product.name] ?? "starter";
  }

  return "starter";
}

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
    const stripeKey = Deno.env.get("STRIPE_TEST_SECRET");
    if (!stripeKey) throw new Error("STRIPE_TEST_SECRET is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { data: profileRow } = await supabaseClient
      .from("profiles")
      .select("plan, credits")
      .eq("id", user.id)
      .maybeSingle();

    const currentPlan = profileRow?.plan ?? "free";
    const currentCredits = profileRow?.credits ?? 0;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      if (currentPlan !== "free") {
        await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", user.id);
      }

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        credits: currentCredits,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    await supabaseClient.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price.product"],
    });

    if (subscriptions.data.length === 0) {
      if (currentPlan !== "free") {
        await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", user.id);
      }

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        credits: currentCredits,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    const priceItem = subscription.items?.data?.[0];
    if (!priceItem) {
      return new Response(JSON.stringify({
        subscribed: true,
        plan: currentPlan,
        credits: currentCredits,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedPlan = resolvePlanFromPriceItem(priceItem);

    // Billing credits are handled by webhook events (invoice.paid) to avoid double grants.
    // This endpoint only syncs plan identity and subscription end metadata.
    const nextCredits = currentCredits;

    const subscriptionEnd = safeIsoFromUnixSeconds(subscription.current_period_end);

    await supabaseClient
      .from("profiles")
      .update({ plan: resolvedPlan, credits: nextCredits, stripe_customer_id: customerId })
      .eq("id", user.id);

    logStep("Subscription synced", {
      userId: user.id,
      plan: resolvedPlan,
      credits: nextCredits,
      subscriptionEnd,
    });

    return new Response(JSON.stringify({
      subscribed: true,
      plan: resolvedPlan,
      credits: nextCredits,
      subscription_end: subscriptionEnd,
    }), {
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
