import { describe, expect, it } from "vitest";
import {
  CREDIT_COSTS,
  PLANS,
  canCreateProject,
  canRegenerate,
  canTranslate,
  getMaxSlides,
  getPlanById,
} from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

describe("PLANS configuration", () => {
  const allPlanIds: PlanId[] = ["free", "starter", "pro", "unlimited"];

  it("defines exactly 4 plans", () => {
    expect(PLANS).toHaveLength(4);
  });

  it("assigns unique IDs to every plan", () => {
    const ids = PLANS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly one popular plan (Pro)", () => {
    const popular = PLANS.filter((p) => p.popular);
    expect(popular).toHaveLength(1);
    expect(popular[0].id).toBe("pro");
  });

  it("has increasing monthly credits across tiers", () => {
    const credits = PLANS.map((p) => p.monthlyCredits);
    expect(credits).toEqual([3, 50, 200, 1000]);
  });

  it("has increasing price values across tiers", () => {
    const prices = PLANS.map((p) => p.priceValue);
    expect(prices).toEqual([0, 4900, 9900, 39900]);
  });

  it("free plan has watermark, paid plans do not", () => {
    expect(PLANS[0].limits.watermark).toBe(true);
    PLANS.slice(1).forEach((plan) => {
      expect(plan.limits.watermark, `${plan.id} should have no watermark`).toBe(false);
    });
  });

  it("free plan has no HD export, paid plans do", () => {
    expect(PLANS[0].limits.hdExport).toBe(false);
    PLANS.slice(1).forEach((plan) => {
      expect(plan.limits.hdExport, `${plan.id} should have HD export`).toBe(true);
    });
  });

  it("all plans support translations", () => {
    PLANS.forEach((plan) => {
      expect(plan.limits.translations, `${plan.id} should support translations`).toBe(true);
    });
  });

  it("only unlimited plan has unlimited translations", () => {
    expect(PLANS.find((p) => p.id === "unlimited")!.limits.unlimitedTranslations).toBe(true);
    PLANS.filter((p) => p.id !== "unlimited").forEach((plan) => {
      expect(plan.limits.unlimitedTranslations, `${plan.id}`).toBe(false);
    });
  });

  it("free plan has no Brand Kit, paid plans do", () => {
    expect(PLANS[0].limits.brandKit).toBe(false);
    PLANS.slice(1).forEach((plan) => {
      expect(plan.limits.brandKit, `${plan.id}`).toBe(true);
    });
  });

  it("only pro and unlimited have priority generation", () => {
    expect(getPlanById("free").limits.priorityGeneration).toBe(false);
    expect(getPlanById("starter").limits.priorityGeneration).toBe(false);
    expect(getPlanById("pro").limits.priorityGeneration).toBe(true);
    expect(getPlanById("unlimited").limits.priorityGeneration).toBe(true);
  });

  it("max slides per set is 3 for free, 10 for all paid", () => {
    expect(getMaxSlides("free")).toBe(3);
    expect(getMaxSlides("starter")).toBe(10);
    expect(getMaxSlides("pro")).toBe(10);
    expect(getMaxSlides("unlimited")).toBe(10);
  });

  it("unlimited plan uses -1 for unbounded limits", () => {
    const unlimited = getPlanById("unlimited");
    expect(unlimited.limits.maxProjects).toBe(-1);
    expect(unlimited.limits.redesigns).toBe(-1);
  });

  it("every plan has non-empty features array", () => {
    PLANS.forEach((plan) => {
      expect(plan.features.length, `${plan.id}`).toBeGreaterThan(0);
    });
  });

  it("every plan has a CTA string", () => {
    PLANS.forEach((plan) => {
      expect(plan.cta, `${plan.id}`).toBeTruthy();
    });
  });
});

describe("CREDIT_COSTS", () => {
  it("charges 1 credit for all generation actions", () => {
    expect(CREDIT_COSTS.generateSlide).toBe(1);
    expect(CREDIT_COSTS.regenerateSlide).toBe(1);
    expect(CREDIT_COSTS.resizeSlide).toBe(1);
    expect(CREDIT_COSTS.translateSlide).toBe(1);
    expect(CREDIT_COSTS.suggestCopy).toBe(1);
  });

  it("export is free", () => {
    expect(CREDIT_COSTS.exportSet).toBe(0);
  });
});

describe("getPlanById", () => {
  it("returns matching plan for valid IDs", () => {
    expect(getPlanById("free").id).toBe("free");
    expect(getPlanById("starter").id).toBe("starter");
    expect(getPlanById("pro").id).toBe("pro");
    expect(getPlanById("unlimited").id).toBe("unlimited");
  });

  it("falls back to free for unknown plan ID", () => {
    expect(getPlanById("enterprise" as PlanId).id).toBe("free");
  });
});

describe("canCreateProject", () => {
  it("free plan allows 1 project", () => {
    expect(canCreateProject("free", 0)).toBe(true);
    expect(canCreateProject("free", 1)).toBe(false);
  });

  it("starter plan allows 1 project", () => {
    expect(canCreateProject("starter", 0)).toBe(true);
    expect(canCreateProject("starter", 1)).toBe(false);
  });

  it("pro plan allows 3 projects", () => {
    expect(canCreateProject("pro", 0)).toBe(true);
    expect(canCreateProject("pro", 2)).toBe(true);
    expect(canCreateProject("pro", 3)).toBe(false);
  });

  it("unlimited plan allows any number of projects", () => {
    expect(canCreateProject("unlimited", 0)).toBe(true);
    expect(canCreateProject("unlimited", 100)).toBe(true);
    expect(canCreateProject("unlimited", 999)).toBe(true);
  });
});

describe("canTranslate", () => {
  it("returns true for all plans", () => {
    expect(canTranslate("free")).toBe(true);
    expect(canTranslate("starter")).toBe(true);
    expect(canTranslate("pro")).toBe(true);
    expect(canTranslate("unlimited")).toBe(true);
  });
});

describe("canRegenerate", () => {
  it("returns true for all plans", () => {
    expect(canRegenerate("free")).toBe(true);
    expect(canRegenerate("starter")).toBe(true);
    expect(canRegenerate("pro")).toBe(true);
    expect(canRegenerate("unlimited")).toBe(true);
  });
});
