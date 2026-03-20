import { describe, expect, it } from "vitest";
import { parseQualityScore } from "../../supabase/functions/generate-screenshots/quality";

describe("parseQualityScore – comprehensive", () => {
  it("returns null for empty string", () => {
    expect(parseQualityScore("")).toBeNull();
  });

  it("returns null for plain text without JSON", () => {
    expect(parseQualityScore("This is just a comment")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseQualityScore("{broken json}")).toBeNull();
  });

  it("extracts overall_score", () => {
    expect(parseQualityScore('{"overall_score": 85}')).toBe(85);
  });

  it("extracts score field", () => {
    expect(parseQualityScore('{"score": 72}')).toBe(72);
  });

  it("extracts quality_score field", () => {
    expect(parseQualityScore('{"quality_score": 91}')).toBe(91);
  });

  it("prefers overall_score over other fields", () => {
    expect(parseQualityScore('{"overall_score": 80, "score": 90, "quality_score": 70}')).toBe(80);
  });

  it("rounds decimal scores", () => {
    expect(parseQualityScore('{"overall_score": 72.4}')).toBe(72);
    expect(parseQualityScore('{"overall_score": 72.6}')).toBe(73);
    expect(parseQualityScore('{"overall_score": 72.5}')).toBe(73);
  });

  it("clamps score at 100 maximum", () => {
    expect(parseQualityScore('{"overall_score": 150}')).toBe(100);
    expect(parseQualityScore('{"quality_score": 500}')).toBe(100);
  });

  it("clamps score at 0 minimum", () => {
    expect(parseQualityScore('{"score": -5}')).toBe(0);
    expect(parseQualityScore('{"overall_score": -100}')).toBe(0);
  });

  it("extracts JSON embedded in surrounding text", () => {
    expect(parseQualityScore('Here is my analysis: {"overall_score": 88} end of analysis.')).toBe(88);
  });

  it("handles JSON with extra fields", () => {
    expect(
      parseQualityScore('{"overall_score": 77, "composition": "good", "text_quality": "excellent"}'),
    ).toBe(77);
  });

  it("returns null when score field is missing entirely", () => {
    expect(parseQualityScore('{"composition": "good"}')).toBeNull();
  });

  it("handles zero score", () => {
    expect(parseQualityScore('{"overall_score": 0}')).toBe(0);
  });

  it("handles score of exactly 100", () => {
    expect(parseQualityScore('{"overall_score": 100}')).toBe(100);
  });
});
