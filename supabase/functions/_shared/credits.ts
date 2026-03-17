type SupabaseAdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function normalizeRpcNumber(data: unknown): number | null {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (Array.isArray(data) && typeof data[0] === "number" && Number.isFinite(data[0])) return data[0];
  return null;
}

export async function debitCreditsAtomic(
  adminClient: SupabaseAdminClient,
  userId: string,
  amount: number,
): Promise<number | null> {
  const { data, error } = await adminClient.rpc("debit_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw new Error(error.message);
  return normalizeRpcNumber(data);
}

export async function creditCreditsAtomic(
  adminClient: SupabaseAdminClient,
  userId: string,
  amount: number,
  cap?: number,
): Promise<number | null> {
  const { data, error } = await adminClient.rpc("credit_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_cap: cap ?? null,
  });

  if (error) throw new Error(error.message);
  return normalizeRpcNumber(data);
}
