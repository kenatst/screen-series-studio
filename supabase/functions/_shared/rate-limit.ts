type SupabaseAdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function normalizeRpcBoolean(data: unknown): boolean {
  if (typeof data === "boolean") return data;
  if (Array.isArray(data) && typeof data[0] === "boolean") return data[0];
  return false;
}

export async function checkFunctionRateLimit(
  adminClient: SupabaseAdminClient,
  userId: string,
  functionName: string,
  limitPerWindow: number,
  windowSeconds = 60,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("check_function_rate_limit", {
    p_user_id: userId,
    p_function_name: functionName,
    p_limit: limitPerWindow,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRpcBoolean(data);
}
