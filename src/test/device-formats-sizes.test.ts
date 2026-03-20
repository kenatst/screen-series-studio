import { describe, expect, it } from "vitest";
import { DEVICE_FORMAT_LABELS, FORMAT_SUFFIX, SIZE_SLUG } from "../../shared/localization";
import { DEVICE_DIMENSIONS } from "../../supabase/functions/generate-screenshots/prompt-builder";

const ALL_FORMATS = ["iphone-6-5", "iphone-6-9", "ipad-12-9"] as const;

describe("shared localization device constants", () => {
  it("FORMAT_SUFFIX maps all device formats", () => {
    expect(FORMAT_SUFFIX["iphone-6-5"]).toBe("6-5");
    expect(FORMAT_SUFFIX["iphone-6-9"]).toBe("6-9");
    expect(FORMAT_SUFFIX["ipad-12-9"]).toBe("ipad");
  });

  it("SIZE_SLUG maps all device formats", () => {
    expect(SIZE_SLUG["iphone-6-5"]).toBe("6-5");
    expect(SIZE_SLUG["iphone-6-9"]).toBe("6-9");
    expect(SIZE_SLUG["ipad-12-9"]).toBe("12-9");
  });

  it("DEVICE_FORMAT_LABELS has human-readable labels for all formats", () => {
    expect(DEVICE_FORMAT_LABELS["iphone-6-5"]).toBe('6.5" iPhone');
    expect(DEVICE_FORMAT_LABELS["iphone-6-9"]).toBe('6.9" iPhone');
    expect(DEVICE_FORMAT_LABELS["ipad-12-9"]).toBe('12.9" iPad');
  });

  it("all constants cover the same set of formats", () => {
    const formatKeys = Object.keys(FORMAT_SUFFIX).sort();
    const sizeKeys = Object.keys(SIZE_SLUG).sort();
    const labelKeys = Object.keys(DEVICE_FORMAT_LABELS).sort();
    expect(formatKeys).toEqual(sizeKeys);
    expect(formatKeys).toEqual(labelKeys);
  });
});

describe("DEVICE_DIMENSIONS (prompt-builder)", () => {
  it("defines exact pixel dimensions for iPhone 6.5\"", () => {
    const dim = DEVICE_DIMENSIONS["iphone-6-5"];
    expect(dim.width).toBe(1242);
    expect(dim.height).toBe(2688);
    expect(dim.label).toContain("6.5");
  });

  it("defines exact pixel dimensions for iPhone 6.9\"", () => {
    const dim = DEVICE_DIMENSIONS["iphone-6-9"];
    expect(dim.width).toBe(1320);
    expect(dim.height).toBe(2868);
    expect(dim.label).toContain("6.9");
  });

  it("defines exact pixel dimensions for iPad 12.9\"", () => {
    const dim = DEVICE_DIMENSIONS["ipad-12-9"];
    expect(dim.width).toBe(2048);
    expect(dim.height).toBe(2732);
    expect(dim.label).toContain("12.9");
  });

  it("covers the same formats as shared localization", () => {
    for (const format of ALL_FORMATS) {
      expect(DEVICE_DIMENSIONS[format], `Missing DEVICE_DIMENSIONS[${format}]`).toBeDefined();
    }
  });

  it("iPhones have tall portrait aspect ratio (width < height)", () => {
    for (const format of ["iphone-6-5", "iphone-6-9"] as const) {
      const d = DEVICE_DIMENSIONS[format];
      expect(d.width).toBeLessThan(d.height);
      // Both iPhone formats are approximately 9:19.5 (standard iPhone ratio)
      const ratio = d.width / d.height;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.55);
    }
  });

  it("iPad has 3:4 portrait aspect ratio (approximately)", () => {
    const d = DEVICE_DIMENSIONS["ipad-12-9"];
    const ratio = d.width / d.height;
    expect(ratio).toBeCloseTo(3 / 4, 1);
  });
});
