import { describe, expect, it, vi } from "vitest";
import { creditCreditsAtomic, debitCreditsAtomic } from "../../supabase/functions/_shared/credits";
import { claimFunctionIdempotency } from "../../supabase/functions/_shared/idempotency";
import { checkFunctionRateLimit } from "../../supabase/functions/_shared/rate-limit";

describe("shared edge helper RPC wrappers", () => {
  it("debits and credits atomically through RPC", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 4, error: null })
      .mockResolvedValueOnce({ data: [7], error: null });
    const adminClient = { rpc };

    const debited = await debitCreditsAtomic(adminClient, "user-1", 1);
    const credited = await creditCreditsAtomic(adminClient, "user-1", 3, 20);

    expect(debited).toBe(4);
    expect(credited).toBe(7);
    expect(rpc).toHaveBeenNthCalledWith(1, "debit_credits", {
      p_user_id: "user-1",
      p_amount: 1,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "credit_credits", {
      p_user_id: "user-1",
      p_amount: 3,
      p_cap: 20,
    });
  });

  it("returns null when numeric RPC payload is malformed", async () => {
    const adminClient = {
      rpc: vi.fn().mockResolvedValue({ data: { balance: 9 }, error: null }),
    };
    const result = await debitCreditsAtomic(adminClient, "user-1", 1);
    expect(result).toBeNull();
  });

  it("throws when credit RPC returns an error", async () => {
    const adminClient = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } }),
    };
    await expect(creditCreditsAtomic(adminClient, "user-1", 2)).rejects.toThrow("db error");
  });

  it("normalizes boolean rate-limit and idempotency responses", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: [false], error: null });
    const adminClient = { rpc };

    const withinLimit = await checkFunctionRateLimit(adminClient, "user-2", "translate-copy", 6);
    const claimed = await claimFunctionIdempotency(adminClient, "user-2", "generate-screenshots", "idem-1", 120);

    expect(withinLimit).toBe(true);
    expect(claimed).toBe(false);
  });
});
