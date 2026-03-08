import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { Readable } from "node:stream";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Creates a simple ZIP file from an array of files.
 * Each file: { name: string, data: Uint8Array }
 * Uses the "stored" method (no compression) for simplicity and speed.
 */
function createZipBuffer(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);

    // Local file header (30 + nameLen + dataLen)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header sig
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: stored
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, 0, true); // crc-32 (skip for simplicity)
    lv.setUint32(18, file.data.length, true); // compressed size
    lv.setUint32(22, file.data.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field length
    localHeader.set(nameBytes, 30);

    // Central directory header
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // central dir sig
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, 0, true); // crc-32
    cv.setUint32(20, file.data.length, true); // compressed
    cv.setUint32(24, file.data.length, true); // uncompressed
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra field length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attributes
    cv.setUint32(38, 0, true); // external attributes
    cv.setUint32(42, offset, true); // local header offset
    centralHeader.set(nameBytes, 46);

    localHeaders.push(localHeader);
    localHeaders.push(file.data);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + file.data.length;
  }

  // End of central directory
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD sig
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // disk with CD
  ev.setUint16(8, files.length, true); // entries on disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, centralDirSize, true); // CD size
  ev.setUint32(16, offset, true); // CD offset
  ev.setUint16(20, 0, true); // comment length

  // Combine all parts
  const totalSize = offset + centralDirSize + 22;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of localHeaders) {
    result.set(part, pos);
    pos += part.length;
  }
  for (const part of centralHeaders) {
    result.set(part, pos);
    pos += part.length;
  }
  result.set(eocd, pos);

  return result;
}

function createWatermarkSvgBytes(width = 1290, height = 2796): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <pattern id="wm" patternUnits="userSpaceOnUse" width="400" height="300" patternTransform="rotate(-30)">
        <text x="10" y="150" font-family="Arial,sans-serif" font-size="48" font-weight="900" fill="rgba(255,255,255,0.15)" letter-spacing="8">ScreenForge</text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)"/>
  </svg>`;
  return new TextEncoder().encode(svg);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { data: profile } = await userClient.from("profiles").select("plan").eq("id", userId).single();
    const userPlan = profile?.plan || "free";
    const isWatermarked = userPlan === "free";

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const locale = url.searchParams.get("locale") || "en-US";

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projError } = await userClient.from("projects").select("id, name, device_formats").eq("id", projectId).single();
    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: slides } = await userClient.from("project_slides").select("slide_number, image_url").eq("project_id", projectId).eq("status", "completed").order("slide_number");
    if (!slides?.length) {
      return new Response(JSON.stringify({ error: "No completed slides" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const deviceFormats = (project.device_formats as string[]) || ["iphone-6-9"];
    const safeName = (project.name || "project").replace(/[^a-zA-Z0-9-_]/g, "_");

    // Collect files for ZIP
    const zipFiles: { name: string; data: Uint8Array }[] = [];

    for (const slide of slides) {
      for (const format of deviceFormats) {
        const storagePath = `${userId}/${projectId}/slide-${slide.slide_number}.png`;
        const { data: fileData } = await adminClient.storage.from("generated-outputs").download(storagePath);

        if (fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const imageData = new Uint8Array(arrayBuffer);
          const paddedNum = String(slide.slide_number).padStart(2, "0");
          const fileName = `${safeName}/${locale}/${format}/${paddedNum}_slide.png`;
          zipFiles.push({ name: fileName, data: imageData });
        }
      }
    }

    // Add watermark overlay for free plan
    if (isWatermarked) {
      const watermarkData = createWatermarkSvgBytes();
      zipFiles.push({ name: `${safeName}/watermark-overlay.svg`, data: watermarkData });
    }

    if (zipFiles.length === 0) {
      return new Response(JSON.stringify({ error: "No files to export" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create ZIP
    const zipBuffer = createZipBuffer(zipFiles);

    return new Response(zipBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}-${locale}.zip"`,
      },
    });
  } catch (error: any) {
    console.error("export-zip error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
