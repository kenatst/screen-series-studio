import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1T8dfrCGD5S3rFVN3ICqIL16": "starter",
  "price_1T8dfsCGD5S3rFVN15HwuGyY": "pro",
  "price_1T8dfuCGD5S3rFVNICPdomP6": "unlimited",
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
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
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
          await supabase.from("profiles").update({
            plan,
            stripe_customer_id: customerId,
          }).eq("id", userId);
          logStep("Plan updated via checkout", { userId, plan, customerId });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Send receipt email via Stripe by ensuring receipt_email is set
        if (invoice.customer_email) {
          try {
            await stripe.invoices.sendInvoice(invoice.id);
            logStep("Invoice receipt sent", { invoiceId: invoice.id, email: invoice.customer_email });
          } catch (sendErr: any) {
            // Invoice may already be sent or in a state that doesn't allow sending
            logStep("Could not send invoice (may already be sent)", { error: sendErr.message });
          }
        }

        // Also sync plan status
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
            await supabase.from("profiles").update({ plan: activePlan }).eq("id", prof.id);
            logStep("Plan synced on invoice.paid", { userId: prof.id, plan: activePlan });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === "active";

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          // Try to find by email via Stripe customer
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
              await supabase.from("profiles").update({ plan, stripe_customer_id: customerId }).eq("id", profileByEmail.id);
              logStep("Plan updated via email lookup", { userId: profileByEmail.id, plan });
            }
          }
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id;
        const plan = isActive ? (PRICE_TO_PLAN[priceId] || "starter") : "free";
        await supabase.from("profiles").update({ plan }).eq("id", profile.id);
        logStep("Plan updated", { userId: profile.id, plan, status: subscription.status });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("Payment failed", { customerId });
        // Optionally downgrade after repeated failures
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
