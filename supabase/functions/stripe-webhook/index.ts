import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1T8kgjCGD5S3rFVNQIKU0KKc": "starter",
  "price_1T8kgkCGD5S3rFVNbzJcYs22": "pro",
  "price_1T8kglCGD5S3rFVN3Q3K0ql6": "unlimited",
};

const PLAN_CREDITS: Record<string, number> = {
  free: 3,
  starter: 50,
  pro: 200,
  unlimited: 1000,
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
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
        const plan = session.metadata?.plan;
        const customerId = session.customer as string;

        if (userId && plan) {
          const credits = PLAN_CREDITS[plan] || 3;
          await supabase.from("profiles").update({
            plan,
            stripe_customer_id: customerId,
            credits,
          }).eq("id", userId);
          logStep("Plan updated + credits granted via checkout", { userId, plan, credits, customerId });
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

        // Sync plan and refill credits on recurring payment
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (prof) {
          const sub = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
          if (sub.data.length > 0) {
            const priceId = sub.data[0].items.data[0]?.price?.id;
            const activePlan = PRICE_TO_PLAN[priceId] || "starter";
            const credits = PLAN_CREDITS[activePlan] || 50;
            await supabase.from("profiles").update({ plan: activePlan, credits }).eq("id", prof.id);
            logStep("Plan synced + credits refilled on invoice.paid", { userId: prof.id, plan: activePlan, credits });
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
              const priceId = subscription.items.data[0]?.price?.id;
              const plan = isActive ? (PRICE_TO_PLAN[priceId] || "starter") : "free";
              const credits = PLAN_CREDITS[plan] || 3;
              await supabase.from("profiles").update({ plan, stripe_customer_id: customerId, credits }).eq("id", profileByEmail.id);
              logStep("Plan updated via email lookup", { userId: profileByEmail.id, plan, credits });
            }
          }
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id;
        const plan = isActive ? (PRICE_TO_PLAN[priceId] || "starter") : "free";
        const credits = PLAN_CREDITS[plan] || 3;
        await supabase.from("profiles").update({ plan, credits }).eq("id", profile.id);
        logStep("Plan updated", { userId: profile.id, plan, credits, status: subscription.status });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("Payment failed", { customerId });
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
