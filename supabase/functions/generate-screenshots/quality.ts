export function parseQualityScore(rawText: string): number | null {
  const trimmed = (rawText || "").trim();
  if (!trimmed) return null;
  const jsonCandidate = trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonCandidate) return null;

  try {
    const parsed = JSON.parse(jsonCandidate) as {
      overall_score?: number;
      score?: number;
      quality_score?: number;
    };
    const score = Number(parsed.overall_score ?? parsed.score ?? parsed.quality_score);
    if (Number.isFinite(score)) {
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  } catch {
    return null;
  }

  return null;
}
