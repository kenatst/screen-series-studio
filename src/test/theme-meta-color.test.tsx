import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeMetaColor } from "@/components/theme/ThemeMetaColor";

const { useThemeMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

describe("ThemeMetaColor", () => {
  beforeEach(() => {
    useThemeMock.mockReset();
    document.querySelector('meta[name="theme-color"]')?.remove();
  });

  it("creates and sets a light theme color meta tag", async () => {
    useThemeMock.mockReturnValue({ resolvedTheme: "light" });

    render(<ThemeMetaColor />);

    await waitFor(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta?.getAttribute("content")).toBe("#fcfbf8");
    });
  });

  it("updates theme color for dark mode", async () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", "#ffffff");
    document.head.appendChild(meta);
    useThemeMock.mockReturnValue({ resolvedTheme: "dark" });

    render(<ThemeMetaColor />);

    await waitFor(() => {
      const updated = document.querySelector('meta[name="theme-color"]');
      expect(updated?.getAttribute("content")).toBe("#0d0d0f");
    });
  });
});
