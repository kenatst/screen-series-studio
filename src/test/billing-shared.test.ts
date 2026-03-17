import { describe, expect, it } from "vitest";
import { PLAN_CREDITS, creditsCapForPlan, getConfiguredPriceId, toPlanId } from "../../supabase/functions/_shared/billing";

describe("shared billing helpers", () => {
  it("maps unknown plans to free", () => {
    expect(toPlanId(undefined)).toBe("free");
    expect(toPlanId(null)).toBe("free");
    expect(toPlanId("enterprise")).toBe("free");
  });

  it("keeps known plan ids unchanged", () => {
    expect(toPlanId("starter")).toBe("starter");
    expect(toPlanId("pro")).toBe("pro");
    expect(toPlanId("unlimited")).toBe("unlimited");
    expect(toPlanId("free")).toBe("free");
  });

  it("calculates credit caps as 2x monthly credits", () => {
    expect(creditsCapForPlan("free")).toBe(PLAN_CREDITS.free * 2);
    expect(creditsCapForPlan("starter")).toBe(PLAN_CREDITS.starter * 2);
    expect(creditsCapForPlan("pro")).toBe(PLAN_CREDITS.pro * 2);
    expect(creditsCapForPlan("unlimited")).toBe(PLAN_CREDITS.unlimited * 2);
  });

  it("returns null configured prices when Deno env is unavailable", () => {
    expect(getConfiguredPriceId("starter")).toBeNull();
    expect(getConfiguredPriceId("pro")).toBeNull();
    expect(getConfiguredPriceId("unlimited")).toBeNull();
  });
});
