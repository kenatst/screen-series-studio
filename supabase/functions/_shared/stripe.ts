export function getStripeSecretKey(): string {
  return Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_TEST_SECRET") || "";
}

const DEFAULT_SITE_ORIGIN = "https://shotapp.ai";

function toOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();
  const configured = Deno.env.get("ALLOWED_ORIGINS") || "";
  for (const raw of configured.split(",")) {
    const origin = toOrigin(raw.trim());
    if (origin) allowed.add(origin);
  }
  const siteOrigin = toOrigin(Deno.env.get("SITE_URL"));
  if (siteOrigin) allowed.add(siteOrigin);
  return allowed;
}

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function resolveSiteOrigin(requestOrigin: string | null): string {
  const fallback = toOrigin(Deno.env.get("SITE_URL")) || DEFAULT_SITE_ORIGIN;
  const candidate = toOrigin(requestOrigin);
  if (!candidate) return fallback;

  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.has(candidate) || isLocalDevOrigin(candidate)) {
    return candidate;
  }

  return fallback;
}
