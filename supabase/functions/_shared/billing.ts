export type PlanId = "free" | "starter" | "pro" | "unlimited";

export const PLAN_CREDITS: Record<PlanId, number> = {
  free: 3,
  starter: 50,
  pro: 200,
  unlimited: 1000,
};

export const PRODUCT_NAME_TO_PLAN: Record<string, PlanId> = {
  "ShotApp Starter": "starter",
  "ShotApp Pro": "pro",
  "ShotApp Unlimited": "unlimited",
};

export const PLAN_DEFS: Record<Exclude<PlanId, "free">, { name: string; amount: number; description: string }> = {
  starter: { name: "ShotApp Starter", amount: 4900, description: "50 credits/month, 1 workspace, HD export" },
  pro: { name: "ShotApp Pro", amount: 9900, description: "200 credits/month, 3 workspaces, priority generation" },
  unlimited: { name: "ShotApp Unlimited", amount: 39900, description: "1000 credits/month, unlimited projects" },
};

export function toPlanId(value: string | null | undefined): PlanId {
  if (value === "starter" || value === "pro" || value === "unlimited" || value === "free") {
    return value;
  }
  return "free";
}

export function creditsCapForPlan(plan: PlanId): number {
  return PLAN_CREDITS[plan] * 2;
}

type PaidPlanId = Exclude<PlanId, "free">;

export function getConfiguredPriceId(plan: PaidPlanId): string | null {
  const denoEnvGet = (globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno?.env?.get;
  if (!denoEnvGet) return null;

  const keyByPlan: Record<PaidPlanId, string> = {
    starter: "STRIPE_PRICE_STARTER",
    pro: "STRIPE_PRICE_PRO",
    unlimited: "STRIPE_PRICE_UNLIMITED",
  };

  const raw = denoEnvGet(keyByPlan[plan]);
  const value = raw?.trim();
  return value ? value : null;
}
