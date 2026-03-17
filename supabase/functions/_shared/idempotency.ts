type SupabaseAdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function normalizeRpcBoolean(data: unknown): boolean {
  if (typeof data === "boolean") return data;
  if (Array.isArray(data) && typeof data[0] === "boolean") return data[0];
  return false;
}

export async function claimFunctionIdempotency(
  adminClient: SupabaseAdminClient,
  userId: string,
  functionName: string,
  idempotencyKey: string,
  ttlSeconds = 120,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("claim_function_idempotency", {
    p_user_id: userId,
    p_function_name: functionName,
    p_idempotency_key: idempotencyKey,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRpcBoolean(data);
}
