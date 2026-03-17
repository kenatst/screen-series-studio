import { describe, expect, it } from "vitest";
import { isStoragePath } from "@/lib/storage-utils";

describe("isStoragePath", () => {
  it("returns false for full urls", () => {
    expect(isStoragePath("https://cdn.example.com/image.png")).toBe(false);
    expect(isStoragePath("http://cdn.example.com/image.png")).toBe(false);
  });

  it("returns true for storage object paths", () => {
    expect(isStoragePath("user-id/project-id/slide-1.png")).toBe(true);
  });

  it("returns false for empty values", () => {
    expect(isStoragePath("")).toBe(false);
    expect(isStoragePath(null)).toBe(false);
    expect(isStoragePath(undefined)).toBe(false);
  });
});
