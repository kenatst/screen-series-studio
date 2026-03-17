import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function listAllObjectPaths(
  client: any,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error || !data?.length) break;

    for (const item of data) {
      const currentPath = `${prefix}/${item.name}`;
      if ((item as any).id === null) {
        const nested = await listAllObjectPaths(client, bucket, currentPath);
        paths.push(...nested);
      } else {
        paths.push(currentPath);
      }
    }

    if (data.length < 100) break;
    offset += data.length;
  }

  return paths;
}

async function removeInChunks(
  client: any,
  bucket: string,
  objectPaths: string[],
): Promise<void> {
  const chunkSize = 100;
  for (let i = 0; i < objectPaths.length; i += chunkSize) {
    const chunk = objectPaths.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      await client.storage.from(bucket).remove(chunk);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user with their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log(`[DELETE-ACCOUNT] Deleting user ${userId}`);

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Delete user's storage files
    try {
      const rawUploadPaths = await listAllObjectPaths(adminClient, "raw-uploads", userId);
      await removeInChunks(adminClient, "raw-uploads", rawUploadPaths);
    } catch { /* ignore */ }

    try {
      const outputPaths = await listAllObjectPaths(adminClient, "generated-outputs", userId);
      await removeInChunks(adminClient, "generated-outputs", outputPaths);
    } catch { /* ignore */ }

    // 2. Delete user from auth (cascades to profiles, projects, etc. via FK)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error(`[DELETE-ACCOUNT] Failed to delete user ${userId}:`, deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[DELETE-ACCOUNT] Successfully deleted user ${userId}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[DELETE-ACCOUNT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
