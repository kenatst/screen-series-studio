/**
 * Client-side image resizing to exact App Store pixel dimensions.
 * Uses HTML Canvas for high-quality bilinear interpolation.
 */

export const DEVICE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  "iphone-6-5": { width: 1242, height: 2688, label: '6.5" iPhone (1242×2688)' },
  "iphone-6-9": { width: 1320, height: 2868, label: '6.9" iPhone (1320×2868)' },
  "ipad-12-9":  { width: 2048, height: 2732, label: '12.9" iPad (2048×2732)' },
};

/**
 * Resize an image blob to exact App Store dimensions for a given device format.
 * Returns a new PNG blob at the target resolution.
 */
export async function resizeImageForDevice(
  imageBlob: Blob,
  deviceFormat: string
): Promise<Blob> {
  const dims = DEVICE_DIMENSIONS[deviceFormat];
  if (!dims) return imageBlob; // Unknown format, return as-is

  const img = await createImageFromBlob(imageBlob);

  // If already at exact dimensions, skip resize
  if (img.naturalWidth === dims.width && img.naturalHeight === dims.height) {
    return imageBlob;
  }

  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return imageBlob;

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Calculate scaling to fill the target dimensions while maintaining aspect ratio
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = dims.width / dims.height;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (Math.abs(srcAspect - dstAspect) > 0.01) {
    // Aspect ratios differ slightly — crop to fit (center crop)
    if (srcAspect > dstAspect) {
      // Source is wider: crop sides
      sw = Math.round(img.naturalHeight * dstAspect);
      sx = Math.round((img.naturalWidth - sw) / 2);
    } else {
      // Source is taller: crop top/bottom
      sh = Math.round(img.naturalWidth / dstAspect);
      sy = Math.round((img.naturalHeight - sh) / 2);
    }
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dims.width, dims.height);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || imageBlob),
      "image/png",
      1.0
    );
  });
}

function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(blob);
  });
}
