import { describe, expect, it } from "vitest";
import { parseQualityScore } from "../../supabase/functions/generate-screenshots/quality";

describe("parseQualityScore", () => {
  it("returns null for non-json text", () => {
    expect(parseQualityScore("not json")).toBeNull();
  });

  it("clamps and rounds score", () => {
    expect(parseQualityScore('{"overall_score":72.4}')).toBe(72);
    expect(parseQualityScore('{"quality_score":500}')).toBe(100);
    expect(parseQualityScore('{"score":-5}')).toBe(0);
  });
});
