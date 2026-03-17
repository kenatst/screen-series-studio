import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { creditsCapForPlan, PLAN_CREDITS, PRODUCT_NAME_TO_PLAN, toPlanId } from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

async function resolvePlanFromSubscriptionItem(
  stripe: Stripe,
  item: Stripe.SubscriptionItem | undefined,
): Promise<"free" | "starter" | "pro" | "unlimited"> {
  if (!item) return "free";

  const price = item.price;
  const fromPriceMetadata = toPlanId(price.metadata?.plan);
  if (fromPriceMetadata !== "free") return fromPriceMetadata;

  const product = price.product;
  if (product && typeof product !== "string") {
    const fromProductMetadata = toPlanId(product.metadata?.plan);
    if (fromProductMetadata !== "free") return fromProductMetadata;
    return PRODUCT_NAME_TO_PLAN[product.name] ?? "starter";
  }

  if (typeof product === "string") {
    const hydratedPrice = await stripe.prices.retrieve(price.id, { expand: ["product"] });
    if (hydratedPrice.product && typeof hydratedPrice.product !== "string") {
      const fromHydratedMetadata = toPlanId(hydratedPrice.product.metadata?.plan);
      if (fromHydratedMetadata !== "free") return fromHydratedMetadata;
      return PRODUCT_NAME_TO_PLAN[hydratedPrice.product.name] ?? "starter";
    }
  }

  return "starter";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_TEST_SECRET");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_TEST_SECRET or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    logStep("Signature verification failed", { error: err.message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = toPlanId(session.metadata?.plan);
        const customerId = session.customer as string;

        if (userId && plan !== "free") {
          await supabase.from("profiles").update({
            plan,
            stripe_customer_id: customerId,
          }).eq("id", userId);
          logStep("Plan linked via checkout.session.completed", { userId, plan, customerId });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.customer_email) {
          try {
            await stripe.invoices.sendInvoice(invoice.id);
            logStep("Invoice receipt sent", { invoiceId: invoice.id, email: invoice.customer_email });
          } catch (sendErr: any) {
            logStep("Could not send invoice (may already be sent)", { error: sendErr.message });
          }
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("id, credits")
          .eq("stripe_customer_id", customerId)
          .single();

        if (prof) {
          const sub = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
            expand: ["data.items.data.price.product"],
          });
          if (sub.data.length > 0) {
            const activePlan = await resolvePlanFromSubscriptionItem(stripe, sub.data[0].items.data[0]);
            const monthlyCredits = PLAN_CREDITS[activePlan] || PLAN_CREDITS.free;
            const cap = creditsCapForPlan(activePlan);
            const nextCredits = Math.min((prof.credits ?? 0) + monthlyCredits, cap);
            await supabase
              .from("profiles")
              .update({ plan: activePlan, credits: nextCredits })
              .eq("id", prof.id);
            logStep("Credits topped up on invoice.paid", {
              userId: prof.id,
              plan: activePlan,
              monthlyCredits,
              nextCredits,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === "active";

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          if (customer.email) {
            const { data: profileByEmail } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customer.email)
              .single();

            if (profileByEmail) {
              const plan = isActive ? await resolvePlanFromSubscriptionItem(stripe, subscription.items.data[0]) : "free";
              await supabase.from("profiles").update({ plan, stripe_customer_id: customerId }).eq("id", profileByEmail.id);
              logStep("Plan updated via email lookup", { userId: profileByEmail.id, plan });
            }
          }
          break;
        }

        const plan = isActive ? await resolvePlanFromSubscriptionItem(stripe, subscription.items.data[0]) : "free";
        await supabase.from("profiles").update({ plan }).eq("id", profile.id);
        logStep("Plan updated", { userId: profile.id, plan, status: subscription.status });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabase.from("profiles").update({ plan: "free" }).eq("id", profile.id);
          logStep("Payment failed, downgraded to free", { customerId, userId: profile.id });
        } else {
          logStep("Payment failed, no profile found", { customerId });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR processing event", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
