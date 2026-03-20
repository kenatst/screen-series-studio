import { describe, expect, it, vi } from "vitest";
import {
  creditsCapForPlan,
  getConfiguredPriceId,
  PLAN_CREDITS,
  PLAN_DEFS,
  PRODUCT_NAME_TO_PLAN,
  toPlanId,
} from "../../supabase/functions/_shared/billing";
import { creditCreditsAtomic, debitCreditsAtomic } from "../../supabase/functions/_shared/credits";
import { checkFunctionRateLimit } from "../../supabase/functions/_shared/rate-limit";
import { claimFunctionIdempotency } from "../../supabase/functions/_shared/idempotency";

describe("PLAN_CREDITS", () => {
  it("defines credits for all 4 plans", () => {
    expect(PLAN_CREDITS.free).toBe(3);
    expect(PLAN_CREDITS.starter).toBe(50);
    expect(PLAN_CREDITS.pro).toBe(200);
    expect(PLAN_CREDITS.unlimited).toBe(1000);
  });
});

describe("PRODUCT_NAME_TO_PLAN", () => {
  it("maps Stripe product names to plan IDs", () => {
    expect(PRODUCT_NAME_TO_PLAN["ShotApp Starter"]).toBe("starter");
    expect(PRODUCT_NAME_TO_PLAN["ShotApp Pro"]).toBe("pro");
    expect(PRODUCT_NAME_TO_PLAN["ShotApp Unlimited"]).toBe("unlimited");
  });

  it("does not map free plan (no product)", () => {
    expect(Object.values(PRODUCT_NAME_TO_PLAN)).not.toContain("free");
  });
});

describe("PLAN_DEFS", () => {
  it("defines paid plans with correct amounts in cents", () => {
    expect(PLAN_DEFS.starter.amount).toBe(4900);
    expect(PLAN_DEFS.pro.amount).toBe(9900);
    expect(PLAN_DEFS.unlimited.amount).toBe(39900);
  });

  it("all paid plans have name and description", () => {
    for (const plan of Object.values(PLAN_DEFS)) {
      expect(plan.name).toBeTruthy();
      expect(plan.description).toBeTruthy();
    }
  });

  it("plan names match PRODUCT_NAME_TO_PLAN keys", () => {
    for (const def of Object.values(PLAN_DEFS)) {
      expect(PRODUCT_NAME_TO_PLAN[def.name]).toBeDefined();
    }
  });
});

describe("toPlanId", () => {
  it("returns valid plan IDs unchanged", () => {
    expect(toPlanId("free")).toBe("free");
    expect(toPlanId("starter")).toBe("starter");
    expect(toPlanId("pro")).toBe("pro");
    expect(toPlanId("unlimited")).toBe("unlimited");
  });

  it("defaults unknown values to free", () => {
    expect(toPlanId("enterprise")).toBe("free");
    expect(toPlanId("basic")).toBe("free");
    expect(toPlanId("")).toBe("free");
  });

  it("defaults null and undefined to free", () => {
    expect(toPlanId(null)).toBe("free");
    expect(toPlanId(undefined)).toBe("free");
  });
});

describe("creditsCapForPlan", () => {
  it("returns 2x monthly credits for each plan", () => {
    expect(creditsCapForPlan("free")).toBe(6);
    expect(creditsCapForPlan("starter")).toBe(100);
    expect(creditsCapForPlan("pro")).toBe(400);
    expect(creditsCapForPlan("unlimited")).toBe(2000);
  });
});

describe("getConfiguredPriceId", () => {
  it("returns null when Deno env is unavailable", () => {
    expect(getConfiguredPriceId("starter")).toBeNull();
    expect(getConfiguredPriceId("pro")).toBeNull();
    expect(getConfiguredPriceId("unlimited")).toBeNull();
  });
});

describe("debitCreditsAtomic", () => {
  it("returns normalized number from RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 42, error: null });
    const result = await debitCreditsAtomic({ rpc }, "user-1", 5);
    expect(result).toBe(42);
    expect(rpc).toHaveBeenCalledWith("debit_credits", {
      p_user_id: "user-1",
      p_amount: 5,
    });
  });

  it("handles array response from RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [15], error: null });
    const result = await debitCreditsAtomic({ rpc }, "user-1", 3);
    expect(result).toBe(15);
  });

  it("returns null for non-numeric response", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "not a number", error: null });
    const result = await debitCreditsAtomic({ rpc }, "user-1", 1);
    expect(result).toBeNull();
  });

  it("throws on RPC error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "insufficient credits" } });
    await expect(debitCreditsAtomic({ rpc }, "user-1", 10)).rejects.toThrow("insufficient credits");
  });
});

describe("creditCreditsAtomic", () => {
  it("returns normalized number from RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 50, error: null });
    const result = await creditCreditsAtomic({ rpc }, "user-1", 10, 100);
    expect(result).toBe(50);
    expect(rpc).toHaveBeenCalledWith("credit_credits", {
      p_user_id: "user-1",
      p_amount: 10,
      p_cap: 100,
    });
  });

  it("sends null cap when not provided", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 30, error: null });
    await creditCreditsAtomic({ rpc }, "user-1", 5);
    expect(rpc).toHaveBeenCalledWith("credit_credits", {
      p_user_id: "user-1",
      p_amount: 5,
      p_cap: null,
    });
  });

  it("throws on RPC error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } });
    await expect(creditCreditsAtomic({ rpc }, "user-1", 2)).rejects.toThrow("db error");
  });
});

describe("checkFunctionRateLimit", () => {
  it("returns true when within limit", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const result = await checkFunctionRateLimit({ rpc }, "user-1", "generate-screenshots", 5, 60);
    expect(result).toBe(true);
    expect(rpc).toHaveBeenCalledWith("check_function_rate_limit", {
      p_user_id: "user-1",
      p_function_name: "generate-screenshots",
      p_limit: 5,
      p_window_seconds: 60,
    });
  });

  it("returns false when rate limited (array response)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [false], error: null });
    const result = await checkFunctionRateLimit({ rpc }, "user-1", "translate-copy", 3);
    expect(result).toBe(false);
  });

  it("returns false for non-boolean response", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "weird", error: null });
    const result = await checkFunctionRateLimit({ rpc }, "user-1", "fn", 5);
    expect(result).toBe(false);
  });

  it("throws on RPC error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    await expect(checkFunctionRateLimit({ rpc }, "user-1", "fn", 5)).rejects.toThrow("rpc failed");
  });
});

describe("claimFunctionIdempotency", () => {
  it("returns true when claim succeeded", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const result = await claimFunctionIdempotency({ rpc }, "user-1", "generate-screenshots", "key-123", 120);
    expect(result).toBe(true);
    expect(rpc).toHaveBeenCalledWith("claim_function_idempotency", {
      p_user_id: "user-1",
      p_function_name: "generate-screenshots",
      p_idempotency_key: "key-123",
      p_ttl_seconds: 120,
    });
  });

  it("returns false when claim was already taken", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const result = await claimFunctionIdempotency({ rpc }, "user-1", "fn", "key-456");
    expect(result).toBe(false);
  });

  it("handles array boolean response", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [true], error: null });
    const result = await claimFunctionIdempotency({ rpc }, "user-1", "fn", "key-789");
    expect(result).toBe(true);
  });

  it("throws on RPC error", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "lock error" } });
    await expect(claimFunctionIdempotency({ rpc }, "user-1", "fn", "key")).rejects.toThrow("lock error");
  });
});
