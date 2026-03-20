import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBilling } from "@/hooks/useBilling";

const { invokeMock, toastMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "common.error") return "Error";
      if (key === "common.unknownError") return "Unknown error";
      return key;
    },
  }),
}));

describe("useBilling", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastMock.mockReset();
  });

  it("calls create-checkout with the requested plan", async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleUpgrade("starter", "/dashboard/settings");
    });

    expect(invokeMock).toHaveBeenCalledWith("create-checkout", {
      body: {
        plan: "starter",
        redirect_path: "/dashboard/settings",
      },
    });
  });

  it("shows an error toast when checkout fails", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Stripe unavailable" } });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleUpgrade("starter");
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        variant: "destructive",
      }),
    );
  });

  it("extracts the actual error from edge function response body", async () => {
    // supabase.functions.invoke returns both data (with error detail) and a generic error
    invokeMock.mockResolvedValue({
      data: { error: "Stripe secret is not set (STRIPE_SECRET_KEY or STRIPE_TEST_SECRET)" },
      error: { message: "Edge Function returned a non-2xx status code" },
    });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleUpgrade("pro");
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Stripe secret is not set (STRIPE_SECRET_KEY or STRIPE_TEST_SECRET)",
        variant: "destructive",
      }),
    );
  });

  it("shows actual error from customer-portal edge function", async () => {
    invokeMock.mockResolvedValue({
      data: { error: "No Stripe customer found for this user" },
      error: { message: "Edge Function returned a non-2xx status code" },
    });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "No Stripe customer found for this user",
        variant: "destructive",
      }),
    );
  });

  it("opens customer portal in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    invokeMock.mockResolvedValue({ data: { url: "https://example.com/portal" }, error: null });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(invokeMock).toHaveBeenCalledWith("customer-portal");
    expect(openSpy).toHaveBeenCalledWith("https://example.com/portal", "_blank");
    openSpy.mockRestore();
  });
});
